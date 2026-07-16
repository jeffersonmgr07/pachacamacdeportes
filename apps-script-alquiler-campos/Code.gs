/**
 * Pacha Deportes - Reserva pública de campos deportivos
 * Proyecto independiente de Google Apps Script vinculado a la misma Google Sheet.
 * Zona horaria recomendada del proyecto: America/Lima.
 */
const RENTAL_CFG = {
  SPREADSHEET_ID: '', // Déjalo vacío si el script está vinculado a la hoja. Si es independiente, pega el ID.
  ADMIN_EMAIL: 'pachacamacdeportes@gmail.com',
  TIMEZONE: 'America/Lima',
  OPEN_HOUR: 8,
  CLOSE_HOUR: 23,
  CASHIER_OPEN_HOUR: 8,
  CASHIER_CLOSE_HOUR: 17,
  GRACE_MINUTES: 10,
  NEAR_DAYS: 7,
  SHEETS: { VENUES:'Campos_Deportivos', RESERVATIONS:'Reservas_Campos' }
};

function doGet(e) {
  const callback = String((e && e.parameter && e.parameter.callback) || 'callback').replace(/[^a-zA-Z0-9_$]/g, '');
  try {
    const action = String((e.parameter && e.parameter.action) || '');
    const payload = JSON.parse((e.parameter && e.parameter.payload) || '{}');
    const result = routeRentalAction_(action, payload);
    return jsonp_(callback, result);
  } catch (err) {
    return jsonp_(callback, {ok:false, message:err && err.message ? err.message : String(err)});
  }
}

function routeRentalAction_(action, payload) {
  ensureRentalSheets_();
  expireReservations_();
  switch (action) {
    case 'getVenues': return getVenues_();
    case 'getAvailability': return getAvailability_(payload);
    case 'createReservation': return createReservation_(payload);
    case 'lookupReservation': return lookupReservation_(payload);
    default: throw new Error('Acción de reservas no válida.');
  }
}

function setupRentalSystem() {
  ensureRentalSheets_();
  installRentalTriggers_();
  SpreadsheetApp.getUi().alert('Sistema de alquiler configurado. Revisa las hojas Campos_Deportivos y Reservas_Campos.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Alquiler de campos')
    .addItem('Configurar sistema', 'setupRentalSystem')
    .addItem('Abrir panel de caja', 'showCashierSidebar')
    .addItem('Liberar reservas vencidas', 'expireReservationsManual')
    .addToUi();
}

function showCashierSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Cashier').setTitle('Caja - Campos deportivos');
  SpreadsheetApp.getUi().showSidebar(html);
}

function cashierLookup(code) {
  ensureRentalSheets_(); expireReservations_();
  const r = findReservation_(code);
  if (!r) return {ok:false,message:'No se encontró la reserva.'};
  return {ok:true,reservation:publicReservation_(r)};
}

function cashierConfirmPayment(code, receiptNumber) {
  ensureRentalSheets_(); expireReservations_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const r = findReservation_(code);
    if (!r) throw new Error('La reserva no existe o ya fue eliminada.');
    const now = new Date();
    if (String(r.status).toUpperCase() === 'PAGADO') return {ok:true,message:'La reserva ya estaba pagada.',reservation:publicReservation_(r)};
    if (!['PENDIENTE','GRACIA'].includes(String(r.status).toUpperCase())) throw new Error('La reserva ya no admite pago.');
    if (now > new Date(r.graceDeadline)) throw new Error('El plazo de pago y los 10 minutos de gracia ya vencieron. El cliente debe generar una nueva reserva.');
    updateReservationFields_(r._row, {status:'PAGADO', paidAt:now, receiptNumber:clean_(receiptNumber), confirmedBy:Session.getActiveUser().getEmail() || 'CAJA', confirmationEmailSent:false});
    const updated = findReservation_(code);
    sendPaymentConfirmation_(updated);
    return {ok:true,message:'Pago confirmado y correo enviado.',reservation:publicReservation_(updated)};
  } finally { lock.releaseLock(); }
}

function expireReservationsManual() {
  const count = expireReservations_();
  SpreadsheetApp.getUi().alert(count + ' reserva(s) vencida(s) liberada(s).');
}

function getVenues_() {
  return {ok:true, serverNow:new Date().toISOString(), venues:rowsObjects_(RENTAL_CFG.SHEETS.VENUES).map(v=>({venueId:v.venueId,name:v.name,type:v.type,active:bool_(v.active)}))};
}

