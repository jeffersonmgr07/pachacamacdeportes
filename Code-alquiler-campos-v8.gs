/**
 * Pacha Deportes - Reservas de espacios deportivos v7
 * - Reserva pública de varios días y horarios bajo un solo código.
 * - Datos guardados en Google Sheets (no en GitHub).
 * - Panel de caja protegido por cuenta Google y lista blanca.
 * - Eventos institucionales sin pago, visibles solo para la cuenta administradora.
 */
const RENTAL_CFG = {
  SPREADSHEET_ID: '19fKP40MzGLqS1b1Jena6YjgWMRDyvC54EoN8vbTpBVw',
  ADMIN_EMAIL: 'pachacamacdeportes@gmail.com',
  AUTHORIZED_CASHIERS: [
    'pachacamacdeportes@gmail.com',
    'caja1.pachacamadeportes@gmail.com'
  ], // agrega aquí caja2, caja3, etc.
  EVENT_ADMIN_EMAILS: ['pachacamacdeportes@gmail.com'],
  TIMEZONE: 'America/Lima',
  LOGO_URL: 'https://pachacamacdeportes.com/assets/img/logo-pacha-deportes.png',
  NIGHT_START_HOUR: 18, // El TUSNE distingue día/noche, pero no fija la hora. Se usa 6:00 p. m. como regla operativa.
  OPEN_HOUR: 8,
  CLOSE_HOUR: 23,
  CASHIER_OPEN_HOUR: 8,
  CASHIER_CLOSE_HOUR: 17,
  GRACE_MINUTES: 10,
  NEAR_DAYS: 7,
  SHEETS: {
    VENUES: 'Campos_Deportivos',
    RESERVATIONS: 'Reservas_Campos',
    ITEMS: 'Reserva_Items',
    BLOCKS: 'Bloqueos_Campos',
    HOLIDAYS: 'Feriados'
  }
};

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (String(params.view || '').toLowerCase() === 'cashier') {
    try {
      requireCashier_();
      return HtmlService.createHtmlOutputFromFile('Cashier')
        .setTitle('Caja y eventos - Campos deportivos')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
    } catch (err) {
      return HtmlService.createHtmlOutput('<h2>Acceso restringido</h2><p>'+html_(err.message)+'</p>')
        .setTitle('Acceso restringido');
    }
  }

  const callback = String(params.callback || 'callback').replace(/[^a-zA-Z0-9_$]/g, '');
  try {
    const payload = JSON.parse(params.payload || '{}');
    return jsonp_(callback, routePublicAction_(String(params.action || ''), payload));
  } catch (err) {
    return jsonp_(callback, {ok:false,message:err && err.message ? err.message : String(err)});
  }
}

function routePublicAction_(action, payload) {
  ensureRentalSheets_();
  expireReservations_();
  switch (action) {
    case 'getVenues': return getVenues_();
    case 'getAvailability': return getAvailability_(payload);
    case 'createReservation': return createReservation_(payload);
    case 'lookupReservation': return lookupReservation_(payload);
    default: throw new Error('Acción pública no válida.');
  }
}

function setupRentalSystem() {
  ensureRentalSheets_();
  installRentalTriggers_();
  return {ok:true,message:'Sistema v7 configurado. Se actualizaron espacios, tarifas, eventos, feriados y seguridad de caja.'};
}

function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('Alquiler de campos')
      .addItem('Configurar sistema', 'setupRentalSystem')
      .addItem('Abrir panel de caja', 'showCashierSidebar')
      .addItem('Liberar reservas vencidas', 'expireReservationsManual')
      .addToUi();
  } catch (_) {}
}

function showCashierSidebar() {
  requireCashier_();
  SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutputFromFile('Cashier').setTitle('Caja y eventos'));
}

function requireCashier_() {
  const email = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  const allowed = RENTAL_CFG.AUTHORIZED_CASHIERS.map(x => String(x).toLowerCase());
  if (!email) throw new Error('Debes abrir el panel desde la implementación privada e iniciar sesión con una cuenta Google autorizada.');
  if (allowed.indexOf(email) === -1) throw new Error('La cuenta '+email+' no está autorizada para caja.');
  return email;
}

function requireEventAdmin_() {
  const email = requireCashier_();
  const allowed = RENTAL_CFG.EVENT_ADMIN_EMAILS.map(x => String(x).toLowerCase());
  if (allowed.indexOf(email) === -1) throw new Error('Tu cuenta puede registrar pagos, pero no administrar eventos.');
  return email;
}

function cashierGetContext() {
  const email = requireCashier_();
  return {
    ok: true,
    email: email,
    canManageEvents: RENTAL_CFG.EVENT_ADMIN_EMAILS.map(x => String(x).toLowerCase()).indexOf(email) !== -1,
    venues: rowsObjects_(RENTAL_CFG.SHEETS.VENUES)
      .filter(v => bool_(v.active))
      .map(v => ({venueId:v.venueId,name:v.name}))
  };
}

