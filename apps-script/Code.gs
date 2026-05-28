/**
 * Minetti Fútbol - Google Apps Script
 * Web pública + login de entrenadores/admin + panel de equipos + convocatorias.
 * Base de datos: Google Sheets.
 */

const SHEETS = {
  CONFIG: 'Config',
  CATEGORIES: 'Categorias',
  TEAMS: 'Equipos',
  FIXTURE: 'Fixture',
  PLAYERS: 'Jugadores',
  DELEGATES: 'Delegados',
  CALLUPS: 'Convocatorias',
  CALLUP_DETAILS: 'Convocatoria_Detalle',
  SANCTIONS: 'Sanciones',
  USERS: 'Usuarios',
  TEAM_PROFILES: 'Equipos_Perfil',
  TEAM_CATEGORIES: 'Equipo_Categorias'
};

function doGet(e) {
  e = e || { parameter: {} };
  const template = HtmlService.createTemplateFromFile('Index');
  template.route = e.parameter.page || 'inicio';
  template.token = e.parameter.token || 'demo-guerreros-sub6';
  template.baseUrl = ScriptApp.getService().getUrl();
  return template
    .evaluate()
    .setTitle('Minetti Fútbol')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** Prueba rápida desde Apps Script: ejecutar para verificar que el login demo funciona. */
function testLoginDemo() {
  setupMinettiFutbol();
  return loginUser({ username: 'admin', password: 'admin123' });
}


/** Ejecutar una sola vez desde Apps Script para crear/cargar la base. */
function setupMinettiFutbol() {
  const ss = getSpreadsheet_();

  const categories = getSeedCategories_();
  createOrResetSheet_(SHEETS.CONFIG, ['key', 'value'], SEED_CONFIG.map(x => [x.key, x.value]));
  createOrResetSheet_(SHEETS.CATEGORIES, ['id', 'name', 'label', 'birthYears', 'minBirthYear', 'maxBirthYear', 'playersOnField', 'minPlayersOnField', 'gameTime', 'breakTime'],
    categories.map(x => [x.id, x.name, x.label, x.birthYears, x.minBirthYear, x.maxBirthYear, x.playersOnField, x.minPlayersOnField, x.gameTime, x.breakTime]));
  createOrResetSheet_(SHEETS.TEAMS, ['teamId', 'categoryId', 'categoryName', 'group', 'name', 'active'],
    SEED_TEAMS.map(x => [x.teamId, x.categoryId, x.categoryName, x.group, x.name, x.active]));
  createOrResetSheet_(SHEETS.FIXTURE, ['id', 'dateLabel', 'round', 'field', 'time', 'categoryId', 'categoryLabel', 'group', 'home', 'away', 'status', 'homeScore', 'awayScore', 'resultType', 'note'],
    SEED_FIXTURE.map(x => [x.id, x.dateLabel, x.round, x.field, x.time, x.categoryId, x.categoryLabel, x.group, x.home, x.away, x.status, x.homeScore, x.awayScore, x.resultType, x.note]));
  createOrResetSheet_(SHEETS.PLAYERS, ['playerId', 'teamId', 'categoryId', 'categoryName', 'group', 'teamName', 'fullName', 'dni', 'birthDate', 'birthYear', 'status', 'photoFileName', 'photoUrl', 'createdByUserId', 'createdAt'],
    SEED_PLAYERS.map(x => [x.playerId, x.teamId, x.categoryId, x.categoryName, x.group, x.teamName, x.fullName, x.dni, x.birthDate, x.birthYear, x.status, x.photoFileName, x.photoUrl, 'user-guerreros-demo', new Date()]));
  createOrResetSheet_(SHEETS.DELEGATES, ['token', 'delegateName', 'phone', 'teamId', 'role', 'status'],
    SEED_DELEGATES.map(x => [x.token, x.delegateName, x.phone, x.teamId, x.role, x.status]));
  createOrResetSheet_(SHEETS.CALLUPS, ['callupId', 'timestamp', 'matchId', 'teamId', 'delegateToken', 'status', 'totalTitulares', 'totalSuplentes', 'notes', 'createdByUserId'], []);
  createOrResetSheet_(SHEETS.CALLUP_DETAILS, ['callupId', 'playerId', 'dni', 'fullName', 'role'], []);
  createOrResetSheet_(SHEETS.SANCTIONS, ['id', 'playerId', 'dni', 'fullName', 'teamId', 'matchId', 'type', 'matchesSuspended', 'status', 'note'], []);

  createOrResetSheet_(SHEETS.USERS, ['userId', 'role', 'firstName', 'lastName', 'username', 'password', 'phone', 'email', 'teamId', 'status', 'createdAt'], [
    ['admin-001', 'admin', 'Administrador', 'Torneo', 'admin', 'admin123', '', 'admin@minettifutbol.local', '', 'activo', new Date()],
    ['user-guerreros-demo', 'entrenador', 'Elvis', 'Robles', 'guerreros', 'demo123', '900000000', 'guerreros@demo.local', 'team-guerreros-sub6', 'activo', new Date()]
  ]);
  createOrResetSheet_(SHEETS.TEAM_PROFILES, ['teamId', 'coachUserId', 'teamName', 'legalName', 'address', 'whatsapp', 'email', 'status', 'createdAt'], [
    ['team-guerreros-sub6', 'user-guerreros-demo', 'GUERREROS DE MANCHAY', '', 'Manchay - Pachacamac', '900000000', 'guerreros@demo.local', 'activo', new Date()]
  ]);
  createOrResetSheet_(SHEETS.TEAM_CATEGORIES, ['teamId', 'categoryId', 'categoryLabel', 'enabled'], [
    ['team-guerreros-sub6', 'sub6', '6 AÑOS', true]
  ]);

  applyBasicFormatting_();
  return {
    ok: true,
    spreadsheetUrl: ss.getUrl(),
    demoUsers: 'Admin: admin / admin123 · Entrenador demo: guerreros / demo123'
  };
}

function getInitialData(route, token) {
  ensureSheets_();
  return {
    ok: true,
    route: route || 'inicio',
    token: token || '',
    config: getConfig_(),
    publicData: getPublicData(),
    categories: rows_(SHEETS.CATEGORIES),
    delegateData: getDelegateData(token || 'demo-guerreros-sub6')
  };
}

function getPublicData() {
  const categories = rows_(SHEETS.CATEGORIES);
  const teams = rows_(SHEETS.TEAMS);
  const profiles = rows_(SHEETS.TEAM_PROFILES);
  const fixture = rows_(SHEETS.FIXTURE);
  const played = fixture.filter(r => norm_(r.status) === 'jugado');
  return {
    categories,
    teams,
    teamProfiles: profiles,
    fixture: fixture.sort(sortFixture_),
    results: played.sort(sortFixture_),
    standings: buildStandings_(teams, played),
    latestResults: played.slice().sort(sortFixture_).reverse().slice(0, 8),
    upcoming: fixture.filter(r => r.away && norm_(r.status) !== 'jugado' && norm_(r.status) !== 'descansa').sort(sortFixture_).slice(0, 12)
  };
}

function loginUser(payload) {
  ensureSheets_();
  const username = norm_(payload && payload.username);
  const password = String((payload && payload.password) || '');
  if (!username || !password) throw new Error('Ingresa usuario y contraseña.');

  const user = rows_(SHEETS.USERS).find(u => norm_(u.username) === username && String(u.password) === password && norm_(u.status) === 'activo');
  if (!user) throw new Error('Usuario o contraseña incorrectos.');
  return {
    ok: true,
    user: publicUser_(user),
    redirect: user.role === 'admin' ? 'admin' : 'entrenador'
  };
}

function registerCoach(payload) {
  ensureSheets_();
  if (!payload) throw new Error('Faltan datos.');
  const firstName = clean_(payload.firstName);
  const lastName = clean_(payload.lastName);
  const username = clean_(payload.username || payload.email || payload.phone).toLowerCase();
  const password = String(payload.password || '').trim();
  const teamName = clean_(payload.teamName).toUpperCase();
  if (!firstName || !lastName || !username || !password || !teamName) {
    throw new Error('Completa nombre, apellido, usuario, contraseña y nombre del equipo.');
  }
  if (rows_(SHEETS.USERS).some(u => norm_(u.username) === norm_(username))) {
    throw new Error('Ese usuario ya existe.');
  }

  const userId = 'user-' + Utilities.getUuid();
  const teamId = 'team-' + Utilities.getUuid();
  const now = new Date();
  const ss = getSpreadsheet_();

  ss.getSheetByName(SHEETS.USERS).appendRow([userId, 'entrenador', firstName, lastName, username, password, clean_(payload.phone), clean_(payload.email), teamId, 'activo', now]);
  ss.getSheetByName(SHEETS.TEAM_PROFILES).appendRow([teamId, userId, teamName, clean_(payload.legalName), clean_(payload.address), clean_(payload.whatsapp || payload.phone), clean_(payload.teamEmail || payload.email), 'pendiente_revision', now]);

  const selectedCategories = payload.categories || [];
  const categories = rows_(SHEETS.CATEGORIES);
  selectedCategories.forEach(catId => {
    const cat = categories.find(c => String(c.id) === String(catId));
    if (cat) ss.getSheetByName(SHEETS.TEAM_CATEGORIES).appendRow([teamId, cat.id, cat.label || cat.name, true]);
  });

  return { ok: true, user: publicUser_({ userId, role: 'entrenador', firstName, lastName, username, phone: clean_(payload.phone), email: clean_(payload.email), teamId, status: 'activo' }) };
}

function getUserPanel(userId) {
  ensureSheets_();
  const user = rows_(SHEETS.USERS).find(u => String(u.userId) === String(userId));
  if (!user || norm_(user.status) !== 'activo') throw new Error('Usuario no válido.');
  if (user.role === 'admin') return getAdminPanel_(user);
  return getCoachPanel_(user);
}

function saveTeamProfile(payload) {
  ensureSheets_();
  const user = getUserById_(payload.userId);
  if (!user || user.role !== 'entrenador') throw new Error('Acceso no permitido.');
  const teamId = String(user.teamId);
  const sh = getSpreadsheet_().getSheetByName(SHEETS.TEAM_PROFILES);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const rowIndex = values.findIndex((r, i) => i > 0 && String(r[headers.indexOf('teamId')]) === teamId);
  const data = {
    teamName: clean_(payload.teamName).toUpperCase(),
    legalName: clean_(payload.legalName),
    address: clean_(payload.address),
    whatsapp: clean_(payload.whatsapp),
    email: clean_(payload.email)
  };
  if (!data.teamName) throw new Error('El nombre del equipo es obligatorio.');

  if (rowIndex > 0) {
    Object.keys(data).forEach(key => sh.getRange(rowIndex + 1, headers.indexOf(key) + 1).setValue(data[key]));
  } else {
    sh.appendRow([teamId, user.userId, data.teamName, data.legalName, data.address, data.whatsapp, data.email, 'pendiente_revision', new Date()]);
  }

  updateTeamCategories_(teamId, payload.categories || []);
  return { ok: true, message: 'Datos del equipo actualizados.' };
}

function registerPlayerFromCoach(payload) {
  ensureSheets_();
  const user = getUserById_(payload.userId);
  if (!user || user.role !== 'entrenador') throw new Error('Acceso no permitido.');
  const team = getTeamProfileById_(user.teamId);
  if (!team) throw new Error('Primero registra los datos del equipo.');

  const fullName = clean_(payload.fullName).toUpperCase();
  const dni = cleanDni_(payload.dni);
  const birthDate = clean_(payload.birthDate);
  const categoryId = clean_(payload.categoryId);
  if (!fullName || !dni || !birthDate || !categoryId) throw new Error('Completa nombre, DNI, fecha de nacimiento y categoría.');

  const birthYear = new Date(birthDate).getFullYear();
  const category = rows_(SHEETS.CATEGORIES).find(c => String(c.id) === categoryId) || {};
  const duplicate = rows_(SHEETS.PLAYERS).some(p => cleanDni_(p.dni) === dni && String(p.categoryId) === categoryId && String(p.teamId) !== String(user.teamId));
  if (duplicate) throw new Error('Este DNI ya está registrado en otro equipo dentro de la misma categoría.');

  let photoUrl = clean_(payload.photoUrl);
  let photoFileName = dni + '.png';
  if (payload.photoDataUrl) {
    const uploaded = savePlayerPhoto_(dni, payload.photoDataUrl);
    photoUrl = uploaded.url;
    photoFileName = uploaded.name;
  }

  const playerId = 'player-' + Utilities.getUuid();
  getSpreadsheet_().getSheetByName(SHEETS.PLAYERS).appendRow([
    playerId,
    user.teamId,
    categoryId,
    category.name || category.label || categoryId,
    '',
    team.teamName,
    fullName,
    dni,
    birthDate,
    birthYear,
    'pendiente_revision',
    photoFileName,
    photoUrl,
    user.userId,
    new Date()
  ]);
  return { ok: true, message: 'Jugador registrado. Queda pendiente de revisión por la organización.' };
}

function getDelegateData(token) {
  const delegates = rows_(SHEETS.DELEGATES);
  const delegate = delegates.find(d => String(d.token) === String(token)) || delegates[0];
  if (!delegate) return null;
  const teams = rows_(SHEETS.TEAMS);
  const team = teams.find(t => String(t.teamId) === String(delegate.teamId)) || getTeamProfileById_(delegate.teamId);
  if (!team) return null;
  const teamId = team.teamId;
  const players = rows_(SHEETS.PLAYERS)
    .filter(p => String(p.teamId) === String(teamId))
    .map(p => ({ ...p, photoUrl: resolvePlayerPhotoUrl_(p) }));
  const fixture = rows_(SHEETS.FIXTURE);
  const teamName = norm_(team.name || team.teamName);
  const upcomingMatches = fixture
    .filter(m => m.away && norm_(m.status) !== 'jugado' && (norm_(m.home) === teamName || norm_(m.away) === teamName))
    .sort(sortFixture_)
    .slice(0, 8);
  const category = rows_(SHEETS.CATEGORIES).find(c => String(c.id) === String(team.categoryId)) || rows_(SHEETS.CATEGORIES)[0] || {};
  return { delegate, team, category, players, upcomingMatches };
}

function saveCallup(payload) {
  ensureSheets_();
  if (!payload || !payload.matchId) throw new Error('Faltan datos de convocatoria.');

  let teamId = payload.teamId;
  let token = payload.token || '';
  let userId = payload.userId || '';
  let players = [];
  if (userId) {
    const user = getUserById_(userId);
    if (!user || user.role !== 'entrenador') throw new Error('Acceso no permitido.');
    teamId = user.teamId;
    players = rows_(SHEETS.PLAYERS).filter(p => String(p.teamId) === String(teamId));
  } else {
    const delegateData = getDelegateData(token);
    if (!delegateData) throw new Error('Token de delegado no válido.');
    teamId = delegateData.team.teamId;
    players = delegateData.players;
  }

  const selected = []
    .concat((payload.starters || []).map(id => ({ playerId: id, role: 'titular' })))
    .concat((payload.substitutes || []).map(id => ({ playerId: id, role: 'suplente' })));
  const unique = [...new Set(selected.map(x => x.playerId))];
  if (unique.length !== selected.length) throw new Error('Hay jugadores repetidos en la convocatoria.');

  const approvedIds = new Set(players.filter(p => ['aprobado', 'pendiente_revision'].includes(norm_(p.status))).map(p => String(p.playerId)));
  selected.forEach(x => {
    if (!approvedIds.has(String(x.playerId))) throw new Error('Uno o más jugadores no están habilitados.');
  });

  const callupId = 'conv-' + Utilities.getUuid();
  const timestamp = new Date();
  const ss = getSpreadsheet_();
  ss.getSheetByName(SHEETS.CALLUPS).appendRow([
    callupId,
    timestamp,
    payload.matchId,
    teamId,
    token,
    'enviada',
    (payload.starters || []).length,
    (payload.substitutes || []).length,
    payload.notes || '',
    userId
  ]);

  const detailsSheet = ss.getSheetByName(SHEETS.CALLUP_DETAILS);
  selected.forEach(x => {
    const p = players.find(pl => String(pl.playerId) === String(x.playerId));
    if (p) detailsSheet.appendRow([callupId, p.playerId, p.dni, p.fullName, x.role]);
  });
  return { ok: true, callupId, message: 'Convocatoria enviada correctamente al administrador.' };
}

function updateFixtureResult(payload) {
  ensureSheets_();
  if (!payload || !payload.matchId) throw new Error('Falta matchId.');
  const sh = getSpreadsheet_().getSheetByName(SHEETS.FIXTURE);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('id');
  const rowIndex = values.findIndex((r, idx) => idx > 0 && String(r[idCol]) === String(payload.matchId));
  if (rowIndex < 1) throw new Error('Partido no encontrado.');
  const columns = {
    status: headers.indexOf('status'), homeScore: headers.indexOf('homeScore'), awayScore: headers.indexOf('awayScore'), resultType: headers.indexOf('resultType'), note: headers.indexOf('note')
  };
  sh.getRange(rowIndex + 1, columns.status + 1).setValue(payload.status || 'jugado');
  sh.getRange(rowIndex + 1, columns.homeScore + 1).setValue(Number(payload.homeScore || 0));
  sh.getRange(rowIndex + 1, columns.awayScore + 1).setValue(Number(payload.awayScore || 0));
  sh.getRange(rowIndex + 1, columns.resultType + 1).setValue(payload.resultType || 'normal');
  sh.getRange(rowIndex + 1, columns.note + 1).setValue(payload.note || '');
  return { ok: true, message: 'Resultado actualizado.' };
}

function getAdminPanel_(user) {
  const publicData = getPublicData();
  return {
    ok: true,
    role: 'admin',
    user: publicUser_(user),
    publicData,
    users: rows_(SHEETS.USERS).map(publicUser_),
    teamProfiles: rows_(SHEETS.TEAM_PROFILES),
    players: rows_(SHEETS.PLAYERS).map(p => ({ ...p, photoUrl: resolvePlayerPhotoUrl_(p) })),
    callups: rows_(SHEETS.CALLUPS).slice().reverse(),
    callupDetails: rows_(SHEETS.CALLUP_DETAILS).slice().reverse()
  };
}

function getCoachPanel_(user) {
  const team = getTeamProfileById_(user.teamId) || {};
  const enabledCategories = rows_(SHEETS.TEAM_CATEGORIES).filter(x => String(x.teamId) === String(user.teamId) && String(x.enabled) !== 'false');
  const categoryIds = enabledCategories.map(x => String(x.categoryId));
  const categories = rows_(SHEETS.CATEGORIES);
  const players = rows_(SHEETS.PLAYERS)
    .filter(p => String(p.teamId) === String(user.teamId))
    .map(p => ({ ...p, photoUrl: resolvePlayerPhotoUrl_(p) }));
  const fixture = rows_(SHEETS.FIXTURE);
  const teamName = norm_(team.teamName);
  const upcomingMatches = fixture
    .filter(m => m.away && norm_(m.status) !== 'jugado' && (norm_(m.home) === teamName || norm_(m.away) === teamName || categoryIds.includes(String(m.categoryId))))
    .sort(sortFixture_)
    .slice(0, 12);
  return {
    ok: true,
    role: 'entrenador',
    user: publicUser_(user),
    team,
    categories,
    enabledCategories,
    players,
    upcomingMatches,
    callups: rows_(SHEETS.CALLUPS).filter(c => String(c.teamId) === String(user.teamId)).slice().reverse()
  };
}

function updateTeamCategories_(teamId, selectedIds) {
  const ss = getSpreadsheet_();
  const sh = ss.getSheetByName(SHEETS.TEAM_CATEGORIES);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][headers.indexOf('teamId')]) === String(teamId)) sh.deleteRow(i + 1);
  }
  const categories = rows_(SHEETS.CATEGORIES);
  (selectedIds || []).forEach(catId => {
    const cat = categories.find(c => String(c.id) === String(catId));
    if (cat) sh.appendRow([teamId, cat.id, cat.label || cat.name, true]);
  });
}