function getAvailability_(p) {
  const venueId=clean_(p.venueId), start=parseLocal_(p.startDate+'T00:00:00'), end=parseLocal_(p.endDate+'T23:59:59');
  if(!venueId || isNaN(start) || isNaN(end)) throw new Error('Rango de consulta inválido.');
  const bookings=rowsObjects_(RENTAL_CFG.SHEETS.RESERVATIONS).filter(r=>String(r.venueId)===venueId && ['PENDIENTE','GRACIA','PAGADO'].includes(String(r.status).toUpperCase()) && new Date(r.startDateTime)<=end && new Date(r.endDateTime)>=start).map(publicReservation_);
  return {ok:true,serverNow:new Date().toISOString(),bookings};
}

function createReservation_(p) {
  validateApplicant_(p);
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try {
    expireReservations_();
    const venue=rowsObjects_(RENTAL_CFG.SHEETS.VENUES).find(v=>String(v.venueId)===String(p.venueId) && bool_(v.active));
    if(!venue) throw new Error('El espacio seleccionado todavía no está habilitado.');
    const start=parseLocal_(p.startDateTime), end=parseLocal_(p.endDateTime), now=new Date();
    if(isNaN(start)||isNaN(end)||end<=start) throw new Error('Horario inválido.');
    if(start<=now) throw new Error('No se puede reservar un horario que ya comenzó.');
    if(start.getMinutes()!==0||end.getMinutes()!==0) throw new Error('Las reservas deben comenzar y terminar en horas exactas.');
    if(start.getHours()<RENTAL_CFG.OPEN_HOUR||end.getHours()>RENTAL_CFG.CLOSE_HOUR) throw new Error('El horario permitido es de 8:00 a. m. a 11:00 p. m.');
    if(localDateKey_(start)!==localDateKey_(end)) throw new Error('La reserva debe realizarse dentro del mismo día.');
    if(!canPayBeforeEvent_(now,start)) throw new Error('No es posible completar el pago antes de este horario porque la caja municipal está cerrada. Selecciona una fecha posterior.');
    const conflict=rowsObjects_(RENTAL_CFG.SHEETS.RESERVATIONS).find(r=>String(r.venueId)===String(p.venueId)&&['PENDIENTE','GRACIA','PAGADO'].includes(String(r.status).toUpperCase())&&new Date(r.startDateTime)<end&&new Date(r.endDateTime)>start);
    if(conflict) throw new Error('Una de las horas seleccionadas acaba de ser reservada. Actualiza la agenda y elige otro horario.');
    const total=calculateTotal_(start,end); const deadline=paymentDeadline_(now,start); const grace=new Date(deadline.getTime()+RENTAL_CFG.GRACE_MINUTES*60000); const code=makeCode_(); const createdAt=new Date();
    sheet_(RENTAL_CFG.SHEETS.RESERVATIONS).appendRow([code,venue.venueId,venue.name,start,end,hoursBetween_(start,end),total,clean_(p.firstName),clean_(p.lastName),digits_(p.dni),clean_(p.email).toLowerCase(),clean_(p.phone),'PENDIENTE',createdAt,deadline,grace,'',false,'','',false,'']);
    const r=findReservation_(code); sendReservationCreated_(r);
    return {ok:true,reservationCode:code,venueName:venue.name,startDateTime:start.toISOString(),endDateTime:end.toISOString(),total,paymentDeadline:deadline.toISOString(),graceDeadline:grace.toISOString()};
  } finally { lock.releaseLock(); }
}

function lookupReservation_(p) { const r=findReservation_(p.reservationCode); return r?{ok:true,reservation:publicReservation_(r)}:{ok:false,message:'Reserva no encontrada.'}; }

function paymentDeadline_(now,eventStart) {
  const dayDiff=Math.floor((startDay_(eventStart)-startDay_(now))/86400000);
  if (localDateKey_(now)===localDateKey_(eventStart)) return new Date(now.getTime()+10*60000);
  if (isCashierOpen_(now) && dayDiff<=RENTAL_CFG.NEAR_DAYS) return new Date(now.getTime()+30*60000);
  if (!isCashierOpen_(now) || dayDiff>RENTAL_CFG.NEAR_DAYS) return nextBusinessDeadline_(now,eventStart);
  return new Date(now.getTime()+30*60000);
}

function nextBusinessDeadline_(now,eventStart) {
  let d=new Date(now); d.setHours(0,0,0,0);
  if(isBusinessDay_(d) && now.getHours()<RENTAL_CFG.CASHIER_OPEN_HOUR) { d.setHours(RENTAL_CFG.CASHIER_CLOSE_HOUR,0,0,0); }
  else { do { d.setDate(d.getDate()+1); } while(!isBusinessDay_(d)); d.setHours(RENTAL_CFG.CASHIER_CLOSE_HOUR,0,0,0); }
  const latest=new Date(eventStart.getTime()-30*60000);
  return d<latest?d:latest;
}