function getVenues_() {
  return {
    ok:true,
    serverNow:new Date().toISOString(),
    venues:rowsObjects_(RENTAL_CFG.SHEETS.VENUES).map(v=>({
      venueId:v.venueId,
      name:v.name,
      type:v.type,
      address:v.address || 'Pachacámac, Lima',
      pricingCode:v.pricingCode || 'LOSA',
      active:bool_(v.active)
    }))
  };
}

function getAvailability_(p) {
  const venueId = clean_(p.venueId);
  const start = parseLocal_(p.startDate+'T00:00:00');
  const end = parseLocal_(p.endDate+'T23:59:59');
  if (!venueId || isNaN(start) || isNaN(end)) throw new Error('Rango de consulta inválido.');

  const parents = reservationMap_();
  const bookings = [];
  rowsObjects_(RENTAL_CFG.SHEETS.ITEMS).forEach(item => {
    const parent = parents[String(item.reservationCode)];
    if (!parent || String(item.venueId)!==venueId) return;
    const status = String(parent.status).toUpperCase();
    if (!['PENDIENTE','GRACIA','PAGADO'].includes(status)) return;
    const s = new Date(item.startDateTime), e = new Date(item.endDateTime);
    if (s <= end && e >= start) bookings.push({reservationCode:item.reservationCode,startDateTime:s.toISOString(),endDateTime:e.toISOString(),status:status});
  });
  rowsObjects_(RENTAL_CFG.SHEETS.BLOCKS).forEach(block => {
    if (String(block.venueId)!==venueId || !bool_(block.active)) return;
    const s = new Date(block.startDateTime), e = new Date(block.endDateTime);
    if (s <= end && e >= start) bookings.push({blockId:block.blockId,startDateTime:s.toISOString(),endDateTime:e.toISOString(),status:'EVENTO',reason:block.reason||'Evento'});
  });
  return {
    ok:true,
    serverNow:new Date().toISOString(),
    bookings:bookings,
    holidayDates:getHolidayDates_(start,end)
  };
}

function createReservation_(p) {
  validateApplicant_(p);
  if (!Array.isArray(p.items) || !p.items.length) throw new Error('Selecciona al menos un horario.');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    expireReservations_();
    const venue = rowsObjects_(RENTAL_CFG.SHEETS.VENUES).find(v=>String(v.venueId)===String(p.venueId)&&bool_(v.active));
    if (!venue) throw new Error('El espacio seleccionado todavía no está habilitado.');

    const now = new Date();
    const parsedItems = p.items.map((item,index)=>validateAndPriceItem_(item,index,now,venue));
    parsedItems.sort((a,b)=>a.start-b.start);
    ensureNoDuplicateOrOverlap_(parsedItems);
    ensureNoConflicts_(venue.venueId, parsedItems);

    const earliestStart = parsedItems[0].start;
    if (!canPayBeforeEvent_(now,earliestStart)) throw new Error('No es posible completar el pago antes del primer horario seleccionado.');
    const deadline = paymentDeadline_(now,earliestStart);
    const grace = new Date(deadline.getTime()+RENTAL_CFG.GRACE_MINUTES*60000);
    const total = parsedItems.reduce((s,i)=>s+i.subtotal,0);
    const hours = parsedItems.reduce((s,i)=>s+i.hours,0);
    const code = makeCode_();
    const createdAt = new Date();
    const publicItems = parsedItems.map(i=>({startDateTime:i.start.toISOString(),endDateTime:i.end.toISOString(),hours:i.hours,subtotal:i.subtotal}));

    appendObject_(RENTAL_CFG.SHEETS.RESERVATIONS, {
      reservationCode:code,venueId:venue.venueId,venueName:venue.name,itemsJson:JSON.stringify(publicItems),hours:hours,total:total,
      firstName:clean_(p.firstName),lastName:clean_(p.lastName),dni:digits_(p.dni),email:clean_(p.email).toLowerCase(),phone:clean_(p.phone),
      status:'PENDIENTE',createdAt:createdAt,paymentDeadline:deadline,graceDeadline:grace,receiptNumber:'',confirmPayment:false,
      paidAt:'',confirmedBy:'',confirmationEmailSent:false,expiredAt:''
    });

    parsedItems.forEach((item,index)=>appendObject_(RENTAL_CFG.SHEETS.ITEMS, {
      itemId:code+'-'+String(index+1).padStart(2,'0'),reservationCode:code,venueId:venue.venueId,venueName:venue.name,
      startDateTime:item.start,endDateTime:item.end,hours:item.hours,subtotal:item.subtotal
    }));

    const reservation = findReservation_(code);
    sendReservationCreated_(reservation);
    return {ok:true,reservationCode:code,venueName:venue.name,items:publicItems,total:total,hours:hours,paymentDeadline:deadline.toISOString(),graceDeadline:grace.toISOString()};
  } finally {
    lock.releaseLock();
  }
}

