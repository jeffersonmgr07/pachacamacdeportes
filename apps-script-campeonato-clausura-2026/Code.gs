/**
 * Campeonato Municipal Clausura de Fútbol de Menores 2026
 * Backend independiente para inscripciones, órdenes, panel del delegado y jugadores.
 * La confirmación de pagos se realiza desde la caja general mediante un puente seguro.
 * Vincular este proyecto a una hoja de cálculo NUEVA.
 */

const CL26 = {
  SHEETS: {
    CONFIG: 'Config', CATEGORIES: 'Categorias', REGISTRATIONS: 'Inscripciones', REG_CATEGORIES: 'Inscripcion_Categorias',
    ORDERS: 'Ordenes_Pago', PAYMENTS: 'Pagos', USERS: 'Usuarios', SESSIONS: 'Sesiones', TEAMS: 'Equipos',
    PLAYERS: 'Jugadores', REMINDERS: 'Recordatorios', AUDIT: 'Auditoria', FIXTURE: 'Fixture'
  },
  HEADERS: {
    Config: ['key','value','description'],
    Categorias: ['categoryId','name','label','birthYears','minBirthYear','maxBirthYear','mode','playersOnField','minPlayersOnField','minRoster','maxRoster','fee','active'],
    Inscripciones: ['registrationId','orderCode','createdAt','paymentDeadline','graceDeadline','status','representativeRole','firstName','lastName','representativeName','documentType','documentNumber','whatsapp','email','teamName','hasBusinessData','legalName','ruc','categories','categoryCount','total','lastReminderDate','activatedAt','disabledAt','notes'],
    Inscripcion_Categorias: ['registrationId','categoryId','categoryLabel','fee','status','createdAt'],
    Ordenes_Pago: ['orderCode','registrationId','description','categories','amount','currency','status','paymentDeadline','graceDeadline','onlinePaymentUrl','createdAt','paidAt','paymentMethod','receiptNumber','confirmedBy','gatewayReference'],
    Pagos: ['paymentId','orderCode','registrationId','amount','method','receiptNumber','status','paidAt','confirmedBy','gatewayReference','notes'],
    Usuarios: ['userId','registrationId','email','documentNumber','passwordHash','salt','role','status','createdAt','lastLoginAt'],
    Sesiones: ['token','userId','registrationId','createdAt','expiresAt','revokedAt'],
    Equipos: ['teamId','registrationId','teamName','legalName','ruc','representativeName','email','whatsapp','categories','status','createdAt','activatedAt'],
    Jugadores: ['playerId','registrationId','teamId','teamName','categoryId','firstName','lastName','fullName','documentType','documentNumber','birthDate','birthYear','photoFileId','photoUrl','documentFileId','documentUrl','authorizationFileId','authorizationUrl','status','createdAt','updatedAt','notes'],
    Recordatorios: ['reminderId','registrationId','orderCode','type','sentTo','sentAt','daysRemaining','status','error'],
    Auditoria: ['auditId','entity','entityId','action','details','user','createdAt'],
    Fixture: ['matchId','groupName','round','matchDate','time','field','homeTeam','awayTeam','categoryId','status','homeScore','awayScore','notes']
  }
};

function setupClausura2026() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Abre el Apps Script desde una hoja de cálculo nueva.');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', active.getId());

  const configRows = [
    ['APP_NAME','Campeonato Clausura de Menores 2026','Nombre del campeonato'],
    ['CHAMPIONSHIP_ID','CHAMP_FUT_MEN_CLAUSURA_2026','Identificador interno'],
    ['CHAMPIONSHIP_NAME','Campeonato Municipal Clausura de Fútbol de Menores 2026','Nombre para órdenes y correos'],
    ['REGISTRATION_FEE_PER_CATEGORY','50','Monto en soles por categoría'],
    ['PAYMENT_DAYS','3','Días hábiles de atención de la caja municipal'],
    ['PAYMENT_GRACE_DAYS','0','Campo heredado: no se usa periodo de gracia'],
    ['PAYMENT_COUNT_START','NEXT_OPEN_DAY','El plazo comienza a contar desde el siguiente día de atención'],
    ['HOLIDAYS_2026','2026-01-01,2026-04-02,2026-04-03,2026-05-01,2026-06-07,2026-06-29,2026-07-23,2026-07-28,2026-07-29,2026-08-06,2026-08-30,2026-10-08,2026-11-01,2026-12-08,2026-12-09,2026-12-25','Feriados nacionales del Perú 2026'],
    ['PUBLIC_NON_WORKING_DAYS_2026','2026-01-02,2026-07-27','Días no laborables nacionales del sector público 2026'],
    ['START_DATE','2026-08-23','Fecha de inicio'],
    ['REGISTRATION_HOURS','8:00 a. m. a 5:00 p. m.','Horario de inscripción'],
    ['VENUE','Estadio del Sector B - Huertos de Manchay','Sede principal'],
    ['CONTACT_PHONE','992211457','Número de informes'],
    ['MIN_ROSTER','9','Mínimo provisional: las bases dicen “mínimo de ocho (09)”'],
    ['MAX_ROSTER','12','Máximo de jugadores por categoría'],
    ['PUBLIC_BASE_URL','https://pachacamacdeportes.com/campeonato-clausura-2026','URL pública de las páginas'],
    ['WEB_APP_URL','https://script.google.com/macros/s/AKfycbwrZSScOlLVBkYBKZats35ZX_oGY--1Yt7HNoed34OsS4psmZfV5OeO5Jm3sTNuo33hTA/exec','URL pública /exec del Apps Script'],
    ['ADMIN_EMAIL','pachacamacdeportes@gmail.com','Correo de administración'],
    ['CASHIER_EMAILS','pachacamacdeportes@gmail.com,caja1.pachacamadeportes@gmail.com,caja2.pachacamadeportes@gmail.com','Correos autorizados para caja privada'],
    ['ONLINE_PAYMENT_URL_TEMPLATE','https://pachacamacdeportes.com/campeonato-clausura-2026/pago-online.html?codigo={registrationId}','Página pública de pago online'],
    ['ONLINE_PAYMENT_WEBHOOK_TOKEN','','Campo heredado; la verificación usa Mercado Pago'],
    ['LOGO_URL','https://pachacamacdeportes.com/assets/img/logo-pacha-deportes.png','Logo para correos'],
    ['FILES_FOLDER_ID','','Carpeta privada de Drive para documentos de jugadores'],
    ['SESSION_HOURS','12','Duración de la sesión del delegado'],
    ['TIMEZONE','America/Lima','Zona horaria']
  ];

  createSheetIfNeeded_(CL26.SHEETS.CONFIG, CL26.HEADERS.Config, configRows);
  const categories = [
    ['SUB6','SUB 6','Sub 6','2020 - 2021',2020,2021,'FÚTBOL 7',7,5,9,12,50,true],
    ['SUB8','SUB 8','Sub 8','2018 - 2019',2018,2019,'FÚTBOL 7',7,5,9,12,50,true],
    ['SUB10','SUB 10','Sub 10','2016 - 2017',2016,2017,'FÚTBOL 9',9,7,9,12,50,true],
    ['SUB12','SUB 12','Sub 12','2014 - 2015',2014,2015,'FÚTBOL 9',9,7,9,12,50,true]
  ];
  createSheetIfNeeded_(CL26.SHEETS.CATEGORIES, CL26.HEADERS.Categorias, categories);
  Object.keys(CL26.HEADERS).filter(name => !['Config','Categorias'].includes(name)).forEach(name => createSheetIfNeeded_(name, CL26.HEADERS[name], []));
  setupDailyPaymentTrigger_();
  active.toast('Sistema Clausura 2026 creado correctamente', 'Pacha Deportes', 6);
}


/**
 * Ejecutar una vez después de instalar la versión 4.
 * Actualiza la configuración sin borrar inscripciones, equipos ni jugadores.
 */
