
function normalizeTimeForSort_(t) {
  t = String(t || '99:99');
  if (t.indexOf('POR') !== -1) return '99:99';
  var parts = t.split(':');
  var h = Number(parts[0] || 99);
  var m = Number(parts[1] || 0);
  return Utilities.formatString('%02d:%02d', h, m);
}
function sortFixture_(rows) {
  return (rows || []).sort(function(a,b){
    var da = String(a.matchDate || a.date || '9999-99-99');
    var db = String(b.matchDate || b.date || '9999-99-99');
    if (da !== db) return da.localeCompare(db);
    var ta = normalizeTimeForSort_(a.time);
    var tb = normalizeTimeForSort_(b.time);
    if (ta !== tb) return ta.localeCompare(tb);
    return String(a.matchId || '').localeCompare(String(b.matchId || ''));
  });
}


function normalizeDni_(value) {
  return String(value || '').replace(/\D/g, '').trim();
}
function categoryBase_(value) {
  return String(value || '').replace(/\s*\(.+?\)/g, '').trim().toUpperCase();
}
function categoryList_(value) {
  return String(value || '').split(',').map(function(c){ return categoryBase_(c); }).filter(Boolean);
}
function categoryNumber_(value) {
  var m = String(value || '').match(/(\d+)/);
  return m ? Number(m[1]) : 999;
}
function maxStartersForCategory_(categoryName) {
  var base = categoryBase_(categoryName);
  try {
    var cats = readTable_('Categorias');
    var row = cats.find(function(c){ return categoryBase_(c.name || c.label) === base; });
    if(row && Number(row.playersOnField)) return Number(row.playersOnField);
  } catch(err) {}
  var n = categoryNumber_(categoryName);
  if(n === 6 || n === 8) return 7;
  if(n === 10 || n === 12 || n === 13) return 9;
  return 11;
}
function validateDuplicatePlayer_(p, excludePlayerId) {
  var dni = normalizeDni_(p.dni);
  if(!dni) return {ok:true};
  var duplicate = readTable_('Jugadores').find(function(x){
    return normalizeDni_(x.dni) === dni && String(x.playerId || '') !== String(excludePlayerId || '');
  });
  if(!duplicate) return {ok:true};
  if(String(duplicate.teamId) === String(p.teamId)) {
    return {ok:false, message:'Este jugador ya está agregado en tu equipo. Para habilitar otra categoría, edita su ficha y marca la categoría correspondiente.'};
  }
  return {ok:false, message:'Este jugador ya está participando en otro equipo: ' + (duplicate.teamName || duplicate.teamId || 'equipo registrado') + '.'};
}