function validateAndPriceItem_(item,index,now,venue) {
  const start = parseLocal_(item.startDateTime), end = parseLocal_(item.endDateTime);
  if (isNaN(start)||isNaN(end)||end<=start) throw new Error('El horario '+(index+1)+' es inválido.');
  if (start<=now) throw new Error('El horario '+(index+1)+' ya comenzó.');
  if (start.getMinutes()!==0||end.getMinutes()!==0) throw new Error('Los horarios deben comenzar y terminar en horas exactas.');
  if (start.getHours()<RENTAL_CFG.OPEN_HOUR||end.getHours()>RENTAL_CFG.CLOSE_HOUR) throw new Error('El horario permitido es de 8:00 a. m. a 11:00 p. m.');
  if (localDateKey_(start)!==localDateKey_(end)) throw new Error('Cada bloque debe comenzar y terminar el mismo día.');
  return {start:start,end:end,hours:hoursBetween_(start,end),subtotal:calculateTotal_(start,end,venue.pricingCode)};
}

function ensureNoDuplicateOrOverlap_(items) {
  for (let i=1;i<items.length;i++) if (items[i].start < items[i-1].end) throw new Error('Hay horarios duplicados o superpuestos en la selección.');
}

function ensureNoConflicts_(venueId, items) {
  const parents = reservationMap_();
  const activeItems = rowsObjects_(RENTAL_CFG.SHEETS.ITEMS).filter(item=>{
    const parent=parents[String(item.reservationCode)];
    return parent && String(item.venueId)===String(venueId) && ['PENDIENTE','GRACIA','PAGADO'].includes(String(parent.status).toUpperCase());
  });
  const blocks = rowsObjects_(RENTAL_CFG.SHEETS.BLOCKS).filter(b=>String(b.venueId)===String(venueId)&&bool_(b.active));
  items.forEach(candidate=>{
    const conflictReservation = activeItems.some(item=>new Date(item.startDateTime)<candidate.end&&new Date(item.endDateTime)>candidate.start);
    const conflictBlock = blocks.some(block=>new Date(block.startDateTime)<candidate.end&&new Date(block.endDateTime)>candidate.start);
    if (conflictReservation || conflictBlock) throw new Error('Uno de los horarios seleccionados acaba de ocuparse. Actualiza la agenda y elige otro horario.');
  });
}

function lookupReservation_(p) {
  const r=findReservation_(p.reservationCode);
  return r?{ok:true,reservation:publicReservation_(r)}:{ok:false,message:'Reserva no encontrada.'};
}

function cashierLookup(code) {
  requireCashier_();
  ensureRentalSheets_(); expireReservations_();
  const r=findReservation_(code);
  if(!r)return {ok:false,message:'No se encontró la reserva.'};
  return {ok:true,reservation:publicReservation_(r)};
}

function cashierConfirmPayment(code,receiptNumber) {
  const cashier = requireCashier_();
  ensureRentalSheets_(); expireReservations_();
  const lock=LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const r=findReservation_(code);
    if(!r)throw new Error('La reserva no existe.');
    const now=new Date();
    if(String(r.status).toUpperCase()==='PAGADO')return {ok:true,message:'La reserva ya estaba pagada.',reservation:publicReservation_(r)};
    if(!['PENDIENTE','GRACIA'].includes(String(r.status).toUpperCase()))throw new Error('La reserva ya no admite pago.');
    if(now>new Date(r.graceDeadline))throw new Error('El plazo administrativo ya venció. El cliente debe generar una nueva reserva.');
    updateReservationFields_(r._row,{status:'PAGADO',paidAt:now,receiptNumber:clean_(receiptNumber),confirmedBy:cashier,confirmationEmailSent:false});
    const updated=findReservation_(code); sendPaymentConfirmation_(updated);
    return {ok:true,message:'Pago confirmado y correo enviado.',reservation:publicReservation_(updated)};
  } finally {lock.releaseLock();}
}

function cashierCreateBlock(data) {
  const cashier=requireEventAdmin_();
  ensureRentalSheets_(); expireReservations_();
  const lock=LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const venue=rowsObjects_(RENTAL_CFG.SHEETS.VENUES).find(v=>String(v.venueId)===String(data.venueId));
    if(!venue)throw new Error('Espacio deportivo no válido.');
    const start=parseLocal_(data.startDateTime),end=parseLocal_(data.endDateTime);
    if(isNaN(start)||isNaN(end)||end<=start)throw new Error('Horario de bloqueo inválido.');
    if(start.getMinutes()!==0||end.getMinutes()!==0)throw new Error('El bloqueo debe usar horas exactas.');
    if(localDateKey_(start)!==localDateKey_(end))throw new Error('El bloqueo debe comenzar y terminar el mismo día.');
    ensureNoConflicts_(venue.venueId,[{start:start,end:end}]);
    const blockId='EVT'+makeCode_();
    appendObject_(RENTAL_CFG.SHEETS.BLOCKS,{blockId:blockId,venueId:venue.venueId,venueName:venue.name,startDateTime:start,endDateTime:end,reason:clean_(data.reason)||'Evento',createdAt:new Date(),createdBy:cashier,active:true});
    return {ok:true,message:'Evento registrado. El horario ya figura como ocupado.',blockId:blockId};
  } finally {lock.releaseLock();}
}