function migrateClausuraV4() {
  const updates = [
    ['PAYMENT_DAYS','3','Días hábiles de atención de la caja municipal'],
    ['PAYMENT_GRACE_DAYS','0','Campo heredado: no se usa periodo de gracia'],
    ['PAYMENT_COUNT_START','NEXT_OPEN_DAY','El plazo comienza a contar desde el siguiente día de atención'],
    ['HOLIDAYS_2026','2026-01-01,2026-04-02,2026-04-03,2026-05-01,2026-06-07,2026-06-29,2026-07-23,2026-07-28,2026-07-29,2026-08-06,2026-08-30,2026-10-08,2026-11-01,2026-12-08,2026-12-09,2026-12-25','Feriados nacionales del Perú 2026'],
    ['PUBLIC_NON_WORKING_DAYS_2026','2026-01-02,2026-07-27','Días no laborables nacionales del sector público 2026'],
    ['WEB_APP_URL','https://script.google.com/macros/s/AKfycbwrZSScOlLVBkYBKZats35ZX_oGY--1Yt7HNoed34OsS4psmZfV5OeO5Jm3sTNuo33hTA/exec','URL pública /exec del Apps Script'],
    ['ONLINE_PAYMENT_URL_TEMPLATE','https://pachacamacdeportes.com/campeonato-clausura-2026/pago-online.html?codigo={registrationId}','Página pública de pago online'],
    ['LOGO_URL','https://pachacamacdeportes.com/assets/img/logo-pacha-deportes.png','Logo para correos']
  ];
  updates.forEach(row => upsertConfig_(row[0], row[1], row[2]));
  recalculatePendingDeadlinesV4_();
  setupDailyPaymentTrigger_();
  SpreadsheetApp.getActive().toast('Configuración v4 aplicada. Las nuevas inscripciones usarán un solo código y 3 días hábiles.', 'Clausura 2026', 8);
  return {ok:true,message:'Migración v4 completada.'};
}


function recalculatePendingDeadlinesV4_() {
  const days=Number(config_().PAYMENT_DAYS||3);
  const orders=readTable_(CL26.SHEETS.ORDERS);
  readTable_(CL26.SHEETS.REGISTRATIONS).forEach(function(reg){
    const status=upper_(reg.status);
    const order=orders.find(function(item){return String(item.orderCode)===String(reg.orderCode);}) || {};
    if (status==='ACTIVA' || status==='INHABILITADA' || upper_(order.status)==='PAGADO') return;
    const deadline=calculatePaymentDeadline_(new Date(reg.createdAt),days);
    updateByKey_(CL26.SHEETS.REGISTRATIONS,'registrationId',reg.registrationId,{
      paymentDeadline:deadline,
      graceDeadline:deadline,
      status:'PENDIENTE_PAGO'
    });
    updateByKey_(CL26.SHEETS.ORDERS,'orderCode',reg.orderCode,{
      paymentDeadline:deadline,
      graceDeadline:deadline,
      status:'PENDIENTE'
    });
    updateByKey_(CL26.SHEETS.USERS,'registrationId',reg.registrationId,{status:'PENDIENTE_PAGO'});
    updateByKey_(CL26.SHEETS.TEAMS,'registrationId',reg.registrationId,{status:'PENDIENTE_PAGO'});
  });
}

function upsertConfig_(key, value, description) {
  const rows = readTable_(CL26.SHEETS.CONFIG);
  if (rows.some(row => String(row.key) === String(key))) {
    updateByKey_(CL26.SHEETS.CONFIG, 'key', key, {value:value, description:description || ''});
  } else {
    append_(CL26.SHEETS.CONFIG, {key:key, value:value, description:description || ''});
  }
}

function createSheetIfNeeded_(name, headers, rows) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    if (rows && rows.length) sh.getRange(2,1,rows.length,headers.length).setValues(rows);
  } else {
    const current = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
    headers.forEach(header => { if (current.indexOf(header) === -1) sh.getRange(1,sh.getLastColumn()+1).setValue(header); });
  }
  sh.setFrozenRows(1);
  sh.getRange(1,1,1,sh.getLastColumn()).setBackground('#7c1e15').setFontColor('#ffffff').setFontWeight('bold');
  sh.autoResizeColumns(1,sh.getLastColumn());
}

function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Falta configurar SPREADSHEET_ID. Ejecuta setupClausura2026().');
  return active;
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('No existe la hoja ' + name + '. Ejecuta setupClausura2026().');
  return sh;
}

function readTable_(name) {
  const values = sheet_(name).getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(row => row.some(v => String(v) !== '')).map(row => {
    const obj = {}; headers.forEach((h,i) => obj[h] = row[i]); return obj;
  });
}

function append_(name, obj) {
  const sh = sheet_(name), headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
  sh.appendRow(headers.map(h => Object.prototype.hasOwnProperty.call(obj,h) ? obj[h] : ''));
}

function updateByKey_(name, key, value, changes) {
  const sh = sheet_(name), values = sh.getDataRange().getValues();
  if (!values.length) return false;
  const headers = values[0].map(String), keyIndex = headers.indexOf(key);
  if (keyIndex < 0) throw new Error('No existe la columna ' + key + ' en ' + name);
  for (let r=1;r<values.length;r++) {
    if (String(values[r][keyIndex]) === String(value)) {
      Object.keys(changes).forEach(field => {
        let col = headers.indexOf(field);
        if (col < 0) { sh.getRange(1,sh.getLastColumn()+1).setValue(field); headers.push(field); col=headers.length-1; }
        sh.getRange(r+1,col+1).setValue(changes[field]);
      });
      return true;
    }
  }
  return false;
}

function config_() {
  const out = {};
  readTable_(CL26.SHEETS.CONFIG).forEach(row => out[String(row.key)] = row.value);
  return out;
}

function clean_(value) { return String(value == null ? '' : value).trim(); }
function digits_(value) { return clean_(value).replace(/\D/g,''); }
function upper_(value) { return clean_(value).toUpperCase(); }
function lower_(value) { return clean_(value).toLowerCase(); }
function now_() { return new Date(); }
function addDays_(date, days) { const d = new Date(date); d.setDate(d.getDate()+Number(days||0)); return d; }
function dateKey_(date) { return Utilities.formatDate(new Date(date), timezone_(), 'yyyy-MM-dd'); }
function timezone_() { return String(config_().TIMEZONE || Session.getScriptTimeZone() || 'America/Lima'); }
function configDateSet_(key) {
  return new Set(String(config_()[key] || '').split(',').map(v => clean_(v)).filter(Boolean));
}
function isCashierOpenDay_(date) {
  const d = new Date(date);
  const day = Number(Utilities.formatDate(d, timezone_(), 'u')); // 1=lunes, 7=domingo
  if (day === 7) return false;
  const key = dateKey_(d);
  if (configDateSet_('HOLIDAYS_2026').has(key)) return false;
  if (configDateSet_('PUBLIC_NON_WORKING_DAYS_2026').has(key)) return false;
  return true;
}
function cashierClosingHour_(date) {
  const day = Number(Utilities.formatDate(new Date(date), timezone_(), 'u'));
  return day === 6 ? 12 : 17;
}
function setLocalTime_(date, hour, minute) {
  const d = new Date(date);
  d.setHours(Number(hour || 0), Number(minute || 0), 0, 0);
  return d;
}
function calculatePaymentDeadline_(createdAt, businessDays) {
  const required = Math.max(1, Number(businessDays || 3));
  let cursor = setLocalTime_(createdAt, 12, 0);
  let counted = 0;
  while (counted < required) {
    cursor.setDate(cursor.getDate() + 1);
    if (!isCashierOpenDay_(cursor)) continue;
    counted += 1;
  }
  return setLocalTime_(cursor, cashierClosingHour_(cursor), 0);
}
function businessDaysRemaining_(fromDate, deadline) {
  const from = new Date(fromDate), end = new Date(deadline);
  if (from > end) return 0;
  let cursor = setLocalTime_(from, 12, 0), count = 0;
  while (dateKey_(cursor) <= dateKey_(end)) {
    if (isCashierOpenDay_(cursor) && dateKey_(cursor) !== dateKey_(from)) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return Math.max(0, count);
}
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function jsonp_(obj, callback) {
  const cb = clean_(callback).replace(/[^a-zA-Z0-9_$\.]/g,'');
  if (!cb) return json_(obj);
  return ContentService.createTextOutput(cb + '(' + JSON.stringify(obj) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function uuidCode_(prefix) { return prefix + Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase(); }
function generateRegistrationCode_() {
  const used = new Set(readTable_(CL26.SHEETS.REGISTRATIONS).map(row => upper_(row.registrationId)));
  for (let i=0; i<200; i++) {
    const candidate = 'CL26-' + String(Math.floor(1000 + Math.random()*9000));
    if (!used.has(candidate)) return candidate;
  }
  for (let i=0; i<200; i++) {
    const candidate = 'CL26-' + String(Math.floor(100000 + Math.random()*900000));
    if (!used.has(candidate)) return candidate;
  }
  throw new Error('No se pudo generar un código único. Intenta nuevamente.');
}
function hexDigest_(value) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8).map(b => ('0'+((b<0?b+256:b).toString(16))).slice(-2)).join(''); }
function sanitizePublic_(obj, blocked) { const copy={}; Object.keys(obj||{}).forEach(k => { if ((blocked||[]).indexOf(k)===-1) copy[k]=obj[k]; }); return copy; }
function parsePayload_(raw) { try { return raw ? JSON.parse(raw) : {}; } catch (_) { return {}; } }
function categoryIds_(value) { return String(value||'').split(',').map(v=>clean_(v)).filter(Boolean); }
function statusLabel_(status) {
  switch (upper_(status)) {
    case 'ACTIVA': return 'Inscripción activa';
    case 'PERIODO_GRACIA': return 'Pendiente de pago';
    case 'INHABILITADA': return 'Inscripción inhabilitada';
    case 'PAGADO': return 'Pago confirmado';
    case 'VENCIDO': return 'Orden vencida';
    default: return 'Pendiente de pago';
  }
}

function doGet(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    if (p.view === 'cashier') {
      return HtmlService.createHtmlOutput(
        '<div style="font-family:Arial,sans-serif;max-width:620px;margin:50px auto;padding:24px;border:1px solid #dce4ee;border-radius:18px">' +
        '<h2 style="margin-top:0">Caja general de Pacha Deportes</h2>' +
        '<p>Los pagos del Campeonato Clausura 2026 se registran desde la misma caja utilizada para campos deportivos y talleres.</p>' +
        '</div>'
      ).setTitle('Caja general de Pacha Deportes');
    }
    if (/^cashierBridge/.test(String(p.action || ''))) {
      throw new Error('Esta acción de caja solo está disponible mediante la conexión interna segura.');
    }
    const payload = parsePayload_(p.payload);
    const result = route_(p.action || 'ping', payload);
    return jsonp_(result, p.callback);
  } catch (error) {
    return jsonp_({ok:false,message:error.message||String(error)}, e && e.parameter && e.parameter.callback);
  }
}

