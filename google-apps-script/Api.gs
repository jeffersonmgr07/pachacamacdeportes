function getPublicData_() {
  return {
    ok:true,
    users: readTable_('Usuarios'),
    trainers: readTable_('Entrenadores'),
    categories: readTable_('Categorias'),
    fixture: readTable_('Fixture'),
    players: readTable_('Jugadores'),
    teams: readTable_('Equipos'),
    descansos: readTable_('Descansos'),
    convocatorias: readTable_('Convocatorias')
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
  var players = readTable_('Jugadores').filter(function(p){ return String(p.teamId) === String(teamId); });
  var fixture = readTable_('Fixture').filter(function(m){ return String(m.home) === String(team.teamName) || String(m.away) === String(team.teamName); });
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
  var players = readTable_('Jugadores').filter(function(x){ return String(x.teamId) === String(p.teamId); });
  var selected = String(p.categories || '').split(',').map(function(c){
    return String(c).replace(/\s*\(.+?\)/g,'').trim().toUpperCase();
  }).filter(Boolean);
  for (var i=0; i<selected.length; i++) {
    var cat = selected[i];
    var count = players.filter(function(x){
      return String(x.categories || '').split(',').map(function(c){
        return String(c).replace(/\s*\(.+?\)/g,'').trim().toUpperCase();
      }).indexOf(cat) !== -1;
    }).length;
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
  var id = p.matchId + '_' + p.teamId;
  var previous = readTable_('Convocatorias').find(function(c){ return String(c.convocatoriaId) === String(id); });
  var row = {
    convocatoriaId: id,
    matchId: p.matchId,
    teamId: p.teamId,
    teamName: p.teamName,
    starters: JSON.stringify(p.starters || []),
    substitutes: JSON.stringify(p.substitutes || []),
    status: 'convocado',
    savedAt: new Date(),
    notes: previous ? 'Convocatoria editada' : 'Convocatoria creada'
  };
  var updated = updateRowByKey_('Convocatorias','convocatoriaId',id,row);
  if(!updated) appendRowByHeaders_('Convocatorias', row);
  sendConvocatoriaEmail_(p, !!previous);
  return {ok:true, convocatoria: row};
}
function saveResult_(p) {
  if(!p.matchId) return {ok:false, message:'Falta matchId'};
  var ok = updateRowByKey_('Fixture','matchId',p.matchId,{
    homeScore:p.homeScore, awayScore:p.awayScore, status:'jugado', resultType:p.resultType || 'normal', notes:p.notes || ''
  });
  return {ok:ok};
}