function getPublicData_() {
  return {
    ok:true,
    users: readTable_('Usuarios'),
    trainers: readTable_('Entrenadores'),
    categories: readTable_('Categorias'),
    fixture: sortFixture_(readTable_('Fixture')),
    players: readTable_('Jugadores'),
    teams: readTable_('Equipos'),
    descansos: readTable_('Descansos'),
    convocatorias: safeReadTable_('Convocatorias'),
    referees: safeReadTable_('Arbitros'),
    matchReferees: safeReadTable_('Partido_Arbitros'),
    matchEvents: safeReadTable_('Eventos_Partido'),
    results: safeReadTable_('Resultados')
  };
}
function getCoachDashboard_(user) {
  if (!user || !user.teamId) return {ok:false, message:'Usuario entrenador inválido'};
  var teamId = user.teamId;
  var trainers = readTable_('Entrenadores');
  var teams = readTable_('Equipos');
  var trainer = trainers.find(function(t){ return String(t.teamId) === String(teamId); }) || user;
  var teamRecord = teams.find(function(t){ return String(t.teamId) === String(teamId); }) || {};
  var team = Object.assign({}, trainer, teamRecord);
  var teamName = String(team.teamName || user.teamName || '').trim().toUpperCase();
  var players = readTable_('Jugadores').filter(function(p){
    return String(p.teamId).trim().toUpperCase() === String(teamId).trim().toUpperCase() ||
           (teamName && String(p.teamName || '').trim().toUpperCase() === teamName);
  });
  players = players.map(function(p){
    if(!p.photoUrl && p.dni) p.photoUrl = 'assets/img/jugadores/' + p.dni + '.png';
    return p;
  });
  if(!team.crestUrl && team.teamId) team.crestUrl = 'assets/img/equipos/' + team.teamId + '.PNG';
  var fixture = sortFixture_(readTable_('Fixture')).filter(function(m){ return String(m.home).trim().toUpperCase() === teamName || String(m.away).trim().toUpperCase() === teamName; });
  var convocatorias = readTable_('Convocatorias').filter(function(c){ return String(c.teamId) === String(teamId); });
  return {ok:true, user:user, team:team, categories:readTable_('Categorias'), players:players, fixture:fixture, convocatorias:convocatorias};
}
function saveTeamProfile_(p) {
  if(!p.teamId) return {ok:false, message:'Falta teamId'};
  var ok = updateRowByKey_('Entrenadores', 'teamId', p.teamId, p);
  return {ok:ok, team:p, message: ok ? 'Perfil actualizado' : 'Equipo no encontrado'};
}
function savePlayer_(p) {
  if(!p.teamId) return {ok:false, message:'Falta teamId'};
  var dup = validateDuplicatePlayer_(p);
  if(!dup.ok) return dup;
  var players = readTable_('Jugadores').filter(function(x){ return String(x.teamId) === String(p.teamId); });
  var selected = categoryList_(p.categories || p.category);
  for (var i=0; i<selected.length; i++) {
    var cat = selected[i];
    var count = players.filter(function(x){ return categoryList_(x.categories || x.category).indexOf(cat) !== -1; }).length;
    if (count >= 15) return {ok:false, message:'Máximo 15 jugadores en ' + cat};
  }
  p.playerId = p.playerId || nextId_('P','Jugadores','playerId');
  p.fullName = p.fullName || [p.firstName || '', p.lastName || ''].join(' ').trim();
  p.documentType = p.documentType || 'DNI';
  p.createdAt = new Date();
  appendRowByHeaders_('Jugadores', p);
  return {ok:true, player:p};
}