function doPost(e) {
  try {
    const body = parsePayload_(e && e.postData ? e.postData.contents : '');
    const params = e && e.parameter ? e.parameter : {};
    const isMercadoPago = String(params.mp_webhook || '') === '1' ||
      String(body.type || '').toLowerCase() === 'payment' ||
      String(body.action || '').toLowerCase().indexOf('payment.') === 0;
    if (isMercadoPago) return json_(handleMercadoPagoWebhook_(e, body));
    const result = route_(body.action || '', body.payload || {});
    return json_(result);
  } catch (error) {
    return json_({ok:false,message:error.message||String(error)});
  }
}

function route_(action, payload) {
  switch (String(action || '')) {
    case 'ping': return {ok:true,message:'API Clausura 2026 activa'};
    case 'registerTeam': return registerTeam_(payload);
    case 'getRegistrationStatus': return getRegistrationStatus_(payload);
    case 'delegateLogin': return delegateLogin_(payload);
    case 'getDelegateDashboard': return getDelegateDashboard_(payload);
    case 'savePlayer': return savePlayer_(payload);
    case 'confirmOnlinePayment': return confirmOnlinePayment_(payload);
    case 'lookupOnlinePayment': return lookupOnlinePayment_(payload);
    case 'createMercadoPagoPreference': return createMercadoPagoPreference_(payload);
    case 'syncMercadoPagoPayment': return syncMercadoPagoPayment_(payload);
    case 'cashierBridgeLookup': return cashierBridgeLookup_(payload);
    case 'cashierBridgeConfirmPayment': return cashierBridgeConfirmPayment_(payload);
    default: return {ok:false,message:'Acción no reconocida: ' + action};
  }
}

function categoriesMap_() {
  const map = {};
  readTable_(CL26.SHEETS.CATEGORIES).filter(c => String(c.active).toLowerCase() !== 'false').forEach(c => map[String(c.categoryId)] = c);
  return map;
}

function registerTeam_(p) {
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const role=upper_(p.representativeRole), first=clean_(p.firstName), last=clean_(p.lastName), docType=upper_(p.documentType||'DNI'), doc=clean_(p.documentNumber), phone=digits_(p.whatsapp), email=lower_(p.email), teamName=clean_(p.teamName);
    const hasBusiness=!!p.hasBusinessData, legalName=clean_(p.legalName), ruc=digits_(p.ruc), password=String(p.password||''), confirmPassword=String(p.confirmPassword||''), selected=[...new Set((p.categories||[]).map(String))];
    if (['DELEGADO','PROFESOR','REPRESENTANTE'].indexOf(role) < 0) throw new Error('Selecciona un rol válido para el representante.');
    if (!first || !last || !doc || !email || !teamName) throw new Error('Completa los datos obligatorios de la ficha.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('El correo electrónico no es válido.');
    if (phone.length < 9) throw new Error('El número de WhatsApp no es válido.');
    if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
    if (!/[A-ZÁÉÍÓÚÑ]/.test(password)) throw new Error('La contraseña debe incluir al menos una letra mayúscula.');
    if (!/[0-9]/.test(password)) throw new Error('La contraseña debe incluir al menos un número.');
    if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden.');
    if (hasBusiness && ruc.length !== 11) throw new Error('El RUC debe tener 11 dígitos.');
    const map=categoriesMap_(); if (!selected.length || selected.some(id=>!map[id])) throw new Error('Selecciona al menos una categoría válida.');

    const existing = readTable_(CL26.SHEETS.REGISTRATIONS).find(r => [email,doc].includes(lower_(r.email)) || clean_(r.documentNumber)===doc);
    if (existing && ['PENDIENTE_PAGO','PERIODO_GRACIA','ACTIVA'].includes(upper_(existing.status))) throw new Error('Ya existe una inscripción vigente asociada a este correo o documento: ' + existing.registrationId);

    const cfg=config_(), created=now_(), paymentDeadline=calculatePaymentDeadline_(created,Number(cfg.PAYMENT_DAYS||3)), graceDeadline=new Date(paymentDeadline);
    const registrationId=generateRegistrationCode_(), orderCode=registrationId, userId=uuidCode_('USR-'), teamId=uuidCode_('EQ-');
    const fee=Number(cfg.REGISTRATION_FEE_PER_CATEGORY||50), total=fee*selected.length, salt=Utilities.getUuid(), hash=hexDigest_(salt+password);
    const representativeName=(first+' '+last).trim(), categoryLabels=selected.map(id=>map[id].label||map[id].name||id);
    const onlineUrl=buildOnlinePaymentUrl_(cfg.ONLINE_PAYMENT_URL_TEMPLATE || (cfg.PUBLIC_BASE_URL + '/pago-online.html?codigo={registrationId}'),{orderCode,registrationId,amount:total});

    append_(CL26.SHEETS.REGISTRATIONS,{registrationId,orderCode,createdAt:created,paymentDeadline,graceDeadline,status:'PENDIENTE_PAGO',representativeRole:role,firstName:first,lastName:last,representativeName,documentType:docType,documentNumber:doc,whatsapp:phone,email,teamName,hasBusinessData:hasBusiness,legalName,ruc,categories:selected.join(','),categoryCount:selected.length,total,lastReminderDate:'',activatedAt:'',disabledAt:'',notes:'Cuenta creada; panel de jugadores bloqueado hasta confirmar pago'});
    selected.forEach(id=>append_(CL26.SHEETS.REG_CATEGORIES,{registrationId,categoryId:id,categoryLabel:map[id].label||map[id].name,fee,status:'PENDIENTE_PAGO',createdAt:created}));
    append_(CL26.SHEETS.ORDERS,{orderCode,registrationId,description:'Inscripción al Campeonato Clausura de Menores 2026',categories:categoryLabels.join(', '),amount:total,currency:'PEN',status:'PENDIENTE',paymentDeadline,graceDeadline,onlinePaymentUrl:onlineUrl,createdAt:created,paidAt:'',paymentMethod:'',receiptNumber:'',confirmedBy:'',gatewayReference:''});
    append_(CL26.SHEETS.USERS,{userId,registrationId,email,documentNumber:doc,passwordHash:hash,salt,role:'DELEGADO',status:'PENDIENTE_PAGO',createdAt:created,lastLoginAt:''});
    append_(CL26.SHEETS.TEAMS,{teamId,registrationId,teamName,legalName,ruc,representativeName,email,whatsapp:phone,categories:selected.join(','),status:'PENDIENTE_PAGO',createdAt:created,activatedAt:''});
    audit_('INSCRIPCION',registrationId,'CREADA',{teamName,categories:selected,total},email);

    const order={registrationId,orderCode,teamName,categories:selected.map(id=>sanitizePublic_(map[id],[])),amount:total,total,status:'PENDIENTE',statusLabel:statusLabel_('PENDIENTE'),paymentDeadline:paymentDeadline.toISOString(),onlinePaymentUrl:onlineUrl};
    let warning=''; try { sendRegistrationEmail_({registrationId,orderCode,teamName,representativeName,email,categoryLabels,total,paymentDeadline,onlineUrl}); } catch (mailError) { warning='La inscripción fue guardada; sin embargo, no se pudo enviar el correo: '+mailError.message; }
    return {ok:true,order,warning};
  } finally { lock.releaseLock(); }
}