function cashierListBlocks() {
  requireEventAdmin_();
  ensureRentalSheets_();
  return {ok:true,blocks:rowsObjects_(RENTAL_CFG.SHEETS.BLOCKS).filter(b=>bool_(b.active)).map(b=>({blockId:b.blockId,venueName:b.venueName,startDateTime:new Date(b.startDateTime).toISOString(),endDateTime:new Date(b.endDateTime).toISOString(),reason:b.reason}))};
}

function cashierCancelBlock(blockId) {
  requireEventAdmin_();
  const block=rowsObjects_(RENTAL_CFG.SHEETS.BLOCKS).find(b=>String(b.blockId)===String(blockId));
  if(!block)throw new Error('Evento no encontrado.');
  updateFields_(RENTAL_CFG.SHEETS.BLOCKS,block._row,{active:false});
  return {ok:true,message:'Evento retirado y horario liberado.'};
}

function expireReservationsManual(){requireCashier_();const count=expireReservations_();return {ok:true,count:count,message:count+' reserva(s) vencida(s) liberada(s).'};}
function expireReservations_(){
  ensureRentalSheets_();const rows=rowsObjects_(RENTAL_CFG.SHEETS.RESERVATIONS),now=new Date();let count=0;
  rows.forEach(r=>{const status=String(r.status).toUpperCase(),deadline=new Date(r.paymentDeadline),grace=new Date(r.graceDeadline);if(status==='PENDIENTE'&&now>deadline&&now<=grace)updateReservationFields_(r._row,{status:'GRACIA'});else if(['PENDIENTE','GRACIA'].includes(status)&&now>grace){updateReservationFields_(r._row,{status:'VENCIDO',expiredAt:now});count++;}});
  return count;
}

function onEdit(e){handleReservationEdit_(e);} function rentalSpreadsheetEditTrigger(e){handleReservationEdit_(e);}
function handleReservationEdit_(e){
  if(!e||!e.range||e.range.getSheet().getName()!==RENTAL_CFG.SHEETS.RESERVATIONS||e.range.getRow()===1)return;
  const headers=e.range.getSheet().getRange(1,1,1,e.range.getSheet().getLastColumn()).getValues()[0];
  if(headers[e.range.getColumn()-1]==='confirmPayment'&&String(e.value).toUpperCase()==='TRUE'){
    const code=e.range.getSheet().getRange(e.range.getRow(),headers.indexOf('reservationCode')+1).getValue();
    const receipt=e.range.getSheet().getRange(e.range.getRow(),headers.indexOf('receiptNumber')+1).getValue();
    try{cashierConfirmPayment(code,receipt);}catch(err){e.range.setValue(false);console.log(err.message);}
  }
}
function installRentalTriggers_(){
  ScriptApp.getProjectTriggers()
    .filter(t=>['expireReservationsTrigger','rentalSpreadsheetEditTrigger'].includes(t.getHandlerFunction()))
    .forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('expireReservationsTrigger').timeBased().everyMinutes(5).create();
}
function expireReservationsTrigger(){expireReservations_();}

function ensureRentalSheets_(){
  const ss=ss_();
  ensureSheet_(ss,RENTAL_CFG.SHEETS.VENUES,['venueId','name','type','address','pricingCode','active']);
  syncVenueCatalog_();
  ensureSheet_(ss,RENTAL_CFG.SHEETS.RESERVATIONS,['reservationCode','venueId','venueName','itemsJson','hours','total','firstName','lastName','dni','email','phone','status','createdAt','paymentDeadline','graceDeadline','receiptNumber','confirmPayment','paidAt','confirmedBy','confirmationEmailSent','expiredAt']);
  ensureSheet_(ss,RENTAL_CFG.SHEETS.ITEMS,['itemId','reservationCode','venueId','venueName','startDateTime','endDateTime','hours','subtotal']);
  ensureSheet_(ss,RENTAL_CFG.SHEETS.BLOCKS,['blockId','venueId','venueName','startDateTime','endDateTime','reason','createdAt','createdBy','active']);
  ensureSheet_(ss,RENTAL_CFG.SHEETS.HOLIDAYS,['date','description','active']);
  // La confirmación se realiza únicamente desde el panel privado de caja.
}

function syncVenueCatalog_(){
  const catalog=[
    {venueId:'COLISEO_PACHACAMAC',name:'Coliseo Deportivo Municipal de Pachacámac',type:'Losa deportiva municipal',address:'Jirón Paraíso s/n, Pachacámac',pricingCode:'LOSA',active:true},
    {venueId:'CAMPO_MATAMOROS',name:'Campo Deportivo Matamoros',type:'Campo de grass sintético',address:'Matamoros, Pachacámac',pricingCode:'GRASS',active:true},
    {venueId:'ESTADIO_SECTOR_B_MANCHAY',name:'Estadio Municipal Sector B Manchay',type:'Estadio municipal',address:'Sector B, Manchay, Pachacámac',pricingCode:'ESTADIO',active:true},
    {venueId:'ESTADIO_MUNICIPAL_PACHACAMAC',name:'Estadio Municipal de Pachacámac',type:'Estadio municipal',address:'Pachacámac, Lima',pricingCode:'ESTADIO',active:true}
  ];
  const sh=sheet_(RENTAL_CFG.SHEETS.VENUES);
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const rows=rowsObjects_(RENTAL_CFG.SHEETS.VENUES);
  catalog.forEach(item=>{
    const found=rows.find(r=>String(r.venueId)===item.venueId);
    if(found) updateFields_(RENTAL_CFG.SHEETS.VENUES,found._row,item);
    else appendObject_(RENTAL_CFG.SHEETS.VENUES,item);
  });
}