function updatePlayer_(p) {
  if(!p.playerId) return {ok:false, message:'Falta playerId'};
  var dup = validateDuplicatePlayer_(p, p.playerId);
  if(!dup.ok) return dup;
  p.fullName = p.fullName || [p.firstName || '', p.lastName || ''].join(' ').trim();
  p.documentType = p.documentType || 'DNI';
  var ok = updateRowByKey_('Jugadores', 'playerId', p.playerId, p);
  return {ok:ok, player:p, message: ok ? 'Jugador actualizado' : 'Jugador no encontrado'};
}
function deletePlayer_(playerId) {
  if(!playerId) return {ok:false, message:'Falta playerId'};
  var ok = deleteRowByKey_('Jugadores', 'playerId', playerId);
  return {ok:ok, message: ok ? 'Jugador eliminado' : 'Jugador no encontrado'};
}
function sendConvocatoriaEmail_(p, isEdit) {
  try {
    var email = p.coachEmail || '';
    if(!email) {
      var users = readTable_('Usuarios');
      var u = users.find(function(x){ return String(x.teamId) === String(p.teamId); });
      email = u && u.email;
    }
    if(!email) return;
    var match = p.match || readTable_('Fixture').find(function(m){ return String(m.matchId) === String(p.matchId); }) || {};
    var coachName = p.coachName || 'profesor';
    var subject = (isEdit ? 'Convocatoria actualizada' : 'Convocatoria confirmada') + ' - ' + (match.home || '') + ' vs ' + (match.away || '');
    var logo = configValue_('PUBLIC_LOGO_URL', 'https://via.placeholder.com/220x90?text=Pacha+Deportes');
    var html = '<div style="font-family:Arial,sans-serif;background:#f3f7f2;padding:24px;color:#102033">' +
      '<div style="max-width:680px;margin:auto;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 18px 42px rgba(15,23,42,.12)">' +
      '<div style="background:#071225;padding:22px;text-align:center"><img src="'+logo+'" style="max-width:210px;height:auto" alt="Pacha Deportes"></div>' +
      '<div style="padding:26px"><h2 style="margin:0 0 10px;color:#14532d">'+(isEdit?'Convocatoria actualizada':'Convocatoria confirmada')+'</h2>' +
      '<p>Hola '+coachName+', esta es tu convocatoria para el partido <b>'+(match.home||'')+' vs '+(match.away||'')+'</b>.</p>' +
      '<p><b>Fecha:</b> '+(match.dateLabel||'')+'<br><b>Campo:</b> '+(match.field||'')+'<br><b>Hora:</b> '+(match.time||'')+'<br><b>Categoría:</b> '+(match.category||'')+'</p>' +
      '<p>Recuerda que puedes editar tu convocatoria hasta <b>5 minutos antes</b> del inicio del partido.</p>' +
      '<div style="margin-top:22px;padding:14px 16px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:14px;color:#166534"><b>Pacha Deportes</b><br>Gestión Deportiva - App</div>' +
      '</div></div></div>';
    MailApp.sendEmail({to: email, subject: subject, htmlBody: html});
  } catch(err) {
    // No bloquea el guardado de convocatoria si el correo falla.
  }
}
function saveConvocatoria_(p) {
  if(!p.matchId || !p.teamId) return {ok:false, message:'Falta matchId o teamId'};
  var match = p.match || readTable_('Fixture').find(function(m){ return String(m.matchId) === String(p.matchId); }) || {};
  var maxStarters = maxStartersForCategory_(match.category || p.category);
  var starters = Array.from(new Set(p.starters || [])).filter(Boolean);
  var substitutes = Array.from(new Set(p.substitutes || [])).filter(Boolean).filter(function(id){ return starters.indexOf(id) === -1; });
  if(starters.length > maxStarters) {
    return {ok:false, message:'No puedes registrar más de ' + maxStarters + ' titulares para ' + (match.category || 'esta categoría') + '.'};
  }
  var id = p.matchId + '_' + p.teamId;
  var previous = readTable_('Convocatorias').find(function(c){ return String(c.convocatoriaId) === String(id); });
  var row = {
    convocatoriaId: id,
    matchId: p.matchId,
    teamId: p.teamId,
    teamName: p.teamName,
    starters: JSON.stringify(starters),
    substitutes: JSON.stringify(substitutes),
    status: 'convocado',
    savedAt: new Date(),
    notes: previous ? 'Convocatoria editada' : 'Convocatoria creada'
  };
  p.starters = starters;
  p.substitutes = substitutes;
  p.match = match;
  var updated = updateRowByKey_('Convocatorias','convocatoriaId',id,row);
  if(!updated) appendRowByHeaders_('Convocatorias', row);
  sendConvocatoriaEmail_(p, !!previous);
  return {ok:true, convocatoria: row};
}


function roleIsAdmin_(user) {
  var role = String((user && (user.role || user.rol)) || '').toLowerCase();
  return role === 'admin';
}