function savePlayerPhoto_(dni, dataUrl) {
  const folderId = getConfig_().PLAYER_PHOTOS_FOLDER_ID;
  let folder;
  if (folderId) folder = DriveApp.getFolderById(folderId);
  else {
    const folders = DriveApp.getFoldersByName('IMG');
    const root = folders.hasNext() ? folders.next() : DriveApp.createFolder('IMG');
    const sub = root.getFoldersByName('jugadores');
    folder = sub.hasNext() ? sub.next() : root.createFolder('jugadores');
  }
  const match = String(dataUrl).match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error('Formato de imagen no válido.');
  const contentType = match[1];
  const bytes = Utilities.base64Decode(match[2]);
  const blob = Utilities.newBlob(bytes, contentType, dni + '.png');
  const existing = folder.getFilesByName(dni + '.png');
  while (existing.hasNext()) existing.next().setTrashed(true);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { id: file.getId(), name: file.getName(), url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w400' };
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const storedId = props.getProperty('SPREADSHEET_ID');
  if (storedId) return SpreadsheetApp.openById(storedId);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty('SPREADSHEET_ID', active.getId());
    return active;
  }
  const ss = SpreadsheetApp.create('Minetti Fútbol - Base de datos');
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

function ensureSheets_() {
  const ss = getSpreadsheet_();
  if (!ss.getSheetByName(SHEETS.CONFIG) || !ss.getSheetByName(SHEETS.FIXTURE) || !ss.getSheetByName(SHEETS.USERS)) setupMinettiFutbol();
}

function createOrResetSheet_(name, headers, rows) {
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.clear();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length) sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, headers.length);
}