function getHolidayDates_(start,end){
  return rowsObjects_(RENTAL_CFG.SHEETS.HOLIDAYS)
    .filter(h=>bool_(h.active) && h.date)
    .map(h=>new Date(h.date))
    .filter(d=>!isNaN(d) && d>=start && d<=end)
    .map(localDateKey_);
}

function isHoliday_(d){
  const key=localDateKey_(d);
  return rowsObjects_(RENTAL_CFG.SHEETS.HOLIDAYS).some(h=>bool_(h.active)&&h.date&&localDateKey_(new Date(h.date))===key);
}

function ensureSheet_(ss,name,headers,seed){let sh=ss.getSheetByName(name);if(!sh){sh=ss.insertSheet(name);sh.getRange(1,1,1,headers.length).setValues([headers]);if(seed&&seed.length)sh.getRange(2,1,seed.length,headers.length).setValues(seed);sh.setFrozenRows(1);}else{const existing=sh.getLastColumn()?sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]:[];const missing=headers.filter(h=>existing.indexOf(h)===-1);if(missing.length)sh.getRange(1,existing.length+1,1,missing.length).setValues([missing]);}return sh;}

function sendReservationCreated_(r) {
  const items = reservationItems_(r.reservationCode);
  const subject = 'Solicitud de reserva ' + r.reservationCode + ' - ' + r.venueName;
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=' + encodeURIComponent(JSON.stringify({
    codigo: r.reservationCode,
    items: items.map(i => ({
      inicio: new Date(i.startDateTime).toISOString(),
      fin: new Date(i.endDateTime).toISOString(),
      subtotal: Number(i.subtotal)
    })),
    total: Number(r.total),
    dni: r.dni
  }));

  const html = emailShell_({
    title: 'Solicitud de reserva generada',
    preheader: 'Tus horarios están bloqueados temporalmente.',
    status: 'PAGO PENDIENTE',
    statusBg: '#f59e0b',
    greeting: 'Hola ' + html_(r.firstName) + ',',
    message: 'Tu solicitud fue registrada correctamente. Presenta el código o el QR en caja municipal para efectuar el pago.',
    code: r.reservationCode,
    deadline: fmtDeadline_(r.paymentDeadline),
    qrUrl: qrUrl,
    schedulesHtml: schedulesEmailHtml_(items),
    rows: [
      ['Espacio deportivo', r.venueName],
      ['Dirección', venueAddress_(r.venueId)],
      ['Duración total', r.hours + ' ' + (Number(r.hours) === 1 ? 'hora' : 'horas')],
      ['Total a pagar', 'S/ ' + Number(r.total).toFixed(2)],
      ['Titular', r.firstName + ' ' + r.lastName],
      ['DNI', r.dni],
      ['WhatsApp', r.phone],
      ['Correo', r.email]
    ],
    note: 'La reserva queda confirmada únicamente cuando se concreta el pago. Presenta este código al efectuar el pago en la caja de la municipalidad.'
  });

  MailApp.sendEmail({
    to: r.email,
    subject: subject,
    body: 'Solicitud ' + r.reservationCode + '\nPaga hasta: ' + fmtDeadline_(r.paymentDeadline) + '\nTotal: S/ ' + Number(r.total).toFixed(2),
    htmlBody: html,
    cc: RENTAL_CFG.ADMIN_EMAIL,
    name: 'Pacha Deportes'
  });
}


function reservationQrUrl_(r, items) {
  return 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=' + encodeURIComponent(JSON.stringify({
    codigo: r.reservationCode,
    espacio: r.venueName,
    horarios: (items || []).map(i => ({
      inicio: new Date(i.startDateTime).toISOString(),
      fin: new Date(i.endDateTime).toISOString(),
      subtotal: Number(i.subtotal)
    })),
    total: Number(r.total),
    dni: r.dni
  }));
}