function matchDateIso_(value) {
  if(Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  var raw = String(value || '').trim();
  if(/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0,10);
  var m = raw.match(/^(\d{1,2})[\/. -](\d{1,2})[\/. -](\d{4})$/);
  if(m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return raw.slice(0,10);
}

function canStartMatchByTime_(match, user) {
  if(roleIsAdmin_(user)) return {ok:true};
  var status = String(match.status || match.estado || 'programado').toLowerCase();
  if(status === 'en_juego' || status === 'jugado' || status === 'finalizado') return {ok:true};
  var date = matchDateIso_(match.matchDate || match.date || match.fecha || '');
  var time = String(match.time || match.hora || '');
  var m = time.match(/^(\d{1,2}):(\d{2})/);
  if(!date || !m) return {ok:false, message:'Este partido aún no tiene fecha y hora válida para iniciar.'};
  var start = new Date(date + 'T' + ('0' + m[1]).slice(-2) + ':' + m[2] + ':00');
  if(isNaN(start.getTime())) return {ok:false, message:'No se pudo validar la hora del partido.'};
  var allow = new Date(start.getTime() - 5 * 60 * 1000);
  if(new Date().getTime() < allow.getTime()) return {ok:false, message:'El arbitraje se habilita 5 minutos antes de la hora programada.'};
  return {ok:true};
}
function adjustScoreForEvent_(match, event, reverse) {
  var homeScore = Number(match.homeScore || match.golesLocal || 0) || 0;
  var awayScore = Number(match.awayScore || match.golesVisitante || 0) || 0;
  var type = String(event.eventType || event.tipo || '').toLowerCase();
  var side = String(event.teamSide || '').toLowerCase();
  var delta = 0;
  if(type === 'gol') delta = reverse ? -1 : 1;
  if(type === 'anulacion_gol') delta = reverse ? 1 : -1;
  if(side === 'home') homeScore = Math.max(0, homeScore + delta);
  if(side === 'away') awayScore = Math.max(0, awayScore + delta);
  return {homeScore:homeScore, awayScore:awayScore};
}

function startMatch_(p) {
  if(!p.matchId) return {ok:false, message:'Falta matchId'};
  var user = p.user || {};
  var current = readTable_('Fixture').find(function(m){ return String(m.matchId) === String(p.matchId); }) || {};
  var allowed = canStartMatchByTime_(current, user);
  if(!allowed.ok) return allowed;
  var ok = updateRowByKey_('Fixture','matchId',p.matchId,{
    status:'en_juego', estado:'en_juego', startedAt:new Date(), startedBy:user.userId || user.email || ''
  });
  var match = readTable_('Fixture').find(function(m){ return String(m.matchId) === String(p.matchId); }) || {};
  return {ok:ok, match:match, message: ok ? 'Partido iniciado' : 'Partido no encontrado'};
}
function saveMatchEvent_(p) {
  if(!p.matchId) return {ok:false, message:'Falta matchId'};
  ensureSheetWithHeaders_('Eventos_Partido', ['eventId','matchId','minute','teamSide','teamName','playerId','playerName','eventType','notes','createdBy','createdAt']);
  var user = p.user || {};
  var rows = readTable_('Eventos_Partido');
  var eventId = p.eventId || nextId_('EVT','Eventos_Partido','eventId');
  var event = {
    eventId:eventId,
    matchId:p.matchId,
    minute:p.minute || '',
    teamSide:p.teamSide || '',
    teamName:p.teamName || '',
    playerId:p.playerId || '',
    playerName:p.playerName || '',
    eventType:p.eventType || 'observacion',
    notes:p.notes || '',
    createdBy:user.userId || user.email || '',
    createdAt:new Date()
  };
  appendRowByHeaders_('Eventos_Partido', event);
  var fixture = readTable_('Fixture');
  var match = fixture.find(function(m){ return String(m.matchId) === String(p.matchId); }) || {};
  var score = adjustScoreForEvent_(match, p, false);
  updateRowByKey_('Fixture','matchId',p.matchId,{homeScore:score.homeScore, awayScore:score.awayScore, golesLocal:score.homeScore, golesVisitante:score.awayScore, status:'en_juego', estado:'en_juego', updatedAt:new Date()});
  match = readTable_('Fixture').find(function(m){ return String(m.matchId) === String(p.matchId); }) || {};
  var events = readTable_('Eventos_Partido').filter(function(e){ return String(e.matchId) === String(p.matchId); });
  return {ok:true, match:match, event:event, events:events};
}
function finishMatch_(p) {
  if(!p.matchId) return {ok:false, message:'Falta matchId'};
  ensureSheetWithHeaders_('Resultados', ['matchId','homeScore','awayScore','status','resultType','updatedBy','updatedAt']);
  var user = p.user || {};
  var row = {
    matchId:p.matchId,
    homeScore:p.homeScore,
    awayScore:p.awayScore,
    status:'jugado',
    resultType:p.resultType || 'normal',
    updatedBy:user.userId || user.email || '',
    updatedAt:new Date()
  };
  var okFixture = updateRowByKey_('Fixture','matchId',p.matchId,{
    homeScore:p.homeScore, awayScore:p.awayScore, status:'jugado', estado:'jugado', resultType:p.resultType || 'normal', finishedAt:new Date(), finishedBy:user.userId || user.email || ''
  });
  var okResult = updateRowByKey_('Resultados','matchId',p.matchId,row);
  if(!okResult) appendRowByHeaders_('Resultados', row);
  var match = readTable_('Fixture').find(function(m){ return String(m.matchId) === String(p.matchId); }) || {};
  return {ok:okFixture, match:match, message: okFixture ? 'Partido finalizado' : 'Partido no encontrado'};
}

function saveResult_(p) {
  if(!p.matchId) return {ok:false, message:'Falta matchId'};
  var ok = updateRowByKey_('Fixture','matchId',p.matchId,{
    homeScore:p.homeScore, awayScore:p.awayScore, status:'jugado', resultType:p.resultType || 'normal', notes:p.notes || ''
  });
  return {ok:ok};
}


function deleteMatchEvent_(p) {
  if(!p.matchId || !p.eventId) return {ok:false, message:'Falta matchId o eventId'};
  ensureSheetWithHeaders_('Eventos_Partido', ['eventId','matchId','minute','teamSide','teamName','playerId','playerName','eventType','notes','createdBy','createdAt']);
  var events = readTable_('Eventos_Partido');
  var event = events.find(function(e){ return String(e.eventId) === String(p.eventId) && String(e.matchId) === String(p.matchId); });
  if(!event) return {ok:false, message:'Evento no encontrado'};
  var fixture = readTable_('Fixture');
  var match = fixture.find(function(m){ return String(m.matchId) === String(p.matchId); }) || {};
  var score = adjustScoreForEvent_(match, event, true);
  var okDelete = deleteRowByKey_('Eventos_Partido', 'eventId', p.eventId);
  updateRowByKey_('Fixture','matchId',p.matchId,{homeScore:score.homeScore, awayScore:score.awayScore, golesLocal:score.homeScore, golesVisitante:score.awayScore, updatedAt:new Date()});
  match = readTable_('Fixture').find(function(m){ return String(m.matchId) === String(p.matchId); }) || {};
  events = readTable_('Eventos_Partido').filter(function(e){ return String(e.matchId) === String(p.matchId); });
  return {ok:okDelete, match:match, events:events};
}

function registerCoachRequest_(p) {
  ensureSheetWithHeaders_('Solicitudes_Registro', ['requestId','firstName','lastName','dni','email','whatsapp','teamName','status','createdAt']);
  var requestId = nextId_('SOL','Solicitudes_Registro','requestId');
  var row = {
    requestId: requestId,
    firstName: p.firstName || '',
    lastName: p.lastName || '',
    dni: p.dni || '',
    email: p.email || '',
    whatsapp: p.whatsapp || '',
    teamName: p.teamName || '',
    status: 'pendiente',
    createdAt: new Date()
  };
  appendRowByHeaders_('Solicitudes_Registro', row);
  var adminEmail = 'pacharamacdeportes@gmail.com';
  var fullName = [row.firstName, row.lastName].join(' ').trim();
  try {
    MailApp.sendEmail({
      to: adminEmail,
      subject: 'Nueva solicitud de registro - Pacha Deportes',
      htmlBody: '<h2>Nueva solicitud de registro</h2>' +
        '<p><b>Nombre:</b> ' + fullName + '</p>' +
        '<p><b>DNI:</b> ' + row.dni + '</p>' +
        '<p><b>Correo:</b> ' + row.email + '</p>' +
        '<p><b>WhatsApp:</b> ' + row.whatsapp + '</p>' +
        '<p><b>Equipo:</b> ' + row.teamName + '</p>'
    });
    if(row.email) {
      MailApp.sendEmail({
        to: row.email,
        subject: 'Solicitud recibida - Pacha Deportes',
        htmlBody: '<p>Hola ' + (row.firstName || '') + ',</p><p>Hemos recibido tu solicitud de acceso para Pacha Deportes. Tu solicitud está en evaluación y pronto nos contactaremos contigo.</p><p>Gracias por registrarte.</p>'
      });
    }
  } catch(err) {
    return {ok:true, message:'Solicitud guardada. No se pudo enviar el correo: ' + err.message};
  }
  return {ok:true, request:row, message:'Solicitud enviada correctamente.'};
}
