function getPublicData_() {
  return {
    ok:true,
    users: readTable_('Usuarios'),
    trainers: readTable_('Entrenadores'),
    categories: readTable_('Categorias'),
    fixture: readTable_('Fixture'),
    players: readTable_('Jugadores'),
    convocatorias: readTable_('Convocatorias')
  };
}
function getCoachDashboard_(user) {
  if (!user || !user.teamId) return {ok:false, message:'Usuario entrenador inválido'};
  var teamId = user.teamId;
  var trainers = readTable_('Entrenadores');
  var team = trainers.find(function(t){ return String(t.teamId) === String(teamId); }) || user;
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
  if(players.length >= 15) return {ok:false, message:'Máximo 15 jugadores por equipo'};
  p.playerId = p.playerId || nextId_('P','Jugadores','playerId');
  p.createdAt = new Date();
  appendRowByHeaders_('Jugadores', p);
  return {ok:true, player:p};
}
function saveConvocatoria_(p) {
  if(!p.matchId || !p.teamId) return {ok:false, message:'Falta matchId o teamId'};
  var id = p.matchId + '_' + p.teamId;
  var row = {
    convocatoriaId: id,
    matchId: p.matchId,
    teamId: p.teamId,
    teamName: p.teamName,
    starters: JSON.stringify(p.starters || []),
    substitutes: JSON.stringify(p.substitutes || []),
    status: 'convocado',
    savedAt: new Date()
  };
  var updated = updateRowByKey_('Convocatorias','convocatoriaId',id,row);
  if(!updated) appendRowByHeaders_('Convocatorias', row);
  return {ok:true, convocatoria: row};
}
function saveResult_(p) {
  if(!p.matchId) return {ok:false, message:'Falta matchId'};
  var ok = updateRowByKey_('Fixture','matchId',p.matchId,{
    homeScore:p.homeScore, awayScore:p.awayScore, status:'jugado', resultType:p.resultType || 'normal', notes:p.notes || ''
  });
  return {ok:ok};
}