function sendPaymentConfirmation_(r) {
  if (bool_(r.confirmationEmailSent)) return;
  const items = reservationItems_(r.reservationCode);
  const qrUrl = reservationQrUrl_(r, items);
  const html = emailShell_({
    title: 'Reserva confirmada',
    preheader: 'Tu pago se realizó de manera exitosa.',
    status: 'PAGADO',
    statusBg: '#16a34a',
    greeting: 'Hola ' + html_(r.firstName) + ',',
    message: 'Tu pago se realizó de manera exitosa. Todos los horarios de tu reserva han quedado confirmados.',
    code: r.reservationCode,
    qrUrl: qrUrl,
    schedulesHtml: schedulesEmailHtml_(items),
    rows: [
      ['Espacio deportivo', r.venueName],
      ['Dirección', venueAddress_(r.venueId)],
      ['Duración total', r.hours + ' ' + (Number(r.hours) === 1 ? 'hora' : 'horas')],
      ['Total pagado', 'S/ ' + Number(r.total).toFixed(2)],
      ['Comprobante', r.receiptNumber || 'Registrado en caja'],
      ['Titular', r.firstName + ' ' + r.lastName],
      ['DNI', r.dni]
    ],
    note: 'Conserva este correo y tu código de reserva.'
  });
  MailApp.sendEmail({
    to: r.email,
    subject: 'Reserva confirmada ' + r.reservationCode,
    body: 'Reserva confirmada ' + r.reservationCode,
    htmlBody: html,
    cc: RENTAL_CFG.ADMIN_EMAIL,
    name: 'Pacha Deportes'
  });
  updateReservationFields_(r._row, {confirmationEmailSent: true});
}

/**
 * Genera tarjetas compatibles con Gmail y la mayoría de clientes de correo.
 * Se usan tablas y estilos inline porque muchos clientes eliminan CSS moderno.
 */
function schedulesEmailHtml_(items) {
  if (!items || !items.length) return '';
  const cards = items.map((item, index) => {
    const start = new Date(item.startDateTime);
    const end = new Date(item.endDateTime);
    const hours = Number(item.hours) || hoursBetween_(start, end);
    const dateText = fmtDateOnly_(start);
    const timeText = fmtTime_(start) + ' a ' + fmtTime_(end);
    const hoursText = hours + ' ' + (hours === 1 ? 'hora' : 'horas');
    const subtotal = 'S/ ' + Number(item.subtotal).toFixed(2);

    return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 10px;border:1px solid #dbe4ee;border-radius:12px;background:#f8fafc;border-collapse:separate;overflow:hidden">' +
      '<tr>' +
        '<td style="padding:12px 14px;vertical-align:top">' +
          '<span style="display:inline-block;padding:5px 9px;border-radius:999px;background:#17365d;color:#ffffff;font-size:10px;line-height:1;font-weight:800;letter-spacing:.4px">' + (items.length > 1 ? 'HORARIO ' + (index + 1) : 'HORARIO') + '</span>' +
          '<div style="margin-top:9px;color:#102033;font-size:15px;line-height:1.35;font-weight:900">' + html_(timeText) + '</div>' +
          '<div style="margin-top:4px;color:#475569;font-size:13px;line-height:1.35">' + html_(dateText) + '</div>' +
        '</td>' +
        '<td align="right" style="padding:12px 14px;vertical-align:middle;white-space:nowrap">' +
          '<div style="color:#64748b;font-size:11px;font-weight:700">' + html_(hoursText) + '</div>' +
          '<div style="margin-top:5px;color:#102033;font-size:16px;font-weight:900">' + html_(subtotal) + '</div>' +
        '</td>' +
      '</tr>' +
    '</table>';
  }).join('');

  return '<div style="margin:18px 0 16px">' +
    '<div style="margin:0 0 9px;color:#64748b;font-size:11px;font-weight:800;letter-spacing:.5px">HORARIOS RESERVADOS</div>' +
    cards +
  '</div>';
}

function fmtDateOnly_(d) {
  const date = new Date(d);
  const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const weekday = days[Number(Utilities.formatDate(date, RENTAL_CFG.TIMEZONE, 'u')) % 7];
  const day = Number(Utilities.formatDate(date, RENTAL_CFG.TIMEZONE, 'd'));
  const month = months[Number(Utilities.formatDate(date, RENTAL_CFG.TIMEZONE, 'M')) - 1];
  const year = Utilities.formatDate(date, RENTAL_CFG.TIMEZONE, 'yyyy');
  return weekday + ' ' + day + ' de ' + month + ' de ' + year;
}