function buildOnlinePaymentUrl_(template, data) {
  let url=clean_(template); if (!url) return '';
  Object.keys(data).forEach(k=>url=url.split('{'+k+'}').join(encodeURIComponent(data[k])));
  return url;
}

function findRegistrationByCode_(code) {
  const key=upper_(code);
  const registrations=readTable_(CL26.SHEETS.REGISTRATIONS);
  return registrations.find(r=>upper_(r.registrationId)===key || upper_(r.orderCode)===key) || null;
}

function syncTimeStatus_(registration) {
  if (!registration) return null;
  const status=upper_(registration.status), now=now_();
  if (status==='ACTIVA' || status==='INHABILITADA') return registration;
  const deadline=new Date(registration.paymentDeadline);
  if (now > deadline) {
    updateByKey_(CL26.SHEETS.REGISTRATIONS,'registrationId',registration.registrationId,{status:'INHABILITADA',disabledAt:now});
    updateByKey_(CL26.SHEETS.ORDERS,'orderCode',registration.orderCode,{status:'VENCIDO'});
    updateByKey_(CL26.SHEETS.USERS,'registrationId',registration.registrationId,{status:'INHABILITADO'});
    updateByKey_(CL26.SHEETS.TEAMS,'registrationId',registration.registrationId,{status:'INHABILITADO'});
    registration.status='INHABILITADA';
    registration.disabledAt=now;
  } else if (status==='PERIODO_GRACIA') {
    updateByKey_(CL26.SHEETS.REGISTRATIONS,'registrationId',registration.registrationId,{status:'PENDIENTE_PAGO'});
    updateByKey_(CL26.SHEETS.USERS,'registrationId',registration.registrationId,{status:'PENDIENTE_PAGO'});
    updateByKey_(CL26.SHEETS.TEAMS,'registrationId',registration.registrationId,{status:'PENDIENTE_PAGO'});
    registration.status='PENDIENTE_PAGO';
  }
  return registration;
}

function verifyIdentity_(registration, identity) {
  const value=lower_(identity);
  return value && (lower_(registration.email)===value || lower_(registration.documentNumber)===value || digits_(registration.documentNumber)===digits_(identity));
}

function publicStatusResponse_(registration) {
  registration=syncTimeStatus_(registration);
  const order=readTable_(CL26.SHEETS.ORDERS).find(o=>String(o.orderCode)===String(registration.orderCode)) || {};
  const map=categoriesMap_(), categories=categoryIds_(registration.categories).map(id=>sanitizePublic_(map[id]||{categoryId:id},[]));
  const status=upper_(registration.status);
  let message='La inscripción está pendiente de pago.';
  if(status==='PERIODO_GRACIA') message='La inscripción continúa pendiente de pago hasta la fecha límite indicada.';
  if(status==='ACTIVA') message='El pago fue confirmado. El panel del delegado está habilitado para registrar jugadores.';
  if(status==='INHABILITADA') message='La inscripción quedó inhabilitada por falta de pago y deberá registrarse nuevamente.';
  return {ok:true,statusLabel:statusLabel_(status),message,registration:{registrationId:registration.registrationId,teamName:registration.teamName,representativeName:registration.representativeName,email:registration.email,status:registration.status},categories,order:{orderCode:order.orderCode,amount:Number(order.amount||0),status:order.status,paymentDeadline:new Date(order.paymentDeadline).toISOString(),onlinePaymentUrl:order.onlinePaymentUrl||'',paymentMethod:order.paymentMethod||'',paymentMethodLabel:order.paymentMethod?String(order.paymentMethod).replace(/_/g,' '):'Pendiente',receiptNumber:order.receiptNumber||'',paidAt:order.paidAt?new Date(order.paidAt).toISOString():''}};
}

function getRegistrationStatus_(p) {
  const registration=findRegistrationByCode_(p.code);
  if (!registration || !verifyIdentity_(registration,p.identity)) return {ok:false,message:'No se encontró una inscripción con los datos ingresados.'};
  return publicStatusResponse_(registration);
}

function delegateLogin_(p) {
  const identity=lower_(p.identity), password=String(p.password||'');
  const users=readTable_(CL26.SHEETS.USERS), user=users.find(u=>lower_(u.email)===identity || lower_(u.documentNumber)===identity || digits_(u.documentNumber)===digits_(identity));
  if (!user || hexDigest_(String(user.salt)+password)!==String(user.passwordHash)) return {ok:false,message:'Usuario o contraseña incorrectos.'};
  const registration=syncTimeStatus_(readTable_(CL26.SHEETS.REGISTRATIONS).find(r=>String(r.registrationId)===String(user.registrationId)));
  if (!registration) return {ok:false,message:'La inscripción asociada no existe.'};
  if (upper_(registration.status)==='INHABILITADA') return {ok:false,message:'La inscripción está inhabilitada por falta de pago. Debes realizar un nuevo registro.'};
  const token=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,''), hours=Number(config_().SESSION_HOURS||12), created=now_(), expires=new Date(created.getTime()+hours*3600000);
  append_(CL26.SHEETS.SESSIONS,{token,userId:user.userId,registrationId:user.registrationId,createdAt:created,expiresAt:expires,revokedAt:''});
  updateByKey_(CL26.SHEETS.USERS,'userId',user.userId,{lastLoginAt:created});
  return {ok:true,session:{token,expiresAt:expires.toISOString(),registrationId:user.registrationId}};
}

function authenticated_(token, requireActive) {
  const session=readTable_(CL26.SHEETS.SESSIONS).find(s=>String(s.token)===String(token) && !s.revokedAt);
  if (!session || new Date(session.expiresAt)<now_()) throw new Error('La sesión venció. Inicia sesión nuevamente.');
  const registration=syncTimeStatus_(readTable_(CL26.SHEETS.REGISTRATIONS).find(r=>String(r.registrationId)===String(session.registrationId)));
  if (!registration) throw new Error('No existe la inscripción asociada.');
  if (requireActive && upper_(registration.status)!=='ACTIVA') throw new Error('El registro de jugadores se habilita después de confirmar el pago.');
  const team=readTable_(CL26.SHEETS.TEAMS).find(t=>String(t.registrationId)===String(registration.registrationId)) || {};
  return {session,registration,team};
}

function getDelegateDashboard_(p) {
  const auth=authenticated_(p.token,false), registration=auth.registration, map=categoriesMap_();
  const categories=categoryIds_(registration.categories).map(id=>sanitizePublic_(map[id]||{categoryId:id},[]));
  const players=readTable_(CL26.SHEETS.PLAYERS).filter(pl=>String(pl.registrationId)===String(registration.registrationId)).map(pl=>sanitizePublic_(pl,['photoFileId','documentFileId','authorizationFileId','documentUrl','authorizationUrl']));
  const order=readTable_(CL26.SHEETS.ORDERS).find(o=>String(o.orderCode)===String(registration.orderCode)) || {};
  const status=upper_(registration.status), statusMessage=status==='ACTIVA'?'Pago confirmado. Puedes registrar la nómina de jugadores.':'La carga de jugadores está bloqueada hasta confirmar el pago.';
  return {ok:true,statusLabel:statusLabel_(status),statusMessage,registration:{registrationId:registration.registrationId,teamName:registration.teamName,representativeName:registration.representativeName,status:registration.status},categories,players,order:{orderCode:order.orderCode,amount:Number(order.amount||0),status:order.status,paymentDeadline:new Date(order.paymentDeadline).toISOString(),onlinePaymentUrl:order.onlinePaymentUrl||''}};
}