function rows_(sheetName) {
  const sh = getSpreadsheet_().getSheetByName(sheetName);
  if (!sh) return [];
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(r => r.some(c => c !== '')).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function getConfig_() {
  const cfg = {};
  rows_(SHEETS.CONFIG).forEach(r => cfg[r.key] = r.value);
  return cfg;
}

function getUserById_(userId) {
  return rows_(SHEETS.USERS).find(u => String(u.userId) === String(userId));
}

function getTeamProfileById_(teamId) {
  return rows_(SHEETS.TEAM_PROFILES).find(t => String(t.teamId) === String(teamId));
}

function publicUser_(user) {
  return {
    userId: user.userId,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    phone: user.phone,
    email: user.email,
    teamId: user.teamId,
    status: user.status
  };
}

function clean_(value) { return String(value == null ? '' : value).trim(); }
function cleanDni_(value) { return clean_(value).replace(/\D/g, ''); }
function norm_(value) { return String(value == null ? '' : value).trim().toLowerCase(); }

function resolvePlayerPhotoUrl_(p) {
  if (p.photoUrl) return p.photoUrl;
  const fileName = p.photoFileName || (p.dni ? p.dni + '.png' : '');
  const folderId = getConfig_().PLAYER_PHOTOS_FOLDER_ID;
  if (!fileName || !folderId) return '';
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFilesByName(fileName);
    if (files.hasNext()) {
      const file = files.next();
      return 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w400';
    }
  } catch (err) {}
  return '';
}

