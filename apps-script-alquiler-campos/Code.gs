/**
 * Pacha Deportes - Reserva pública de campos deportivos
 * Proyecto independiente de Google Apps Script vinculado a la misma Google Sheet.
 * Zona horaria recomendada del proyecto: America/Lima.
 */
const RENTAL_CFG = {
  SPREADSHEET_ID: '19fKP40MzGLqS1b1Jena6YjgWMRDyvC54EoN8vbTpBVw', // Google Sheet de Pacha Deportes
  ADMIN_EMAIL: 'pachacamacdeportes@gmail.com',
  TIMEZONE: 'America/Lima',
  LOGO_URL: 'https://pachacamacdeportes.com/assets/img/logo-pacha-deportes.png',
  VENUE_ADDRESS: 'Jirón Paraíso s/n, Pachacámac',
  OPEN_HOUR: 8,
  CLOSE_HOUR: 23,
  CASHIER_OPEN_HOUR: 8,
  CASHIER_CLOSE_HOUR: 17,
  GRACE_MINUTES: 10,
  NEAR_DAYS: 7,
  SHEETS: { VENUES:'Campos_Deportivos', RESERVATIONS:'Reservas_Campos' }
};

function doGet(e) {
  const params = (e && e.parameter) || {};

  // Panel web de caja: TU_URL_EXEC?view=cashier
  if (String(params.view || '').toLowerCase() === 'cashier') {
    return HtmlService.createHtmlOutputFromFile('Cashier')
      .setTitle('Caja - Campos deportivos')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  const callback = String(params.callback || 'callback').replace(/[^a-zA-Z0-9_$]/g, '');
  try {
    const action = String(params.action || '');
    const payload = JSON.parse(params.payload || '{}');
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
  const message = 'Sistema de alquiler configurado correctamente. Revisa las hojas Campos_Deportivos y Reservas_Campos.';
  console.log(message);
  return {ok:true, message:message};
}

// Estas funciones solo muestran interfaz si el proyecto está vinculado a una hoja.
// En este proyecto independiente, el panel de caja se abre como aplicación web con ?view=cashier.
function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('Alquiler de campos')
      .addItem('Configurar sistema', 'setupRentalSystem')
      .addItem('Abrir panel de caja', 'showCashierSidebar')
      .addItem('Liberar reservas vencidas', 'expireReservationsManual')
      .addToUi();
  } catch (err) {
    console.log('Proyecto independiente: no se crea menú dentro de Google Sheets.');
  }
}

function showCashierSidebar() {
  try {
    const html = HtmlService.createHtmlOutputFromFile('Cashier').setTitle('Caja - Campos deportivos');
    SpreadsheetApp.getUi().showSidebar(html);
  } catch (err) {
    throw new Error('Este proyecto es independiente. Abre el panel de caja usando la URL de la aplicación web terminada en /exec?view=cashier');
  }
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
  const message = count + ' reserva(s) vencida(s) liberada(s).';
  console.log(message);
  return {ok:true, count:count, message:message};
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
  handleReservationEdit_(e);
}

// Función usada por el activador instalable del proyecto independiente.
function rentalSpreadsheetEditTrigger(e) {
  handleReservationEdit_(e);
}

function handleReservationEdit_(e) {
  if(!e||!e.range||e.range.getSheet().getName()!==RENTAL_CFG.SHEETS.RESERVATIONS||e.range.getRow()===1)return;
  const sh=e.range.getSheet();
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const key=headers[e.range.getColumn()-1];
  if(key==='confirmPayment'&&String(e.value).toUpperCase()==='TRUE') {
    const code=sh.getRange(e.range.getRow(),headers.indexOf('reservationCode')+1).getValue();
    const receipt=sh.getRange(e.range.getRow(),headers.indexOf('receiptNumber')+1).getValue();
    try {
      cashierConfirmPayment(code,receipt);
    } catch(err) {
      e.range.setValue(false);
      console.log('Pago no confirmado: '+err.message);
    }
  }
}