function canPayBeforeEvent_(now,eventStart) { return paymentDeadline_(now,eventStart) > now; }
function isCashierOpen_(d){return isBusinessDay_(d)&&d.getHours()>=8&&d.getHours()<17;} function isBusinessDay_(d){const n=d.getDay();return n>=1&&n<=5;}
function calculateTotal_(start,end){let total=0;for(let d=new Date(start);d<end;d=new Date(d.getTime()+3600000)) total+=d.getHours()<18?20:30;return total;}
function hoursBetween_(a,b){return Math.round((b-a)/3600000);}

function expireReservations_() {
  ensureRentalSheets_(); const sh=sheet_(RENTAL_CFG.SHEETS.RESERVATIONS), rows=rowsObjects_(RENTAL_CFG.SHEETS.RESERVATIONS), now=new Date(); let count=0;
  rows.forEach(r=>{
    const status=String(r.status).toUpperCase(); const deadline=new Date(r.paymentDeadline), grace=new Date(r.graceDeadline);
    if(status==='PENDIENTE'&&now>deadline&&now<=grace){updateReservationFields_(r._row,{status:'GRACIA'});}
    else if(['PENDIENTE','GRACIA'].includes(status)&&now>grace){updateReservationFields_(r._row,{status:'VENCIDO',expiredAt:now});count++;}
  }); return count;
}

function onEdit(e) {
  if(!e||!e.range||e.range.getSheet().getName()!==RENTAL_CFG.SHEETS.RESERVATIONS||e.range.getRow()===1)return;
  const headers=e.range.getSheet().getRange(1,1,1,e.range.getSheet().getLastColumn()).getValues()[0]; const key=headers[e.range.getColumn()-1];
  if(key==='confirmPayment'&&String(e.value).toUpperCase()==='TRUE') {
    const code=e.range.getSheet().getRange(e.range.getRow(),headers.indexOf('reservationCode')+1).getValue(); const receipt=e.range.getSheet().getRange(e.range.getRow(),headers.indexOf('receiptNumber')+1).getValue();
    try{cashierConfirmPayment(code,receipt);}catch(err){e.range.setValue(false);SpreadsheetApp.getActive().toast(err.message,'Pago no confirmado',8);}
  }
}

function installRentalTriggers_(){
  ScriptApp.getProjectTriggers().filter(t=>['expireReservationsTrigger','sendPendingConfirmationsTrigger'].includes(t.getHandlerFunction())).forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('expireReservationsTrigger').timeBased().everyMinutes(5).create();
}
function expireReservationsTrigger(){expireReservations_();}

function ensureRentalSheets_(){
  const ss=ss_(); let venues=ss.getSheetByName(RENTAL_CFG.SHEETS.VENUES); if(!venues){venues=ss.insertSheet(RENTAL_CFG.SHEETS.VENUES);venues.appendRow(['venueId','name','type','active']);venues.getRange(2,1,4,4).setValues([
    ['COLISEO_PACHACAMAC','Coliseo Deportivo Pachacámac','Coliseo deportivo',true],
    ['ESTADIO_MUNICIPAL_PACHACAMAC','Estadio Municipal de Pachacámac','Estadio',false],
    ['CAMPO_MATAMOROS','Campo Deportivo Matamoros','Grass sintético',false],
    ['ESTADIO_SECTOR_B_MANCHAY','Estadio Municipal Sector B Manchay','Estadio',false]
  ]);venues.setFrozenRows(1);}
  let r=ss.getSheetByName(RENTAL_CFG.SHEETS.RESERVATIONS); if(!r){r=ss.insertSheet(RENTAL_CFG.SHEETS.RESERVATIONS);r.appendRow(['reservationCode','venueId','venueName','startDateTime','endDateTime','hours','total','firstName','lastName','dni','email','phone','status','createdAt','paymentDeadline','graceDeadline','receiptNumber','confirmPayment','paidAt','confirmedBy','confirmationEmailSent','expiredAt']);r.setFrozenRows(1);r.getRange('R2:R').insertCheckboxes();r.getRange('A:V').setWrap(true);r.autoResizeColumns(1,22);}
}