function savePlayer_(p) {
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const auth=authenticated_(p.token,true), registration=auth.registration, team=auth.team, categoryId=clean_(p.categoryId), map=categoriesMap_(), category=map[categoryId];
    if (!category || categoryIds_(registration.categories).indexOf(categoryId)<0) throw new Error('La categoría no pertenece a la inscripción del equipo.');
    const first=clean_(p.firstName), last=clean_(p.lastName), docType=upper_(p.documentType||'DNI'), doc=clean_(p.documentNumber), birthDate=new Date(clean_(p.birthDate)+'T12:00:00');
    if (!first || !last || !doc || isNaN(birthDate.getTime())) throw new Error('Completa los datos del jugador.');
    const year=birthDate.getFullYear(); if (year<Number(category.minBirthYear)||year>Number(category.maxBirthYear)) throw new Error('El año de nacimiento no corresponde a '+(category.label||category.name)+'. Años permitidos: '+category.birthYears+'.');
    if (!p.photo || !p.documentFile || !p.authorizationFile) throw new Error('La foto, el documento y la autorización son obligatorios.');
    const players=readTable_(CL26.SHEETS.PLAYERS), active=players.filter(pl=>upper_(pl.status)!=='ELIMINADO');
    if (active.some(pl=>String(pl.registrationId)===String(registration.registrationId)&&String(pl.categoryId)===categoryId&&clean_(pl.documentNumber)===doc)) throw new Error('Este jugador ya está registrado en la categoría seleccionada.');
    if (active.some(pl=>String(pl.categoryId)===categoryId&&clean_(pl.documentNumber)===doc)) throw new Error('Este documento ya está registrado en otro equipo de la misma categoría.');
    const count=active.filter(pl=>String(pl.registrationId)===String(registration.registrationId)&&String(pl.categoryId)===categoryId).length;
    if (count>=Number(category.maxRoster||12)) throw new Error('La categoría ya alcanzó el máximo de '+category.maxRoster+' jugadores.');
    const playerId=uuidCode_('JUG-'), folder=playerFolder_(registration,category,playerId), photo=saveUpload_(folder,p.photo,'FOTO_'+playerId,true), docFile=saveUpload_(folder,p.documentFile,'DOCUMENTO_'+playerId,false), authFile=saveUpload_(folder,p.authorizationFile,'AUTORIZACION_'+playerId,false), created=now_(), fullName=(first+' '+last).trim();
    append_(CL26.SHEETS.PLAYERS,{playerId,registrationId:registration.registrationId,teamId:team.teamId||'',teamName:registration.teamName,categoryId,firstName:first,lastName:last,fullName,documentType:docType,documentNumber:doc,birthDate,birthYear:year,photoFileId:photo.id,photoUrl:photo.url,documentFileId:docFile.id,documentUrl:docFile.url,authorizationFileId:authFile.id,authorizationUrl:authFile.url,status:'ACTIVO',createdAt:created,updatedAt:created,notes:'Documentación cargada digitalmente'});
    audit_('JUGADOR',playerId,'CREADO',{registrationId:registration.registrationId,categoryId,documentNumber:doc},registration.email);
    return {ok:true,player:{playerId,fullName,categoryId,photoUrl:photo.url,status:'ACTIVO'}};
  } finally { lock.releaseLock(); }
}

function filesRootFolder_() {
  const cfg=config_();
  if (clean_(cfg.FILES_FOLDER_ID)) return DriveApp.getFolderById(clean_(cfg.FILES_FOLDER_ID));
  const folder=DriveApp.createFolder('Campeonato Clausura Menores 2026 - Documentos');
  updateByKey_(CL26.SHEETS.CONFIG,'key','FILES_FOLDER_ID',{value:folder.getId()});
  return folder;
}
function getOrCreateFolder_(parent,name) { const it=parent.getFoldersByName(name); return it.hasNext()?it.next():parent.createFolder(name); }
function playerFolder_(registration,category,playerId) { const root=filesRootFolder_(), team=getOrCreateFolder_(root,registration.registrationId+' - '+registration.teamName), cat=getOrCreateFolder_(team,category.categoryId); return getOrCreateFolder_(cat,playerId); }
function saveUpload_(folder, upload, name, publicPhoto) {
  const bytes=Utilities.base64Decode(String(upload.data||'')); if (!bytes.length) throw new Error('Uno de los archivos está vacío.');
  const blob=Utilities.newBlob(bytes,clean_(upload.type)||'application/octet-stream',name+'_'+clean_(upload.name||'archivo'));
  const file=folder.createFile(blob);
  if (publicPhoto) { try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW); } catch (_) {} }
  return {id:file.getId(),url:publicPhoto?'https://drive.google.com/uc?export=view&id='+file.getId():file.getUrl()};
}


function publicOnlinePaymentResponse_(registration) {
  registration=syncTimeStatus_(registration);
  const order=readTable_(CL26.SHEETS.ORDERS).find(function(item){return String(item.orderCode)===String(registration.orderCode);}) || {};
  const map=categoriesMap_();
  const categories=categoryIds_(registration.categories).map(function(id){
    const category=map[id] || {categoryId:id};
    return {categoryId:category.categoryId||id,name:category.name||'',label:category.label||category.name||id};
  });
  const status=upper_(registration.status);
  let message='La inscripción está pendiente de pago.';
  if (status==='ACTIVA') message='El pago fue confirmado. El panel del delegado está habilitado.';
  if (status==='INHABILITADA') message='La inscripción quedó inhabilitada porque venció la fecha límite de pago.';
  return {
    ok:true,
    statusLabel:statusLabel_(status),
    message:message,
    registration:{registrationId:registration.registrationId,teamName:registration.teamName,status:registration.status},
    categories:categories,
    order:{
      orderCode:registration.registrationId,
      amount:Number(order.amount||0),
      status:order.status,
      paymentDeadline:new Date(order.paymentDeadline).toISOString(),
      onlinePaymentUrl:order.onlinePaymentUrl||'',
      paymentMethodLabel:order.paymentMethod?String(order.paymentMethod).replace(/_/g,' '):'Pendiente',
      paidAt:order.paidAt?new Date(order.paidAt).toISOString():''
    }
  };
}

function lookupOnlinePayment_(p) {
  const registration=findRegistrationByCode_(p.code);
  if (!registration) return {ok:false,message:'No se encontró una inscripción con ese código.'};
  return publicOnlinePaymentResponse_(registration);
}

function mercadoPagoAccessToken_() {
  const token=clean_(PropertiesService.getScriptProperties().getProperty('MERCADO_PAGO_ACCESS_TOKEN'));
  if (!token) throw new Error('El pago online todavía no está habilitado. Falta configurar MERCADO_PAGO_ACCESS_TOKEN en las propiedades del script.');
  return token;
}

function mercadoPagoRequest_(path, method, payload) {
  const options={
    method:method || 'get',
    headers:{Authorization:'Bearer '+mercadoPagoAccessToken_()},
    muteHttpExceptions:true,
    followRedirects:true
  };
  if (payload !== undefined) {
    options.contentType='application/json';
    options.payload=JSON.stringify(payload);
  }
  const response=UrlFetchApp.fetch('https://api.mercadopago.com'+path,options);
  const status=response.getResponseCode();
  const text=response.getContentText();
  let data={};
  try { data=text?JSON.parse(text):{}; } catch (_) { data={message:text}; }
  if (status<200 || status>=300) {
    const details=data.message || data.error || ('HTTP '+status);
    throw new Error('Mercado Pago rechazó la operación: '+details);
  }
  return data;
}