function sortFixture_(a, b) {
  const ra = Number(a.round || 0), rb = Number(b.round || 0);
  if (ra !== rb) return ra - rb;
  const ta = String(a.time || ''), tb = String(b.time || '');
  return ta.localeCompare(tb);
}

function buildStandings_(teams, played) {
  const map = {};
  teams.forEach(t => {
    const key = `${t.categoryId}|${t.group}|${t.name}`;
    map[key] = { categoryId: t.categoryId, categoryName: t.categoryName, group: t.group, team: t.name, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, dg:0, pts:0 };
  });
  played.forEach(m => {
    if (!m.home || !m.away) return;
    const hk = `${m.categoryId}|${m.group}|${m.home}`;
    const ak = `${m.categoryId}|${m.group}|${m.away}`;
    if (!map[hk]) map[hk] = { categoryId:m.categoryId, categoryName:m.categoryLabel, group:m.group, team:m.home, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, dg:0, pts:0 };
    if (!map[ak]) map[ak] = { categoryId:m.categoryId, categoryName:m.categoryLabel, group:m.group, team:m.away, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, dg:0, pts:0 };
    const hs = Number(m.homeScore || 0), as = Number(m.awayScore || 0);
    map[hk].pj++; map[ak].pj++;
    map[hk].gf += hs; map[hk].gc += as;
    map[ak].gf += as; map[ak].gc += hs;
    if (hs > as) { map[hk].pg++; map[hk].pts += 3; map[ak].pp++; }
    else if (hs < as) { map[ak].pg++; map[ak].pts += 3; map[hk].pp++; }
    else { map[hk].pe++; map[ak].pe++; map[hk].pts++; map[ak].pts++; }
  });
  const rows = Object.values(map).map(r => ({...r, dg: r.gf - r.gc}));
  const grouped = {};
  rows.forEach(r => { const k = `${r.categoryId}|${r.group}`; if(!grouped[k]) grouped[k]=[]; grouped[k].push(r); });
  Object.values(grouped).forEach(group => {
    group.sort((a,b) => b.pts-a.pts || b.dg-a.dg || b.gf-a.gf || a.team.localeCompare(b.team));
    group.forEach((r,i)=>r.position=i+1);
  });
  return rows.sort((a,b)=>String(a.categoryId).localeCompare(String(b.categoryId)) || String(a.group).localeCompare(String(b.group)) || a.position-b.position);
}

function getSeedCategories_() {
  const base = (typeof SEED_CATEGORIES !== 'undefined' ? SEED_CATEGORIES : []).slice();
  const ids = new Set(base.map(c => c.id));
  const extra = [
    { id:'sub15', name:'15 AÑOS', label:'Sub 15', birthYears:'Por definir', minBirthYear:0, maxBirthYear:9999, playersOnField:11, minPlayersOnField:7, gameTime:'Por definir', breakTime:'Por definir' },
    { id:'sub16', name:'16 AÑOS', label:'Sub 16', birthYears:'Por definir', minBirthYear:0, maxBirthYear:9999, playersOnField:11, minPlayersOnField:7, gameTime:'Por definir', breakTime:'Por definir' }
  ];
  extra.forEach(c => { if (!ids.has(c.id)) base.push(c); });
  return base;
}

function applyBasicFormatting_() {
  const ss = getSpreadsheet_();
  Object.values(SHEETS).forEach(name => {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    const lastCol = Math.max(sh.getLastColumn(), 1);
    sh.getRange(1,1,1,lastCol).setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');
    sh.setFrozenRows(1);
    try { sh.autoResizeColumns(1, lastCol); } catch (err) {}
  });
}
