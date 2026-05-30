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
    default: return {ok:false, message:'Acción no reconocida: ' + action};
  }
}
