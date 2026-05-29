function getPublicData_() {
  return {
    tournament: firstObject_('Config'),
    rules: { categories: sheetObjects_('Categorias') },
    teams: sheetObjects_('Equipos'),
    fixture: sheetObjects_('Fixture'),
    players: sheetObjects_('Jugadores'),
    convocations: sheetObjects_('Convocatorias')
  };
}

function firstObject_(sheetName) {
  var rows = sheetObjects_(sheetName);
  return rows.length ? rows[0] : {};
}

function getPlayers_(teamId) {
  var players = sheetObjects_('Jugadores');
  if (!teamId) return players;
  return players.filter(function(p){ return String(p.teamId) === String(teamId); });
}

function getCoachDashboard_(teamId) {
  var teams = sheetObjects_('Equipos');
  var team = teams.find(function(t){ return String(t.id) === String(teamId); });
  if (!team) return { ok: false, message: 'Equipo no encontrado.' };
  var players = getPlayers_(teamId);
  var fixture = sheetObjects_('Fixture').filter(function(m){
    return String(m.home).trim() === String(team.name).trim() || String(m.away).trim() === String(team.name).trim();
  });
  return { ok: true, team: team, players: players, matches: fixture, categories: sheetObjects_('Categorias'), championships: sheetObjects_('Campeonatos') }; 
}

function getAdminDashboard_() {
  return {
    ok: true,
    teams: sheetObjects_('Equipos'),
    fixture: sheetObjects_('Fixture'),
    players: sheetObjects_('Jugadores'),
    convocations: sheetObjects_('Convocatorias'),
    categories: sheetObjects_('Categorias'),
    users: sheetObjects_('Usuarios')
  };
}

function saveTeamProfile_(payload) {
  payload.updatedAt = new Date();
  if (!payload.id) return { ok: false, message: 'Falta ID de equipo.' };
  updateRowById_('Equipos_Perfil', 'id', payload.id, payload);
  return { ok: true, message: 'Perfil de equipo guardado.' };
}

function savePlayer_(payload) {
  payload.id = payload.id || ('P-' + new Date().getTime());
  payload.status = payload.status || 'pendiente';
  payload.createdAt = new Date();
  appendObject_('Jugadores', payload);
  return { ok: true, message: 'Jugador registrado.' };
}

function saveConvocation_(payload) {
  var convId = 'CONV-' + new Date().getTime();
  appendObject_('Convocatorias', {
    id: convId,
    matchId: payload.matchId,
    teamId: payload.teamId || '',
    status: 'enviada',
    createdAt: new Date()
  });
  (payload.starters || []).forEach(function(playerId){
    appendObject_('Convocatoria_Detalle', { convocationId: convId, playerId: playerId, type: 'titular' });
  });
  (payload.substitutes || []).forEach(function(playerId){
    appendObject_('Convocatoria_Detalle', { convocationId: convId, playerId: playerId, type: 'suplente' });
  });
  return { ok: true, message: 'Convocatoria enviada.', id: convId };
}

function saveResult_(payload) {
  var ok = updateRowById_('Fixture', 'id', payload.matchId, {
    homeScore: Number(payload.homeScore),
    awayScore: Number(payload.awayScore),
    status: 'jugado',
    updatedAt: new Date()
  });
  return ok ? { ok: true, message: 'Resultado guardado.' } : { ok: false, message: 'Partido no encontrado.' };
}


function registerCoachRequest_(payload) {
  var dni = String(payload.dni || '').replace(/\D/g, '');
  var initial = String(payload.firstName || '').trim().charAt(0).toUpperCase();
  var tempPassword = dni + initial + '2026';
  var userId = 'U-' + new Date().getTime();
  appendObject_('Usuarios', {
    id: userId,
    username: String(payload.email || '').toLowerCase().trim() || dni,
    email: String(payload.email || '').toLowerCase().trim(),
    password: tempPassword,
    role: 'entrenador',
    name: String(payload.firstName || '') + ' ' + String(payload.lastName || ''),
    firstName: payload.firstName || '',
    lastName: payload.lastName || '',
    dni: dni,
    teamId: '',
    teamName: payload.teamName || '',
    status: 'pendiente',
    createdAt: new Date()
  });
  appendObject_('Solicitudes_Registro', {
    id: 'SOL-' + new Date().getTime(),
    userId: userId,
    firstName: payload.firstName || '',
    lastName: payload.lastName || '',
    dni: dni,
    email: payload.email || '',
    whatsapp: payload.whatsapp || '',
    teamName: payload.teamName || '',
    tempPassword: tempPassword,
    status: 'pendiente',
    createdAt: new Date()
  });
  return { ok: true, message: 'Solicitud registrada. Login temporal: ' + (payload.email || dni) + ' | Clave temporal: ' + tempPassword, tempPassword: tempPassword };
}