function emailShell_(d) {
  const rows = (d.rows || []).map(row =>
    '<tr>' +
      '<td style="padding:8px 0;color:#64748b;font-size:13px;width:34%;vertical-align:top">' + html_(row[0]) + '</td>' +
      '<td style="padding:8px 0;color:#102033;font-size:13px;font-weight:700;text-align:right;vertical-align:top">' + html_(row[1]) + '</td>' +
    '</tr>'
  ).join('');

  const deadline = d.deadline
    ? '<div style="margin:16px 0;padding:14px 16px;background:#fff7dc;border:1px solid #f2cf67;border-radius:12px;text-align:center">' +
        '<span style="display:inline-block;padding:5px 9px;background:#f59e0b;color:#fff;border-radius:999px;font-size:11px;font-weight:800">LÍMITE DE PAGO</span>' +
        '<div style="margin-top:8px;color:#6b4b00;font-size:15px;line-height:1.45;font-weight:800;text-align:center">' + html_(d.deadline) + '</div>' +
      '</div>'
    : '';

  const qr = d.qrUrl
    ? '<td style="width:150px;text-align:center"><img src="' + d.qrUrl + '" width="132" height="132" alt="QR" style="display:block;margin:auto;border:5px solid #fff;border-radius:10px"></td>'
    : '';

  return '<!doctype html><html><body style="margin:0;background:#eef2f6;font-family:Arial,sans-serif;color:#102033">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0">' + html_(d.preheader || '') + '</div>' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f6;padding:24px 10px"><tr><td align="center">' +
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border-radius:18px;overflow:hidden">' +
        '<tr><td style="padding:22px 24px;background:#071225">' +
          '<table role="presentation" width="100%"><tr>' +
            '<td><img src="' + RENTAL_CFG.LOGO_URL + '" alt="Pacha Deportes" style="display:block;width:170px;max-width:100%;height:auto"></td>' +
            '<td align="right"><span style="display:inline-block;padding:7px 10px;background:' + d.statusBg + ';color:#fff;border-radius:999px;font-size:11px;font-weight:800;white-space:nowrap">' + html_(d.status) + '</span></td>' +
          '</tr></table>' +
        '</td></tr>' +
        '<tr><td style="padding:26px 24px">' +
          '<h1 style="margin:0 0 8px;font-size:24px">' + html_(d.title) + '</h1>' +
          '<p style="font-weight:700">' + d.greeting + '</p>' +
          '<p style="color:#5b6879;font-size:14px;line-height:1.55">' + html_(d.message) + '</p>' +
          deadline +
          '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;background:#f3f6f9;border-radius:14px"><tr>' +
            '<td style="padding:16px"><div style="font-size:11px;color:#64748b;font-weight:800">CÓDIGO DE RESERVA</div><div style="margin-top:5px;font-size:22px;font-weight:900">' + html_(d.code) + '</div></td>' +
            qr +
          '</tr></table>' +
          (d.schedulesHtml || '') +
          '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0">' + rows + '</table>' +
          '<p style="margin:18px 0 0;padding:13px 15px;background:#f8fafc;border-radius:10px;color:#5b6879;font-size:12px">' + html_(d.note || '') + '</p>' +
        '</td></tr>' +
      '</table>' +
    '</td></tr></table>' +
  '</body></html>';
}

function venueAddress_(venueId){
  const venue=rowsObjects_(RENTAL_CFG.SHEETS.VENUES).find(v=>String(v.venueId)===String(venueId));
  return venue && venue.address ? venue.address : 'Pachacámac, Lima';
}