function createMercadoPagoPreference_(p) {
  const registration=syncTimeStatus_(findRegistrationByCode_(p.code));
  if (!registration) return {ok:false,message:'No se encontró una inscripción con ese código.'};
  if (upper_(registration.status)==='ACTIVA') return {ok:false,message:'Esta inscripción ya está pagada y activa.'};
  if (upper_(registration.status)==='INHABILITADA') return {ok:false,message:'La fecha límite de pago venció. Debes realizar una nueva inscripción.'};
  const order=readTable_(CL26.SHEETS.ORDERS).find(o=>String(o.orderCode)===String(registration.orderCode));
  if (!order) return {ok:false,message:'No se encontró la orden de pago asociada.'};
  if (upper_(order.status)==='PAGADO') return {ok:false,message:'Esta orden ya fue pagada.'};
  if (now_()>new Date(order.paymentDeadline)) return {ok:false,message:'La fecha límite de pago venció.'};

  const cfg=config_();
  const base=String(cfg.PUBLIC_BASE_URL || 'https://pachacamacdeportes.com/campeonato-clausura-2026').replace(/\/$/,'');
  const code=registration.registrationId;
  const query='codigo='+encodeURIComponent(code);
  const serviceUrl=clean_(cfg.WEB_APP_URL)||ScriptApp.getService().getUrl();
  if (!serviceUrl) throw new Error('Actualiza la implementación web del Apps Script antes de habilitar Mercado Pago.');

  const preference={
    items:[{
      id:code,
      title:'Inscripción '+registration.teamName+' - Clausura 2026',
      description:'Categorías: '+String(order.categories || registration.categories || ''),
      quantity:1,
      currency_id:'PEN',
      unit_price:Number(order.amount)
    }],
    payer:{
      email:registration.email,
      name:registration.firstName,
      surname:registration.lastName
    },
    external_reference:code,
    metadata:{registration_id:code,team_name:registration.teamName},
    back_urls:{
      success:base+'/pago-online.html?resultado=success&'+query,
      pending:base+'/pago-online.html?resultado=pending&'+query,
      failure:base+'/pago-online.html?resultado=failure&'+query
    },
    auto_return:'approved',
    notification_url:serviceUrl+'?mp_webhook=1',
    expires:true,
    expiration_date_from:now_().toISOString(),
    expiration_date_to:new Date(order.paymentDeadline).toISOString()
  };

  const result=mercadoPagoRequest_('/checkout/preferences','post',preference);
  updateByKey_(CL26.SHEETS.ORDERS,'orderCode',order.orderCode,{
    onlinePaymentUrl:result.init_point || result.sandbox_init_point || '',
    gatewayReference:result.id || ''
  });
  audit_('PAGO_ONLINE',code,'PREFERENCIA_CREADA',{preferenceId:result.id,amount:Number(order.amount)},registration.email);
  return {ok:true,preferenceId:result.id,initPoint:result.init_point || result.sandbox_init_point || ''};
}

function mercadoPagoStatusLabel_(status) {
  const value=lower_(status);
  if (value==='approved') return 'aprobado';
  if (value==='pending' || value==='in_process') return 'pendiente';
  if (value==='rejected') return 'rechazado';
  if (value==='cancelled') return 'cancelado';
  if (value==='refunded') return 'reembolsado';
  return value || 'sin confirmar';
}

function verifyMercadoPagoPayment_(paymentId, expectedCode) {
  const id=clean_(paymentId);
  if (!id) throw new Error('Falta el identificador del pago de Mercado Pago.');
  const payment=mercadoPagoRequest_('/v1/payments/'+encodeURIComponent(id),'get');
  const code=upper_(payment.external_reference || (payment.metadata && payment.metadata.registration_id) || expectedCode);
  if (!code) throw new Error('El pago no contiene el código de inscripción.');
  if (expectedCode && upper_(expectedCode)!==code) throw new Error('El pago no corresponde al código de inscripción consultado.');
  const registration=findRegistrationByCode_(code);
  if (!registration) throw new Error('No se encontró la inscripción asociada al pago.');
  const order=readTable_(CL26.SHEETS.ORDERS).find(o=>String(o.orderCode)===String(registration.orderCode));
  if (!order) throw new Error('No se encontró la orden asociada al pago.');
  const paidAmount=Number(payment.transaction_amount || 0);
  if (Math.abs(paidAmount-Number(order.amount))>0.001) throw new Error('El monto confirmado por Mercado Pago no coincide con la orden.');

  const status=lower_(payment.status);
  if (status==='approved') {
    const activated=activatePayment_(order,'MERCADO_PAGO',id,'MERCADO_PAGO',id);
    return {ok:true,activated:true,status:'approved',statusLabel:'aprobado',message:activated.message,paymentId:id,registrationId:registration.registrationId};
  }
  return {ok:true,activated:false,status:status,statusLabel:mercadoPagoStatusLabel_(status),paymentId:id,registrationId:registration.registrationId};
}

function syncMercadoPagoPayment_(p) {
  return verifyMercadoPagoPayment_(p.paymentId,p.code || '');
}

function handleMercadoPagoWebhook_(e, body) {
  const params=e && e.parameter ? e.parameter : {};
  const paymentId=clean_((body.data && body.data.id) || params['data.id'] || params.id || body.id || '');
  if (!paymentId) return {ok:true,message:'Notificación recibida sin identificador de pago.'};
  try {
    return verifyMercadoPagoPayment_(paymentId,'');
  } catch (error) {
    audit_('MERCADO_PAGO',paymentId,'WEBHOOK_ERROR',{message:error.message||String(error)},'WEBHOOK');
    return {ok:true,message:'Notificación recibida; la verificación quedó registrada.'};
  }
}

function testMercadoPagoConfiguration() {
  const token=mercadoPagoAccessToken_();
  const response=UrlFetchApp.fetch('https://api.mercadopago.com/users/me',{
    headers:{Authorization:'Bearer '+token},
    muteHttpExceptions:true
  });
  if (response.getResponseCode()<200 || response.getResponseCode()>=300) {
    throw new Error('La credencial de Mercado Pago no es válida: '+response.getContentText());
  }
  return JSON.parse(response.getContentText());
}

function confirmOnlinePayment_(p) {
  const cfg=config_();
  if (!clean_(cfg.ONLINE_PAYMENT_WEBHOOK_TOKEN) || String(p.token)!==String(cfg.ONLINE_PAYMENT_WEBHOOK_TOKEN)) return {ok:false,message:'Token de pago online no válido.'};
  const order=readTable_(CL26.SHEETS.ORDERS).find(o=>upper_(o.orderCode)===upper_(p.orderCode));
  if (!order) return {ok:false,message:'Orden no encontrada.'};
  if (Number(p.amount)!==Number(order.amount)) return {ok:false,message:'El monto recibido no coincide con la orden.'};
  return activatePayment_(order,'PAGO_ONLINE',clean_(p.gatewayReference)||clean_(p.receiptNumber),'WEBHOOK',clean_(p.gatewayReference));
}

function activatePayment_(order, method, receipt, confirmedBy, gatewayReference) {
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const current=readTable_(CL26.SHEETS.ORDERS).find(o=>String(o.orderCode)===String(order.orderCode));
    if (!current) throw new Error('Orden no encontrada.');
    if (upper_(current.status)==='PAGADO') return {ok:true,message:'El pago ya estaba registrado.'};
    const registration=readTable_(CL26.SHEETS.REGISTRATIONS).find(r=>String(r.registrationId)===String(current.registrationId));
    if (!registration) throw new Error('No existe la inscripción asociada.');
    if (now_()>new Date(current.paymentDeadline)) throw new Error('La fecha límite de pago venció y la inscripción fue inhabilitada.');
    const paid=now_(), paymentId=uuidCode_('PAG-');
    append_(CL26.SHEETS.PAYMENTS,{paymentId,orderCode:current.orderCode,registrationId:current.registrationId,amount:Number(current.amount),method,receiptNumber:receipt,status:'CONFIRMADO',paidAt:paid,confirmedBy,gatewayReference:gatewayReference||'',notes:'Pago de inscripción por categoría'});
    updateByKey_(CL26.SHEETS.ORDERS,'orderCode',current.orderCode,{status:'PAGADO',paidAt:paid,paymentMethod:method,receiptNumber:receipt,confirmedBy,gatewayReference:gatewayReference||''});
    updateByKey_(CL26.SHEETS.REGISTRATIONS,'registrationId',current.registrationId,{status:'ACTIVA',activatedAt:paid,disabledAt:''});
    updateByKey_(CL26.SHEETS.USERS,'registrationId',current.registrationId,{status:'ACTIVO'});
    updateByKey_(CL26.SHEETS.TEAMS,'registrationId',current.registrationId,{status:'ACTIVO',activatedAt:paid});
    readTable_(CL26.SHEETS.REG_CATEGORIES).filter(row=>String(row.registrationId)===String(current.registrationId)).forEach(row=>updateRegistrationCategory_(row,'ACTIVA'));
    audit_('PAGO',paymentId,'CONFIRMADO',{orderCode:current.orderCode,method,amount:Number(current.amount)},confirmedBy);
    try { sendPaymentConfirmedEmail_(registration,current,method,receipt); } catch (_) {}
    return {ok:true,message:'Pago registrado. La cuenta del delegado quedó habilitada.',registrationId:current.registrationId,paymentId};
  } finally { lock.releaseLock(); }
}
function updateRegistrationCategory_(row,status) {
  const sh=sheet_(CL26.SHEETS.REG_CATEGORIES), values=sh.getDataRange().getValues(), headers=values[0].map(String), rid=headers.indexOf('registrationId'), cid=headers.indexOf('categoryId'), st=headers.indexOf('status');
  for(let i=1;i<values.length;i++) if(String(values[i][rid])===String(row.registrationId)&&String(values[i][cid])===String(row.categoryId)){sh.getRange(i+1,st+1).setValue(status);return;}
}

