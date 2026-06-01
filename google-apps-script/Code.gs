/**
 * Backend API para GitHub Pages + Google Sheets.
 * Publicar como Aplicación web: ejecutar como "Yo", acceso "Cualquier usuario".
 * El frontend usa JSONP para evitar problemas CORS en GitHub Pages.
 */
function doGet(e) {
  return handleRequest_(e);
}
function doPost(e) {
  return handleRequest_(e);
}
function handleRequest_(e) {
  var params = e && e.parameter ? e.parameter : {};
  var action = params.action || 'ping';
  var callback = params.callback || '';
  var payload = {};
  try {
    payload = params.payload ? JSON.parse(params.payload) : {};
  } catch (err) {
    payload = {};
  }
  var result;
  try {
    result = routeAction_(action, payload);
  } catch (err) {
    result = { ok:false, message: err.message || String(err) };
  }
  var output = callback
    ? callback + '(' + JSON.stringify(result) + ');'
    : JSON.stringify(result);
  return ContentService.createTextOutput(output)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}
function routeAction_(action, payload) {
  switch(action) {
    case 'ping': return {ok:true, message:'Minetti/Pacha Deportes API activa'};
    case 'login': return login_(payload.email, payload.password);
    case 'getPublicData': return getPublicData_();
    case 'getCoachDashboard': return getCoachDashboard_(payload.user);
    case 'saveTeamProfile': return saveTeamProfile_(payload);
    case 'savePlayer': return savePlayer_(payload);
    case 'updatePlayer': return updatePlayer_(payload);
    case 'deletePlayer': return deletePlayer_(payload.playerId);
    case 'saveConvocatoria': return saveConvocatoria_(payload);
    case 'saveResult': return saveResult_(payload);
    case 'startMatch': return startMatch_(payload);
    case 'saveMatchEvent': return saveMatchEvent_(payload);
    case 'finishMatch': return finishMatch_(payload);
    case 'deleteMatchEvent': return deleteMatchEvent_(payload);
    case 'registerCoachRequest': return registerCoachRequest_(payload);
    default: return {ok:false, message:'Acción no reconocida: ' + action};
  }
}


// Login integrado en Code.gs para evitar el error "login_ is not defined".
function cleanLogin_(value) {
  return String(value || '').trim().toLowerCase();
}
function pickFirst_(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (obj && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') return obj[k];
  }
  return '';
}
function normalizeLoginUser_(u) {
  var fullName = pickFirst_(u, ['fullName', 'nombre', 'name']) || [pickFirst_(u, ['firstName', 'nombres']), pickFirst_(u, ['lastName', 'apellidos'])].join(' ').trim();
  var shortName = pickFirst_(u, ['shortName', 'nombreCorto']) || fullName;
  return Object.assign({}, u, {
    email: pickFirst_(u, ['email', 'correo', 'Correo']),
    password: String(pickFirst_(u, ['password', 'clave', 'contraseña', 'contrasena', 'Password'])),
    role: String(pickFirst_(u, ['role', 'rol', 'Rol']) || 'entrenador').toLowerCase(),
    status: String(pickFirst_(u, ['status', 'estado', 'Estado']) || 'activo').toLowerCase(),
    fullName: fullName,
    shortName: shortName,
    teamId: pickFirst_(u, ['teamId', 'equipoId', 'EquipoId']),
    teamName: pickFirst_(u, ['teamName', 'equipo', 'Equipo'])
  });
}
function login_(email, password) {
  var identifier = cleanLogin_(email);
  var pass = String(password || '').trim();
  if (!identifier || !pass) return {ok:false, message:'Ingresa correo y contraseña'};

  var users = readTable_('Usuarios').map(normalizeLoginUser_);
  var user = users.find(function(u){
    var candidates = [u.email, u.username, u.usuario, u.dni, u.userId].map(cleanLogin_).filter(Boolean);
    return candidates.indexOf(identifier) !== -1 && String(u.password || '').trim() === pass && String(u.status || 'activo').toLowerCase() !== 'inactivo';
  });

  // Respaldo: plantillas antiguas pueden guardar accesos en Entrenadores.
  if (!user) {
    user = readTable_('Entrenadores').map(normalizeLoginUser_).find(function(u){
      var candidates = [u.email, u.username, u.usuario, u.dni, u.userId, u.trainerId].map(cleanLogin_).filter(Boolean);
      return candidates.indexOf(identifier) !== -1 && String(u.password || '').trim() === pass && String(u.status || 'activo').toLowerCase() !== 'inactivo';
    });
  }

  if (!user) return {ok:false, message:'Correo o clave incorrecta'};
  return {ok:true, user:user};
}
