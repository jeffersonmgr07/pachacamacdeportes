/**
 * Minetti Fútbol - Apps Script API
 * Este proyecto NO sirve HTML.
 * Solo funciona como backend/API para el frontend publicado en GitHub Pages.
 */

function doGet(e) {
  return handleRequest_(e.parameter || {});
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse(e.postData.contents || '{}');
  } catch (err) {
    return json_({ ok: false, message: 'JSON inválido.' });
  }
  return handleRequest_({ action: body.action, payload: body.payload || {} });
}

function handleRequest_(params) {
  try {
    var action = params.action;
    var payload = params.payload || params;

    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch(e) {}
    }

    switch (action) {
      case 'login': return json_(login_(payload.username, payload.password));
      case 'registerCoachRequest': return json_(registerCoachRequest_(payload));
      case 'getPublicData': return json_({ ok: true, data: getPublicData_() });
      case 'getFixture': return json_({ ok: true, fixture: sheetObjects_('Fixture'), categories: sheetObjects_('Categorias') });
      case 'getTeams': return json_({ ok: true, teams: sheetObjects_('Equipos'), categories: sheetObjects_('Categorias') });
      case 'getPlayers': return json_({ ok: true, players: getPlayers_(payload.teamId) });
      case 'getCoachDashboard': return json_(getCoachDashboard_(payload.teamId));
      case 'getAdminDashboard': return json_(getAdminDashboard_());
      case 'saveTeamProfile': return json_(saveTeamProfile_(payload));
      case 'savePlayer': return json_(savePlayer_(payload));
      case 'saveConvocation': return json_(saveConvocation_(payload));
      case 'saveResult': return json_(saveResult_(payload));
      default: return json_({ ok: false, message: 'Acción no reconocida: ' + action });
    }
  } catch (err) {
    return json_({ ok: false, message: err.message, stack: err.stack });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