function installRentalTriggers_(){
  ScriptApp.getProjectTriggers()
    .filter(t=>['expireReservationsTrigger','rentalSpreadsheetEditTrigger'].includes(t.getHandlerFunction()))
    .forEach(t=>ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('expireReservationsTrigger').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('rentalSpreadsheetEditTrigger').forSpreadsheet(ss_()).onEdit().create();
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
  const subject='Solicitud de reserva '+r.reservationCode+' - '+r.venueName;
  const qrText=['PACHA DEPORTES','CODIGO:'+r.reservationCode,'ESPACIO:'+r.venueName,'FECHA:'+fmt_(r.startDateTime),'TOTAL:S/'+Number(r.total).toFixed(2),'DNI:'+r.dni].join('|');
  const qrUrl='https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data='+encodeURIComponent(qrText);
  const html=emailShell_({
    title:'Solicitud de reserva generada',
    preheader:'Tu horario está bloqueado temporalmente hasta que se registre el pago.',
    status:'PAGO PENDIENTE', statusBg:'#f59e0b',
    greeting:'Hola '+html_(r.firstName)+',',
    message:'Tu solicitud fue registrada correctamente. Presenta el código o el QR en caja municipal para efectuar el pago.',
    code:r.reservationCode,
    deadline:fmtDeadline_(r.paymentDeadline),
    qrUrl:qrUrl,
    rows:[
      ['Espacio deportivo',r.venueName],['Dirección',RENTAL_CFG.VENUE_ADDRESS],
      ['Fecha y horario',fmt_(r.startDateTime)+' a '+fmtTime_(r.endDateTime)],
      ['Duración',r.hours+' '+(Number(r.hours)===1?'hora':'horas')],['Total a pagar','S/ '+Number(r.total).toFixed(2)],
      ['Titular',r.firstName+' '+r.lastName],['DNI',r.dni],['WhatsApp',r.phone],['Correo',r.email]
    ],
    note:'La reserva queda confirmada únicamente cuando se concreta el pago. Presenta este código al efectuar el pago en la caja de la municipalidad.'
  });
  const body='Solicitud '+r.reservationCode+'\nPaga hasta: '+fmtDeadline_(r.paymentDeadline)+'\nTotal: S/ '+Number(r.total).toFixed(2);
  MailApp.sendEmail({to:r.email,subject,body,htmlBody:html,cc:RENTAL_CFG.ADMIN_EMAIL,name:'Pacha Deportes'});
}
function sendPaymentConfirmation_(r){
  if(bool_(r.confirmationEmailSent))return;
  const subject='Reserva confirmada '+r.reservationCode;
  const html=emailShell_({
    title:'Reserva confirmada',
    preheader:'Tu pago fue registrado y el espacio quedó reservado.',
    status:'PAGO CONFIRMADO', statusBg:'#16a34a',
    greeting:'Hola '+html_(r.firstName)+',',
    message:'Tu pago fue registrado correctamente. El horario ya quedó confirmado a tu nombre.',
    code:r.reservationCode,
    rows:[
      ['Espacio deportivo',r.venueName],['Dirección',RENTAL_CFG.VENUE_ADDRESS],
      ['Fecha y horario',fmt_(r.startDateTime)+' a '+fmtTime_(r.endDateTime)],
      ['Total pagado','S/ '+Number(r.total).toFixed(2)],['Comprobante',r.receiptNumber||'Registrado en caja'],
      ['Titular',r.firstName+' '+r.lastName],['DNI',r.dni]
    ],
    note:'Conserva este correo y tu código de reserva. Preséntalos cuando acudas al espacio deportivo.'
  });
  const body='Reserva confirmada '+r.reservationCode+'\nTotal pagado: S/ '+Number(r.total).toFixed(2);
  MailApp.sendEmail({to:r.email,subject,body,htmlBody:html,cc:RENTAL_CFG.ADMIN_EMAIL,name:'Pacha Deportes'});
  updateReservationFields_(r._row,{confirmationEmailSent:true});
}
function emailShell_(d){
  const rows=(d.rows||[]).map(function(row){return '<tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:42%;vertical-align:top">'+html_(row[0])+'</td><td style="padding:8px 0;color:#102033;font-size:13px;font-weight:700;text-align:right;vertical-align:top">'+html_(row[1])+'</td></tr>';}).join('');
  const deadline=d.deadline?'<div style="margin:16px 0;padding:14px 16px;background:#fff7dc;border:1px solid #f2cf67;border-radius:12px"><span style="display:inline-block;padding:5px 9px;background:#f59e0b;color:#fff;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:.04em">LÍMITE DE PAGO</span><div style="margin-top:8px;color:#6b4b00;font-size:15px;font-weight:800">'+html_(d.deadline)+'</div></div>':'';
  const qr=d.qrUrl?'<td style="width:150px;text-align:center;vertical-align:middle"><img src="'+d.qrUrl+'" width="132" height="132" alt="QR de reserva" style="display:block;margin:auto;border:5px solid #fff;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,.12)"></td>':'';
  return '<!doctype html><html><body style="margin:0;background:#eef2f6;font-family:Arial,sans-serif;color:#102033"><div style="display:none;max-height:0;overflow:hidden">'+html_(d.preheader||'')+'</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f6;padding:24px 10px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 12px 35px rgba(15,23,42,.12)"><tr><td style="padding:22px 24px;background:#071225"><table width="100%"><tr><td><img src="'+RENTAL_CFG.LOGO_URL+'" alt="Pacha Deportes" style="display:block;width:170px;max-width:100%;height:auto"></td><td align="right"><span style="display:inline-block;padding:7px 10px;background:'+d.statusBg+';color:#fff;border-radius:999px;font-size:11px;font-weight:800">'+html_(d.status)+'</span></td></tr></table></td></tr><tr><td style="padding:26px 24px"><h1 style="margin:0 0 8px;font-size:24px;line-height:1.2">'+html_(d.title)+'</h1><p style="margin:0 0 7px;font-size:15px;font-weight:700">'+d.greeting+'</p><p style="margin:0;color:#5b6879;font-size:14px;line-height:1.55">'+html_(d.message)+'</p>'+deadline+'<table width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;background:#f3f6f9;border-radius:14px"><tr><td style="padding:16px"><div style="font-size:11px;color:#64748b;font-weight:800;text-transform:uppercase">Código de reserva</div><div style="margin-top:5px;font-size:22px;font-weight:900;letter-spacing:.04em">'+html_(d.code)+'</div></td>'+qr+'</tr></table><table width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0">'+rows+'</table><p style="margin:18px 0 0;padding:13px 15px;background:#f8fafc;border-radius:10px;color:#5b6879;font-size:12px;line-height:1.55">'+html_(d.note||'')+'</p></td></tr><tr><td style="padding:16px 24px;background:#f8fafc;color:#7b8797;font-size:11px;text-align:center">Pacha Deportes · Municipalidad de Pachacámac</td></tr></table></td></tr></table></body></html>';
}
function html_(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

function findReservation_(code){return rowsObjects_(RENTAL_CFG.SHEETS.RESERVATIONS).find(r=>String(r.reservationCode).toUpperCase()===String(code||'').trim().toUpperCase());}
function publicReservation_(r){return {reservationCode:r.reservationCode,venueId:r.venueId,venueName:r.venueName,startDateTime:new Date(r.startDateTime).toISOString(),endDateTime:new Date(r.endDateTime).toISOString(),hours:Number(r.hours),total:Number(r.total),firstName:r.firstName,lastName:r.lastName,dni:r.dni,email:r.email,phone:r.phone,status:r.status,createdAt:new Date(r.createdAt).toISOString(),paymentDeadline:new Date(r.paymentDeadline).toISOString(),graceDeadline:new Date(r.graceDeadline).toISOString(),receiptNumber:r.receiptNumber||''};}
function updateReservationFields_(row,fields){const sh=sheet_(RENTAL_CFG.SHEETS.RESERVATIONS),headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];Object.keys(fields).forEach(k=>{const c=headers.indexOf(k)+1;if(c>0)sh.getRange(row,c).setValue(fields[k]);});}
function rowsObjects_(name){const sh=sheet_(name),v=sh.getDataRange().getValues();if(v.length<2)return[];const h=v[0];return v.slice(1).filter(r=>r.some(x=>x!==''&&x!==null)).map((r,i)=>{const o={_row:i+2};h.forEach((k,j)=>o[k]=r[j]);return o;});}
function validateApplicant_(p){if(!clean_(p.firstName)||!clean_(p.lastName))throw new Error('Ingresa nombres y apellidos.');if(digits_(p.dni).length!==8)throw new Error('El DNI debe tener 8 dígitos.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean_(p.email)))throw new Error('Correo electrónico inválido.');if(digits_(p.phone).length<9)throw new Error('Número de WhatsApp inválido.');}
function makeCode_(){const alphabet='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let random='';for(let i=0;i<5;i++)random+=alphabet.charAt(Math.floor(Math.random()*alphabet.length));return Utilities.formatDate(new Date(),RENTAL_CFG.TIMEZONE,'yyMMdd')+random;}
function jsonp_(cb,obj){return ContentService.createTextOutput(cb+'('+JSON.stringify(obj)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);}
function ss_(){return RENTAL_CFG.SPREADSHEET_ID?SpreadsheetApp.openById(RENTAL_CFG.SPREADSHEET_ID):SpreadsheetApp.getActive();} function sheet_(n){const s=ss_().getSheetByName(n);if(!s)throw new Error('Falta la hoja '+n);return s;}
function parseLocal_(s){const m=String(s).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);return m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]),Number(m[5]),Number(m[6]||0)):new Date('invalid');}
function startDay_(d){const x=new Date(d);x.setHours(0,0,0,0);return x;} function localDateKey_(d){return Utilities.formatDate(new Date(d),RENTAL_CFG.TIMEZONE,'yyyy-MM-dd');}
function fmt_(d){
  const date=new Date(d);
  const days=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return days[Number(Utilities.formatDate(date,RENTAL_CFG.TIMEZONE,'u'))%7]+' '+Number(Utilities.formatDate(date,RENTAL_CFG.TIMEZONE,'d'))+' de '+months[Number(Utilities.formatDate(date,RENTAL_CFG.TIMEZONE,'M'))-1]+' de '+Utilities.formatDate(date,RENTAL_CFG.TIMEZONE,'yyyy')+', '+fmtTime_(date);
}
function fmtDeadline_(d){
  const text=fmt_(d);
  const pos=text.lastIndexOf(', ');
  return pos===-1?text:text.slice(0,pos)+', hasta las '+text.slice(pos+2);
}
function fmtTime_(d){
  const raw=Utilities.formatDate(new Date(d),RENTAL_CFG.TIMEZONE,'h:mm a');
  return raw.replace(/AM/i,'a. m.').replace(/PM/i,'p. m.');
}
function clean_(v){return String(v==null?'':v).trim();} function digits_(v){return clean_(v).replace(/\D/g,'');} function bool_(v){return v===true||String(v).toLowerCase()==='true'||v===1;}
