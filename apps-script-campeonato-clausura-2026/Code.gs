/**
 * Campeonato Municipal Clausura de Fútbol de Menores 2026
 * Backend independiente para inscripciones, pagos, panel del delegado y jugadores.
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
    ['PAYMENT_DAYS','3','Días calendario del plazo principal'],
    ['PAYMENT_GRACE_DAYS','2','Días calendario adicionales de gracia'],
    ['START_DATE','2026-08-23','Fecha de inicio'],
    ['REGISTRATION_HOURS','8:00 a. m. a 5:00 p. m.','Horario de inscripción'],
    ['VENUE','Estadio del Sector B - Huertos de Manchay','Sede principal'],
    ['CONTACT_PHONE','992211457','Número de informes'],
    ['MIN_ROSTER','9','Mínimo provisional: las bases dicen “mínimo de ocho (09)”'],
    ['MAX_ROSTER','12','Máximo de jugadores por categoría'],
    ['PUBLIC_BASE_URL','https://pachacamacdeportes.com/campeonato-clausura-2026','URL pública de las páginas'],
    ['ADMIN_EMAIL','pachacamacdeportes@gmail.com','Correo de administración'],
    ['CASHIER_EMAILS','pachacamacdeportes@gmail.com,caja1.pachacamadeportes@gmail.com,caja2.pachacamadeportes@gmail.com','Correos autorizados para caja privada'],
    ['ONLINE_PAYMENT_URL_TEMPLATE','','URL del checkout. Admite {orderCode}, {registrationId} y {amount}'],
    ['ONLINE_PAYMENT_WEBHOOK_TOKEN','','Token secreto para confirmar pagos online'],
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
function endOfDay_(date) { const d = new Date(date); d.setHours(23,59,59,999); return d; }
function dateKey_(date) { return Utilities.formatDate(new Date(date), timezone_(), 'yyyy-MM-dd'); }
function timezone_() { return String(config_().TIMEZONE || Session.getScriptTimeZone() || 'America/Lima'); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function jsonp_(obj, callback) {
  const cb = clean_(callback).replace(/[^a-zA-Z0-9_$\.]/g,'');
  if (!cb) return json_(obj);
  return ContentService.createTextOutput(cb + '(' + JSON.stringify(obj) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function uuidCode_(prefix) { return prefix + Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase(); }
function hexDigest_(value) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8).map(b => ('0'+((b<0?b+256:b).toString(16))).slice(-2)).join(''); }
function sanitizePublic_(obj, blocked) { const copy={}; Object.keys(obj||{}).forEach(k => { if ((blocked||[]).indexOf(k)===-1) copy[k]=obj[k]; }); return copy; }
function parsePayload_(raw) { try { return raw ? JSON.parse(raw) : {}; } catch (_) { return {}; } }
function categoryIds_(value) { return String(value||'').split(',').map(v=>clean_(v)).filter(Boolean); }
function statusLabel_(status) {
  switch (upper_(status)) {
    case 'ACTIVA': return 'Inscripción activa';
    case 'PERIODO_GRACIA': return 'Pago en periodo de gracia';
    case 'INHABILITADA': return 'Inscripción inhabilitada';
    case 'PAGADO': return 'Pago confirmado';
    case 'VENCIDO': return 'Orden vencida';
    default: return 'Pendiente de pago';
  }
}

function doGet(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    if (p.view === 'cashier') return HtmlService.createTemplateFromFile('Cashier').evaluate().setTitle('Caja - Clausura 2026').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
    const hasBusiness=!!p.hasBusinessData, legalName=clean_(p.legalName), ruc=digits_(p.ruc), password=String(p.password||''), selected=[...new Set((p.categories||[]).map(String))];
    if (['DELEGADO','PROFESOR','REPRESENTANTE'].indexOf(role) < 0) throw new Error('Selecciona un rol válido para el representante.');
    if (!first || !last || !doc || !email || !teamName) throw new Error('Completa los datos obligatorios de la ficha.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('El correo electrónico no es válido.');
    if (phone.length < 9) throw new Error('El número de WhatsApp no es válido.');
    if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
    if (hasBusiness && ruc.length !== 11) throw new Error('El RUC debe tener 11 dígitos.');
    const map=categoriesMap_(); if (!selected.length || selected.some(id=>!map[id])) throw new Error('Selecciona al menos una categoría válida.');

    const existing = readTable_(CL26.SHEETS.REGISTRATIONS).find(r => [email,doc].includes(lower_(r.email)) || clean_(r.documentNumber)===doc);
    if (existing && ['PENDIENTE_PAGO','PERIODO_GRACIA','ACTIVA'].includes(upper_(existing.status))) throw new Error('Ya existe una inscripción vigente asociada a este correo o documento: ' + existing.registrationId);

    const cfg=config_(), created=now_(), paymentDeadline=endOfDay_(addDays_(created,Number(cfg.PAYMENT_DAYS||3))), graceDeadline=endOfDay_(addDays_(paymentDeadline,Number(cfg.PAYMENT_GRACE_DAYS||2)));
    const registrationId=uuidCode_('CL26-'), orderCode=uuidCode_('ORD-CL26-'), userId=uuidCode_('USR-'), teamId=uuidCode_('EQ-');
    const fee=Number(cfg.REGISTRATION_FEE_PER_CATEGORY||50), total=fee*selected.length, salt=Utilities.getUuid(), hash=hexDigest_(salt+password);
    const representativeName=(first+' '+last).trim(), categoryLabels=selected.map(id=>map[id].label||map[id].name||id);
    const onlineUrl=buildOnlinePaymentUrl_(cfg.ONLINE_PAYMENT_URL_TEMPLATE,{orderCode,registrationId,amount:total});

    append_(CL26.SHEETS.REGISTRATIONS,{registrationId,orderCode,createdAt:created,paymentDeadline,graceDeadline,status:'PENDIENTE_PAGO',representativeRole:role,firstName:first,lastName:last,representativeName,documentType:docType,documentNumber:doc,whatsapp:phone,email,teamName,hasBusinessData:hasBusiness,legalName,ruc,categories:selected.join(','),categoryCount:selected.length,total,lastReminderDate:'',activatedAt:'',disabledAt:'',notes:'Cuenta creada; panel de jugadores bloqueado hasta confirmar pago'});
    selected.forEach(id=>append_(CL26.SHEETS.REG_CATEGORIES,{registrationId,categoryId:id,categoryLabel:map[id].label||map[id].name,fee,status:'PENDIENTE_PAGO',createdAt:created}));
    append_(CL26.SHEETS.ORDERS,{orderCode,registrationId,description:'Inscripción al Campeonato Clausura de Menores 2026',categories:categoryLabels.join(', '),amount:total,currency:'PEN',status:'PENDIENTE',paymentDeadline,graceDeadline,onlinePaymentUrl:onlineUrl,createdAt:created,paidAt:'',paymentMethod:'',receiptNumber:'',confirmedBy:'',gatewayReference:''});
    append_(CL26.SHEETS.USERS,{userId,registrationId,email,documentNumber:doc,passwordHash:hash,salt,role:'DELEGADO',status:'PENDIENTE_PAGO',createdAt:created,lastLoginAt:''});
    append_(CL26.SHEETS.TEAMS,{teamId,registrationId,teamName,legalName,ruc,representativeName,email,whatsapp:phone,categories:selected.join(','),status:'PENDIENTE_PAGO',createdAt:created,activatedAt:''});
    audit_('INSCRIPCION',registrationId,'CREADA',{teamName,categories:selected,total},email);

    const order={registrationId,orderCode,teamName,categories:selected.map(id=>sanitizePublic_(map[id],[])),amount:total,total,status:'PENDIENTE',statusLabel:statusLabel_('PENDIENTE'),paymentDeadline:paymentDeadline.toISOString(),graceDeadline:graceDeadline.toISOString(),onlinePaymentUrl:onlineUrl};
    let warning=''; try { sendRegistrationEmail_({registrationId,orderCode,teamName,representativeName,email,categoryLabels,total,paymentDeadline,graceDeadline,onlineUrl}); } catch (mailError) { warning='La inscripción fue guardada, pero no se pudo enviar el correo: '+mailError.message; }
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
  const deadline=new Date(registration.paymentDeadline), grace=new Date(registration.graceDeadline);
  if (now > grace) {
    updateByKey_(CL26.SHEETS.REGISTRATIONS,'registrationId',registration.registrationId,{status:'INHABILITADA',disabledAt:now});
    updateByKey_(CL26.SHEETS.ORDERS,'orderCode',registration.orderCode,{status:'VENCIDO'});
    updateByKey_(CL26.SHEETS.USERS,'registrationId',registration.registrationId,{status:'INHABILITADO'});
    updateByKey_(CL26.SHEETS.TEAMS,'registrationId',registration.registrationId,{status:'INHABILITADO'});
    registration.status='INHABILITADA'; registration.disabledAt=now;
  } else if (now > deadline && status!=='PERIODO_GRACIA') {
    updateByKey_(CL26.SHEETS.REGISTRATIONS,'registrationId',registration.registrationId,{status:'PERIODO_GRACIA'});
    updateByKey_(CL26.SHEETS.USERS,'registrationId',registration.registrationId,{status:'PERIODO_GRACIA'});
    updateByKey_(CL26.SHEETS.TEAMS,'registrationId',registration.registrationId,{status:'PERIODO_GRACIA'});
    registration.status='PERIODO_GRACIA';
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
  if(status==='PERIODO_GRACIA') message='El plazo principal venció. La inscripción continúa disponible durante el periodo de gracia.';
  if(status==='ACTIVA') message='El pago fue confirmado. El panel del delegado está habilitado para registrar jugadores.';
  if(status==='INHABILITADA') message='La inscripción quedó inhabilitada por falta de pago y deberá registrarse nuevamente.';
  return {ok:true,statusLabel:statusLabel_(status),message,registration:{registrationId:registration.registrationId,teamName:registration.teamName,representativeName:registration.representativeName,email:registration.email,status:registration.status},categories,order:{orderCode:order.orderCode,amount:Number(order.amount||0),status:order.status,paymentDeadline:new Date(order.paymentDeadline).toISOString(),graceDeadline:new Date(order.graceDeadline).toISOString(),onlinePaymentUrl:order.onlinePaymentUrl||'',paymentMethod:order.paymentMethod||'',paymentMethodLabel:order.paymentMethod?String(order.paymentMethod).replace(/_/g,' '):'Pendiente',receiptNumber:order.receiptNumber||'',paidAt:order.paidAt?new Date(order.paidAt).toISOString():''}};
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
  const status=upper_(registration.status), statusMessage=status==='ACTIVA'?'Pago confirmado. Puedes registrar la nómina de jugadores.':status==='PERIODO_GRACIA'?'El pago está en periodo de gracia. La carga de jugadores continúa bloqueada.':'La carga de jugadores está bloqueada hasta confirmar el pago.';
  return {ok:true,statusLabel:statusLabel_(status),statusMessage,registration:{registrationId:registration.registrationId,teamName:registration.teamName,representativeName:registration.representativeName,status:registration.status},categories,players,order:{orderCode:order.orderCode,amount:Number(order.amount||0),status:order.status,paymentDeadline:new Date(order.paymentDeadline).toISOString(),graceDeadline:new Date(order.graceDeadline).toISOString(),onlinePaymentUrl:order.onlinePaymentUrl||''}};
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
    if (now_()>new Date(current.graceDeadline)) throw new Error('La orden está vencida y la inscripción fue inhabilitada.');
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
  return {ok:true,items:orders.filter(o=>upper_(o.status)==='PENDIENTE').slice(-100).reverse().map(o=>{const r=regs.find(x=>String(x.registrationId)===String(o.registrationId))||{};return {orderCode:o.orderCode,registrationId:o.registrationId,teamName:r.teamName,representativeName:r.representativeName,amount:Number(o.amount),status:r.status,graceDeadline:o.graceDeadline};})};
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
    const end=after==='PERIODO_GRACIA'?new Date(synced.graceDeadline):new Date(synced.paymentDeadline), days=Math.max(0,Math.ceil((end-now_())/86400000)), type=after==='PERIODO_GRACIA'?'RECORDATORIO_GRACIA':'RECORDATORIO_PAGO';
    let status='ENVIADO', error=''; try{sendReminderEmail_(synced,order,days,after);}catch(err){status='ERROR';error=err.message||String(err);}
    append_(CL26.SHEETS.REMINDERS,{reminderId:uuidCode_('REM-'),registrationId:synced.registrationId,orderCode:synced.orderCode,type,sentTo:synced.email,sentAt:now_(),daysRemaining:days,status,error});
    updateByKey_(CL26.SHEETS.REGISTRATIONS,'registrationId',synced.registrationId,{lastReminderDate:today});
  });
}

function audit_(entity,entityId,action,details,user) { append_(CL26.SHEETS.AUDIT,{auditId:uuidCode_('AUD-'),entity,entityId,action,details:JSON.stringify(details||{}),user:user||'',createdAt:now_()}); }
function fmtDateTime_(value) { return Utilities.formatDate(new Date(value),timezone_(),'dd/MM/yyyy hh:mm a'); }
function mailShell_(title,preheader,body) {
  return '<!doctype html><html><body style="margin:0;background:#eef2f7;font-family:Arial,sans-serif;color:#142238"><div style="display:none">'+preheader+'</div><div style="max-width:680px;margin:24px auto;background:#fff;border-radius:22px;overflow:hidden;border:1px solid #dce4ee"><div style="background:linear-gradient(135deg,#7c1e15,#d53a18);padding:26px;color:#fff"><div style="font-size:13px;font-weight:bold;color:#ffd45b">PACHA DEPORTES</div><h1 style="margin:8px 0 0;font-size:28px">'+title+'</h1></div><div style="padding:26px">'+body+'</div><div style="background:#f8fafc;padding:18px 26px;color:#687990;font-size:12px">Municipalidad Distrital de Pachacámac · Campeonato Clausura de Menores 2026</div></div></body></html>';
}
function sendMail_(to,subject,html,body) { const cfg=config_(); MailApp.sendEmail({to,cc:clean_(cfg.ADMIN_EMAIL),subject,htmlBody:html,body:body||subject,name:'Pacha Deportes'}); }
function orderRowsHtml_(rows) { return '<div style="border:1px solid #dce4ee;border-radius:16px;overflow:hidden;margin:18px 0">'+rows.map(r=>'<div style="display:flex;justify-content:space-between;gap:15px;padding:12px 14px;border-top:1px solid #e7ecf2"><span style="color:#687990">'+r[0]+'</span><strong style="text-align:right">'+r[1]+'</strong></div>').join('')+'</div>'; }
function sendRegistrationEmail_(data) {
  const cfg=config_(), link=cfg.PUBLIC_BASE_URL+'/estado.html?codigo='+encodeURIComponent(data.orderCode), body='<p>Hola <strong>'+data.representativeName+'</strong>,</p><p>Registramos la inscripción del equipo <strong>'+data.teamName+'</strong>. La cuenta ya fue creada, pero el registro de jugadores se habilitará al confirmar el pago.</p>'+orderRowsHtml_([['Código de inscripción',data.registrationId],['Código de pago',data.orderCode],['Categorías',data.categoryLabels.join(', ')],['Total','S/ '+Number(data.total).toFixed(2)],['Plazo principal',fmtDateTime_(data.paymentDeadline)],['Fin de gracia',fmtDateTime_(data.graceDeadline)]])+'<p><strong>Pago en caja:</strong> presenta el código de pago. '+(data.onlineUrl?'<br><strong>Pago online:</strong> <a href="'+data.onlineUrl+'">abrir checkout</a>.':'El botón de pago online se mostrará cuando se configure el proveedor.')+'</p><p><a href="'+link+'" style="display:inline-block;background:#b7db2a;color:#071225;padding:13px 18px;border-radius:12px;text-decoration:none;font-weight:bold">Consultar inscripción</a></p><p>Recibirás recordatorios diarios al mediodía mientras el pago esté pendiente.</p>';
  sendMail_(data.email,'Orden de pago '+data.orderCode,mailShell_('Inscripción registrada','Tu orden de pago fue generada.',body),'Orden '+data.orderCode+' por S/ '+Number(data.total).toFixed(2));
}
function sendReminderEmail_(reg,order,days,status) {
  const link=config_().PUBLIC_BASE_URL+'/estado.html?codigo='+encodeURIComponent(order.orderCode), grace=status==='PERIODO_GRACIA', body='<p>Hola '+reg.firstName+',</p><p>La inscripción del equipo <strong>'+reg.teamName+'</strong> continúa pendiente de pago.</p>'+orderRowsHtml_([['Código de pago',order.orderCode],['Monto','S/ '+Number(order.amount).toFixed(2)],['Estado',grace?'Periodo de gracia':'Plazo principal'],['Tiempo restante',days+' día(s)']])+'<p>'+(grace?'Estás utilizando el periodo adicional de 2 días. Si no se confirma el pago, la cuenta quedará inhabilitada.':'Luego del plazo principal tendrás 2 días adicionales de gracia.')+'</p><p><a href="'+link+'">Consultar estado y opciones de pago</a></p>';
  sendMail_(reg.email,'Recordatorio de pago - '+order.orderCode,mailShell_(grace?'Periodo de gracia de pago':'Pago pendiente','Tu inscripción aún no ha sido activada.',body),'Pago pendiente '+order.orderCode);
}
function sendPaymentConfirmedEmail_(reg,order,method,receipt) {
  const panel=config_().PUBLIC_BASE_URL+'/panel.html', body='<p>Hola '+reg.firstName+',</p><p>El pago de la inscripción del equipo <strong>'+reg.teamName+'</strong> fue confirmado. El panel del delegado ya está habilitado para registrar jugadores.</p>'+orderRowsHtml_([['Código',reg.registrationId],['Monto','S/ '+Number(order.amount).toFixed(2)],['Medio',method.replace(/_/g,' ')],['Comprobante',receipt||'Registrado']])+'<p><a href="'+panel+'" style="display:inline-block;background:#b7db2a;color:#071225;padding:13px 18px;border-radius:12px;text-decoration:none;font-weight:bold">Ingresar al panel</a></p><p>Recuerda adjuntar la foto actualizada, copia del documento y autorización del padre o apoderado de cada menor.</p>';
  sendMail_(reg.email,'Pago confirmado - '+reg.teamName,mailShell_('Inscripción activada','Ya puedes registrar la nómina.',body),'Pago confirmado');
}
function sendExpiredEmail_(reg,order) {
  const body='<p>Hola '+reg.firstName+',</p><p>La inscripción del equipo <strong>'+reg.teamName+'</strong> fue inhabilitada porque no se confirmó el pago durante el plazo principal ni en los 2 días de gracia.</p>'+orderRowsHtml_([['Código',reg.registrationId],['Orden',order.orderCode],['Estado','Inhabilitada']])+'<p>Para participar deberás iniciar una nueva ficha de inscripción.</p>';
  sendMail_(reg.email,'Inscripción inhabilitada - Clausura 2026',mailShell_('Plazo de pago vencido','La cuenta fue inhabilitada.',body),'Inscripción inhabilitada');
}