/**
 * Genera el secreto que enlaza la caja general con este proyecto.
 * Ejecútala una vez y copia el valor devuelto para configurar la caja antigua.
 */
function generateCashierBridgeToken() {
  const token = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
  PropertiesService.getScriptProperties().setProperty('CASHIER_BRIDGE_TOKEN', token);
  console.log('CASHIER_BRIDGE_TOKEN=' + token);
  return token;
}

function requireCashierBridge_(payload) {
  const expected = String(PropertiesService.getScriptProperties().getProperty('CASHIER_BRIDGE_TOKEN') || '');
  const received = String(payload && payload.bridgeToken || '');
  if (!expected) throw new Error('El puente con la caja general todavía no ha sido configurado.');
  if (!received || received !== expected) throw new Error('Conexión de caja no autorizada.');
  return clean_(payload.confirmedBy || 'CAJA_GENERAL');
}

function cashierBridgeLookup_(payload) {
  requireCashierBridge_(payload);
  const code = clean_(payload.code);
  if (!code) return {ok:false,message:'Ingresa el código de inscripción.'};
  const registration = findRegistrationByCode_(code);
  if (!registration) return {ok:false,message:'No se encontró una inscripción del Clausura 2026 con ese código.'};
  const result = publicStatusResponse_(registration);
  result.source = 'CLAUSURA_2026';
  return result;
}

function cashierBridgeConfirmPayment_(payload) {
  const cashier = requireCashierBridge_(payload);
  const orderCode = upper_(payload.orderCode);
  const receiptNumber = clean_(payload.receiptNumber);
  if (!orderCode) throw new Error('Falta el código de inscripción.');
  const order = readTable_(CL26.SHEETS.ORDERS).find(o => upper_(o.orderCode) === orderCode);
  if (!order) throw new Error('No se encontró la orden de pago.');
  return activatePayment_(order, 'CAJA_MUNICIPAL', receiptNumber, cashier, '');
}

function cashierGetContext() {
  const email=requireCashier_();
  return {ok:true,email,championshipName:config_().CHAMPIONSHIP_NAME};
}
function requireCashier_() {
  const email=lower_(Session.getActiveUser().getEmail()), allowed=String(config_().CASHIER_EMAILS||'').split(',').map(lower_).filter(Boolean);
  if (!email || allowed.indexOf(email)<0) throw new Error('Tu cuenta no está autorizada para registrar pagos del Clausura 2026.');
  return email;
}
function cashierLookup(code) {
  requireCashier_();
  const registration=findRegistrationByCode_(code); if(!registration) return {ok:false,message:'No se encontró la inscripción.'};
  return publicStatusResponse_(registration);
}
function cashierConfirmPayment(orderCode, receiptNumber) {
  const cashier=requireCashier_(), order=readTable_(CL26.SHEETS.ORDERS).find(o=>upper_(o.orderCode)===upper_(orderCode));
  if (!order) throw new Error('Orden no encontrada.');
  return activatePayment_(order,'CAJA_MUNICIPAL',clean_(receiptNumber),cashier,'');
}
function cashierPendingOrders() {
  requireCashier_();
  const regs=readTable_(CL26.SHEETS.REGISTRATIONS), orders=readTable_(CL26.SHEETS.ORDERS);
  return {ok:true,items:orders.filter(o=>upper_(o.status)==='PENDIENTE').slice(-100).reverse().map(o=>{const r=regs.find(x=>String(x.registrationId)===String(o.registrationId))||{};return {orderCode:o.orderCode,registrationId:o.registrationId,teamName:r.teamName,representativeName:r.representativeName,amount:Number(o.amount),status:r.status,paymentDeadline:o.paymentDeadline};})};
}

function setupDailyPaymentTrigger_() {
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='processPendingPaymentsDaily').forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('processPendingPaymentsDaily').timeBased().everyDays(1).atHour(12).create();
}

function processPendingPaymentsDaily() {
  const registrations=readTable_(CL26.SHEETS.REGISTRATIONS), orders=readTable_(CL26.SHEETS.ORDERS), today=dateKey_(now_());
  registrations.forEach(reg => {
    if (['ACTIVA','INHABILITADA'].includes(upper_(reg.status))) return;
    const before=upper_(reg.status), synced=syncTimeStatus_(reg), after=upper_(synced.status), order=orders.find(o=>String(o.orderCode)===String(synced.orderCode))||{};
    if (after==='INHABILITADA') { if(before!=='INHABILITADA') try{sendExpiredEmail_(synced,order);}catch(_){} return; }
    if (dateKey_(synced.createdAt)===today || String(synced.lastReminderDate)===today) return;
    const end=new Date(synced.paymentDeadline), days=businessDaysRemaining_(now_(),end), type='RECORDATORIO_PAGO';
    let status='ENVIADO', error=''; try{sendReminderEmail_(synced,order,days,after);}catch(err){status='ERROR';error=err.message||String(err);}
    append_(CL26.SHEETS.REMINDERS,{reminderId:uuidCode_('REM-'),registrationId:synced.registrationId,orderCode:synced.orderCode,type,sentTo:synced.email,sentAt:now_(),daysRemaining:days,status,error});
    updateByKey_(CL26.SHEETS.REGISTRATIONS,'registrationId',synced.registrationId,{lastReminderDate:today});
  });
}