function sendReservationCreated_(r){
  const subject='Solicitud de reserva '+r.reservationCode+' - '+r.venueName; const body=`Hola ${r.firstName},\n\nSe generó tu solicitud de reserva.\n\nCódigo: ${r.reservationCode}\nEspacio: ${r.venueName}\nHorario: ${fmt_(r.startDateTime)} a ${fmtTime_(r.endDateTime)}\nTotal: S/ ${Number(r.total).toFixed(2)}\nPaga hasta: ${fmt_(r.paymentDeadline)}\n\nLa caja cuenta con 10 minutos adicionales de gracia únicamente para registrar un pago recibido a tiempo. La reserva se confirma cuando la municipalidad registra el pago.\n\nPacha Deportes`;
  MailApp.sendEmail({to:r.email,subject,body,cc:RENTAL_CFG.ADMIN_EMAIL});
}
function sendPaymentConfirmation_(r){
  if(bool_(r.confirmationEmailSent))return; const subject='Reserva confirmada '+r.reservationCode; const body=`Hola ${r.firstName},\n\nTu pago fue registrado y la reserva quedó confirmada.\n\nCódigo: ${r.reservationCode}\nEspacio: ${r.venueName}\nHorario: ${fmt_(r.startDateTime)} a ${fmtTime_(r.endDateTime)}\nTotal pagado: S/ ${Number(r.total).toFixed(2)}\nComprobante: ${r.receiptNumber||'Registrado en caja'}\n\nConserva este correo y tu código de reserva.\n\nPacha Deportes`;
  MailApp.sendEmail({to:r.email,subject,body,cc:RENTAL_CFG.ADMIN_EMAIL}); updateReservationFields_(r._row,{confirmationEmailSent:true});
}

function findReservation_(code){return rowsObjects_(RENTAL_CFG.SHEETS.RESERVATIONS).find(r=>String(r.reservationCode).toUpperCase()===String(code||'').trim().toUpperCase());}
function publicReservation_(r){return {reservationCode:r.reservationCode,venueId:r.venueId,venueName:r.venueName,startDateTime:new Date(r.startDateTime).toISOString(),endDateTime:new Date(r.endDateTime).toISOString(),hours:Number(r.hours),total:Number(r.total),firstName:r.firstName,lastName:r.lastName,dni:r.dni,email:r.email,phone:r.phone,status:r.status,createdAt:new Date(r.createdAt).toISOString(),paymentDeadline:new Date(r.paymentDeadline).toISOString(),graceDeadline:new Date(r.graceDeadline).toISOString(),receiptNumber:r.receiptNumber||''};}
function updateReservationFields_(row,fields){const sh=sheet_(RENTAL_CFG.SHEETS.RESERVATIONS),headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];Object.keys(fields).forEach(k=>{const c=headers.indexOf(k)+1;if(c>0)sh.getRange(row,c).setValue(fields[k]);});}
function rowsObjects_(name){const sh=sheet_(name),v=sh.getDataRange().getValues();if(v.length<2)return[];const h=v[0];return v.slice(1).filter(r=>r.some(x=>x!==''&&x!==null)).map((r,i)=>{const o={_row:i+2};h.forEach((k,j)=>o[k]=r[j]);return o;});}
function validateApplicant_(p){if(!clean_(p.firstName)||!clean_(p.lastName))throw new Error('Ingresa nombres y apellidos.');if(digits_(p.dni).length!==8)throw new Error('El DNI debe tener 8 dígitos.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean_(p.email)))throw new Error('Correo electrónico inválido.');if(digits_(p.phone).length<9)throw new Error('Número de WhatsApp inválido.');}
function makeCode_(){return 'PC-'+Utilities.formatDate(new Date(),RENTAL_CFG.TIMEZONE,'yyMMdd')+'-'+Math.random().toString(36).slice(2,7).toUpperCase();}
function jsonp_(cb,obj){return ContentService.createTextOutput(cb+'('+JSON.stringify(obj)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);}
function ss_(){return RENTAL_CFG.SPREADSHEET_ID?SpreadsheetApp.openById(RENTAL_CFG.SPREADSHEET_ID):SpreadsheetApp.getActive();} function sheet_(n){const s=ss_().getSheetByName(n);if(!s)throw new Error('Falta la hoja '+n);return s;}
function parseLocal_(s){const m=String(s).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);return m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]),Number(m[5]),Number(m[6]||0)):new Date('invalid');}
function startDay_(d){const x=new Date(d);x.setHours(0,0,0,0);return x;} function localDateKey_(d){return Utilities.formatDate(new Date(d),RENTAL_CFG.TIMEZONE,'yyyy-MM-dd');}
function fmt_(d){return Utilities.formatDate(new Date(d),RENTAL_CFG.TIMEZONE,"EEEE d 'de' MMMM 'de' yyyy, h:mm a");} function fmtTime_(d){return Utilities.formatDate(new Date(d),RENTAL_CFG.TIMEZONE,'h:mm a');}
function clean_(v){return String(v==null?'':v).trim();} function digits_(v){return clean_(v).replace(/\D/g,'');} function bool_(v){return v===true||String(v).toLowerCase()==='true'||v===1;}