function publicReservation_(r){const items=reservationItems_(r.reservationCode).map(i=>({startDateTime:new Date(i.startDateTime).toISOString(),endDateTime:new Date(i.endDateTime).toISOString(),hours:Number(i.hours),subtotal:Number(i.subtotal)}));return {reservationCode:r.reservationCode,venueId:r.venueId,venueName:r.venueName,items:items,hours:Number(r.hours),total:Number(r.total),firstName:r.firstName,lastName:r.lastName,dni:r.dni,email:r.email,phone:r.phone,status:r.status,createdAt:new Date(r.createdAt).toISOString(),paymentDeadline:new Date(r.paymentDeadline).toISOString(),graceDeadline:new Date(r.graceDeadline).toISOString(),receiptNumber:r.receiptNumber||''};}
function reservationItems_(code){return rowsObjects_(RENTAL_CFG.SHEETS.ITEMS).filter(i=>String(i.reservationCode)===String(code)).sort((a,b)=>new Date(a.startDateTime)-new Date(b.startDateTime));}
function reservationMap_(){const map={};rowsObjects_(RENTAL_CFG.SHEETS.RESERVATIONS).forEach(r=>map[String(r.reservationCode)]=r);return map;}
function findReservation_(code){return rowsObjects_(RENTAL_CFG.SHEETS.RESERVATIONS).find(r=>String(r.reservationCode).toUpperCase()===String(code||'').trim().toUpperCase());}
function appendObject_(sheetName,obj){const sh=sheet_(sheetName),headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];sh.appendRow(headers.map(h=>Object.prototype.hasOwnProperty.call(obj,h)?obj[h]:''));}
function updateReservationFields_(row,fields){updateFields_(RENTAL_CFG.SHEETS.RESERVATIONS,row,fields);}
function updateFields_(sheetName,row,fields){const sh=sheet_(sheetName),headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];Object.keys(fields).forEach(k=>{const c=headers.indexOf(k)+1;if(c>0)sh.getRange(row,c).setValue(fields[k]);});}
function rowsObjects_(name){const sh=sheet_(name),v=sh.getDataRange().getValues();if(v.length<2)return[];const h=v[0];return v.slice(1).filter(r=>r.some(x=>x!==''&&x!==null)).map((r,i)=>{const o={_row:i+2};h.forEach((k,j)=>o[k]=r[j]);return o;});}
function validateApplicant_(p){if(!clean_(p.firstName)||!clean_(p.lastName))throw new Error('Ingresa nombres y apellidos.');if(digits_(p.dni).length!==8)throw new Error('El DNI debe tener 8 dígitos.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean_(p.email)))throw new Error('Correo electrónico inválido.');if(digits_(p.phone).length<9)throw new Error('Número de WhatsApp inválido.');}
function paymentDeadline_(now,eventStart){
  const dayDiff=Math.floor((startDay_(eventStart)-startDay_(now))/86400000);
  let deadline;
  if(localDateKey_(now)===localDateKey_(eventStart)) deadline=new Date(now.getTime()+10*60000);
  else if(isCashierOpen_(now)&&dayDiff<=RENTAL_CFG.NEAR_DAYS) deadline=new Date(now.getTime()+30*60000);
  else deadline=nextBusinessDeadline_(now,eventStart);
  return roundUpToFiveMinutes_(deadline);
}
function roundUpToFiveMinutes_(d){
  const x=new Date(d);
  x.setSeconds(0,0);
  const remainder=x.getMinutes()%5;
  if(remainder) x.setMinutes(x.getMinutes()+(5-remainder));
  return x;
}
function nextBusinessDeadline_(now,eventStart){let d=new Date(now);d.setHours(0,0,0,0);if(isBusinessDay_(d)&&now.getHours()<RENTAL_CFG.CASHIER_OPEN_HOUR)d.setHours(RENTAL_CFG.CASHIER_CLOSE_HOUR,0,0,0);else{do{d.setDate(d.getDate()+1);}while(!isBusinessDay_(d));d.setHours(RENTAL_CFG.CASHIER_CLOSE_HOUR,0,0,0);}const latest=new Date(eventStart.getTime()-30*60000);return d<latest?d:latest;}
function canPayBeforeEvent_(now,eventStart){return paymentDeadline_(now,eventStart)>now;}function isCashierOpen_(d){return isBusinessDay_(d)&&d.getHours()>=8&&d.getHours()<17;}function isBusinessDay_(d){const n=d.getDay();return n>=1&&n<=5;}
function calculateTotal_(start,end,pricingCode){
  let total=0;
  for(let d=new Date(start);d<end;d=new Date(d.getTime()+3600000)) total+=hourlyRate_(pricingCode,d);
  return total;
}
function hourlyRate_(pricingCode,d){
  const weekend=d.getDay()===0||d.getDay()===6||isHoliday_(d);
  const night=d.getHours()>=RENTAL_CFG.NIGHT_START_HOUR;
  switch(String(pricingCode||'LOSA').toUpperCase()){
    case 'GRASS': return weekend ? (night?50:40) : (night?40:30);
    case 'ESTADIO': return weekend ? (night?160:150) : (night?160:120);
    case 'LOSA':
    default: return weekend && night ? 25 : 20;
  }
}
function hoursBetween_(a,b){return Math.round((b-a)/3600000);}
function makeCode_(){const alphabet='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let random='';for(let i=0;i<5;i++)random+=alphabet.charAt(Math.floor(Math.random()*alphabet.length));return Utilities.formatDate(new Date(),RENTAL_CFG.TIMEZONE,'yyMMdd')+random;}
function ss_(){return SpreadsheetApp.openById(RENTAL_CFG.SPREADSHEET_ID);}function sheet_(n){const s=ss_().getSheetByName(n);if(!s)throw new Error('Falta la hoja '+n);return s;}
function parseLocal_(s){const m=String(s).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);return m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]),Number(m[5]),Number(m[6]||0)):new Date('invalid');}
function startDay_(d){const x=new Date(d);x.setHours(0,0,0,0);return x;}function localDateKey_(d){return Utilities.formatDate(new Date(d),RENTAL_CFG.TIMEZONE,'yyyy-MM-dd');}
function fmt_(d){const date=new Date(d),days=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'],months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];return days[Number(Utilities.formatDate(date,RENTAL_CFG.TIMEZONE,'u'))%7]+' '+Number(Utilities.formatDate(date,RENTAL_CFG.TIMEZONE,'d'))+' de '+months[Number(Utilities.formatDate(date,RENTAL_CFG.TIMEZONE,'M'))-1]+' de '+Utilities.formatDate(date,RENTAL_CFG.TIMEZONE,'yyyy')+', '+fmtTime_(date);}
function fmtDeadline_(d){const text=fmt_(d),pos=text.lastIndexOf(', ');return pos===-1?text:text.slice(0,pos)+', hasta las '+text.slice(pos+2);}function fmtTime_(d){return Utilities.formatDate(new Date(d),RENTAL_CFG.TIMEZONE,'h:mm a').replace(/AM/i,'a. m.').replace(/PM/i,'p. m.');}
function jsonp_(cb,obj){return ContentService.createTextOutput(cb+'('+JSON.stringify(obj)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);}function clean_(v){return String(v==null?'':v).trim();}function digits_(v){return clean_(v).replace(/\D/g,'');}function bool_(v){return v===true||String(v).toLowerCase()==='true'||v===1;}function html_(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