function audit_(entity,entityId,action,details,user) { append_(CL26.SHEETS.AUDIT,{auditId:uuidCode_('AUD-'),entity,entityId,action,details:JSON.stringify(details||{}),user:user||'',createdAt:now_()}); }
function fmtDateTime_(value) {
  const d=new Date(value), tz=timezone_();
  const weekdays=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const weekday=weekdays[Number(Utilities.formatDate(d,tz,'u'))%7];
  const day=Number(Utilities.formatDate(d,tz,'d'));
  const month=months[Number(Utilities.formatDate(d,tz,'M'))-1];
  const year=Utilities.formatDate(d,tz,'yyyy');
  const hour24=Number(Utilities.formatDate(d,tz,'H'));
  const minute=Utilities.formatDate(d,tz,'mm');
  const hour12=hour24%12 || 12;
  const suffix=hour24<12?'a. m.':'p. m.';
  return weekday+' '+day+' de '+month+' de '+year+', '+hour12+':'+minute+' '+suffix;
}
function mailEscape_(value) {
  return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
}
function mailShell_(title,preheader,body) {
  const cfg=config_();
  const logo=clean_(cfg.LOGO_URL)||'https://pachacamacdeportes.com/assets/img/logo-pacha-deportes.png';
  return '<!doctype html><html><body style="margin:0;background:#eef2f7;font-family:Arial,sans-serif;color:#142238">'+
    '<div style="display:none;max-height:0;overflow:hidden">'+mailEscape_(preheader)+'</div>'+
    '<div style="max-width:680px;margin:24px auto;background:#fff;border-radius:22px;overflow:hidden;border:1px solid #dce4ee">'+
      '<div style="background:linear-gradient(135deg,#741b14,#c93b1c);padding:24px 26px;color:#fff">'+
        '<img src="'+mailEscape_(logo)+'" alt="Pacha Deportes" style="display:block;max-width:190px;max-height:72px;object-fit:contain;background:#fff;border-radius:14px;padding:8px 12px;margin-bottom:16px">'+
        '<div style="font-size:12px;font-weight:bold;color:#ffd45b;text-transform:uppercase;letter-spacing:.08em">Campeonato Clausura 2026</div>'+
        '<h1 style="margin:7px 0 0;font-size:28px">'+mailEscape_(title)+'</h1>'+
      '</div>'+
      '<div style="padding:26px">'+body+'</div>'+
      '<div style="background:#f8fafc;padding:18px 26px;color:#687990;font-size:12px">Municipalidad Distrital de Pachacámac · Campeonato Clausura de Menores 2026</div>'+
    '</div></body></html>';
}
function sendMail_(to,subject,html,body) {
  const cfg=config_(), options={to:to,subject:subject,htmlBody:html,body:body||subject,name:'Pacha Deportes'};
  if (clean_(cfg.ADMIN_EMAIL)) options.cc=clean_(cfg.ADMIN_EMAIL);
  MailApp.sendEmail(options);
}
function orderRowsHtml_(rows) {
  return '<div style="border:1px solid #dce4ee;border-radius:16px;overflow:hidden;margin:18px 0">'+rows.map(function(r,index){
    return '<div style="padding:12px 14px;border-top:'+(index?'1px solid #e7ecf2':'0')+';line-height:1.45">'+
      '<strong style="color:#4b5f78">'+mailEscape_(r[0])+':</strong>&nbsp; '+
      '<span style="color:#142238">'+mailEscape_(r[1])+'</span></div>';
  }).join('')+'</div>';
}
function paymentPageLink_(code) {
  return String(config_().PUBLIC_BASE_URL||'https://pachacamacdeportes.com/campeonato-clausura-2026').replace(/\/$/,'')+'/pago-online.html?codigo='+encodeURIComponent(code);
}
function statusPageLink_(code) {
  return String(config_().PUBLIC_BASE_URL||'https://pachacamacdeportes.com/campeonato-clausura-2026').replace(/\/$/,'')+'/estado.html?codigo='+encodeURIComponent(code);
}
function emailQrUrl_(code) {
  return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&ecc=H&color=741B14&bgcolor=FFFFFF&data='+encodeURIComponent(statusPageLink_(code));
}
function emailPaymentInstructions_(code) {
  const online=paymentPageLink_(code);
  return '<div style="display:grid;gap:14px;margin:20px 0">'+
    '<div style="border:1px solid #dce4ee;border-radius:16px;padding:16px;background:#f8fafc">'+
      '<h3 style="margin:0 0 10px;color:#741b14">Pago en caja municipal</h3>'+
      '<ol style="margin:0;padding-left:20px;color:#40516a;line-height:1.6">'+
        '<li>Presenta el código de inscripción <strong>'+mailEscape_(code)+'</strong>.</li>'+
        '<li>El cajero buscará la inscripción y registrará el pago.</li>'+
        '<li>Recibirás un correo cuando se habilite el registro de jugadores.</li>'+
      '</ol>'+
      '<p style="margin:12px 0 0;color:#687990;font-size:12px"><strong>Horario:</strong> lunes a viernes de 8:00 a. m. a 5:00 p. m.; sábados de 8:00 a. m. a 12:00 p. m. Domingos y feriados no hay atención.</p>'+
    '</div>'+
    '<div style="border:1px solid #efc5b8;border-radius:16px;padding:16px;background:#fff7f3">'+
      '<h3 style="margin:0 0 10px;color:#741b14">Pago online</h3>'+
      '<ol style="margin:0;padding-left:20px;color:#40516a;line-height:1.6">'+
        '<li>Copia tu código de inscripción: <strong>'+mailEscape_(code)+'</strong>.</li>'+
        '<li>Haz clic en el botón <strong>Pagar online</strong>.</li>'+
        '<li>Coloca el código y selecciona <strong>Buscar recibos</strong>.</li>'+
        '<li>Revisa el monto, continúa y elige Yape, tarjeta de débito o tarjeta de crédito en Mercado Pago.</li>'+
        '<li>Confirma el pago y espera el correo de habilitación.</li>'+
      '</ol>'+
      '<p style="margin:15px 0 0"><a href="'+mailEscape_(online)+'" style="display:inline-block;background:#741b14;color:#fff;padding:13px 18px;border-radius:12px;text-decoration:none;font-weight:bold">Pagar online</a></p>'+
    '</div>'+
  '</div>';
}
function sendRegistrationEmail_(data) {
  const code=data.registrationId;
  const body='<p>Hola, <strong>'+mailEscape_(data.representativeName)+'</strong>,</p>'+
    '<p>Registramos la inscripción del equipo <strong>'+mailEscape_(data.teamName)+'</strong>. La cuenta ya fue creada; sin embargo, el registro de jugadores se habilitará al confirmar el pago.</p>'+
    orderRowsHtml_([
      ['Código de inscripción',code],
      ['Categorías',data.categoryLabels.join(', ')],
      ['Total','S/ '+Number(data.total).toFixed(2)],
      ['Fecha límite de pago',fmtDateTime_(data.paymentDeadline)]
    ])+
    '<div style="text-align:center;margin:20px 0"><img src="'+emailQrUrl_(code)+'" width="180" height="180" alt="QR de la inscripción '+mailEscape_(code)+'" style="display:inline-block;border:1px solid #e1e7ef;border-radius:14px;padding:8px"></div>'+
    emailPaymentInstructions_(code)+
    '<p style="text-align:center"><a href="'+mailEscape_(statusPageLink_(code))+'" style="display:inline-block;background:#b7db2a;color:#071225;padding:13px 18px;border-radius:12px;text-decoration:none;font-weight:bold">Consultar inscripción</a></p>'+
    '<p style="color:#687990;font-size:13px">Recibirás recordatorios al mediodía mientras el pago permanezca pendiente.</p>';
  const subject='Inscripción de '+data.teamName+' al Campeonato Clausura 2026 de Menores';
  sendMail_(data.email,subject,mailShell_('Registro de equipo','La inscripción del equipo fue registrada.',body),subject+' · Código '+code+' · S/ '+Number(data.total).toFixed(2));
}
function sendReminderEmail_(reg,order,days,status) {
  const code=reg.registrationId||order.orderCode;
  const remaining=days===0?'La fecha límite vence hoy.':('Quedan '+days+' día(s) hábil(es) de atención.');
  const body='<p>Hola, <strong>'+mailEscape_(reg.firstName)+'</strong>,</p>'+
    '<p>La inscripción del equipo <strong>'+mailEscape_(reg.teamName)+'</strong> continúa pendiente de pago.</p>'+
    orderRowsHtml_([
      ['Código de inscripción',code],
      ['Monto','S/ '+Number(order.amount).toFixed(2)],
      ['Fecha límite de pago',fmtDateTime_(order.paymentDeadline)],
      ['Tiempo restante',remaining]
    ])+
    emailPaymentInstructions_(code)+
    '<p><a href="'+mailEscape_(statusPageLink_(code))+'">Consultar el estado de la inscripción</a></p>';
  sendMail_(reg.email,'Recordatorio de pago - '+code,mailShell_('Pago pendiente','La inscripción aún no ha sido activada.',body),'Pago pendiente '+code+' · '+remaining);
}
function sendPaymentConfirmedEmail_(reg,order,method,receipt) {
  const panel=String(config_().PUBLIC_BASE_URL||'').replace(/\/$/,'')+'/panel.html';
  const code=reg.registrationId||order.orderCode;
  const body='<p>Hola, <strong>'+mailEscape_(reg.firstName)+'</strong>,</p>'+
    '<p>El pago de la inscripción del equipo <strong>'+mailEscape_(reg.teamName)+'</strong> fue confirmado. El panel del delegado ya está habilitado para registrar jugadores.</p>'+
    orderRowsHtml_([
      ['Código de inscripción',code],
      ['Monto','S/ '+Number(order.amount).toFixed(2)],
      ['Medio de pago',String(method||'').replace(/_/g,' ')],
      ['Comprobante',receipt||'Registrado']
    ])+
    '<p><a href="'+mailEscape_(panel)+'" style="display:inline-block;background:#b7db2a;color:#071225;padding:13px 18px;border-radius:12px;text-decoration:none;font-weight:bold">Ingresar al panel</a></p>'+
    '<p>Recuerda adjuntar la foto actualizada, la copia del documento y la autorización del padre o apoderado de cada menor.</p>';
  sendMail_(reg.email,'Pago confirmado - '+reg.teamName,mailShell_('Inscripción activada','Ya puedes registrar la nómina.',body),'Pago confirmado · '+code);
}
function sendExpiredEmail_(reg,order) {
  const code=reg.registrationId||order.orderCode;
  const body='<p>Hola, <strong>'+mailEscape_(reg.firstName)+'</strong>,</p>'+
    '<p>La inscripción del equipo <strong>'+mailEscape_(reg.teamName)+'</strong> fue inhabilitada porque no se confirmó el pago hasta la fecha límite.</p>'+
    orderRowsHtml_([['Código de inscripción',code],['Estado','Inhabilitada']])+
    '<p>Para participar deberás iniciar una nueva ficha de inscripción.</p>';
  sendMail_(reg.email,'Inscripción inhabilitada - Clausura 2026',mailShell_('Fecha límite de pago vencida','La cuenta fue inhabilitada.',body),'Inscripción inhabilitada · '+code);
}

