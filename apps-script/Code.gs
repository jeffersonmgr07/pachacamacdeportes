/**
 * Minetti Fútbol - Google Apps Script
 * Web pública + panel de delegado alimentados por Google Sheets.
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

/**
 * Ejecutar una sola vez desde Apps Script.
 * Crea una hoja de cálculo si el script no está vinculado a una y carga la data inicial.
 */
function setupMinettiFutbol() {
  const ss = getSpreadsheet_();
  createOrResetSheet_(SHEETS.CONFIG, ['key', 'value'], SEED_CONFIG.map(x => [x.key, x.value]));
  createOrResetSheet_(SHEETS.CATEGORIES, ['id', 'name', 'label', 'birthYears', 'minBirthYear', 'maxBirthYear', 'playersOnField', 'minPlayersOnField', 'gameTime', 'breakTime'],
    SEED_CATEGORIES.map(x => [x.id, x.name, x.label, x.birthYears, x.minBirthYear, x.maxBirthYear, x.playersOnField, x.minPlayersOnField, x.gameTime, x.breakTime]));
  createOrResetSheet_(SHEETS.TEAMS, ['teamId', 'categoryId', 'categoryName', 'group', 'name', 'active'],
    SEED_TEAMS.map(x => [x.teamId, x.categoryId, x.categoryName, x.group, x.name, x.active]));
  createOrResetSheet_(SHEETS.FIXTURE, ['id', 'dateLabel', 'round', 'field', 'time', 'categoryId', 'categoryLabel', 'group', 'home', 'away', 'status', 'homeScore', 'awayScore', 'resultType', 'note'],
    SEED_FIXTURE.map(x => [x.id, x.dateLabel, x.round, x.field, x.time, x.categoryId, x.categoryLabel, x.group, x.home, x.away, x.status, x.homeScore, x.awayScore, x.resultType, x.note]));
  createOrResetSheet_(SHEETS.PLAYERS, ['playerId', 'teamId', 'categoryId', 'categoryName', 'group', 'teamName', 'fullName', 'dni', 'birthDate', 'birthYear', 'status', 'photoFileName', 'photoUrl'],
    SEED_PLAYERS.map(x => [x.playerId, x.teamId, x.categoryId, x.categoryName, x.group, x.teamName, x.fullName, x.dni, x.birthDate, x.birthYear, x.status, x.photoFileName, x.photoUrl]));
  createOrResetSheet_(SHEETS.DELEGATES, ['token', 'delegateName', 'phone', 'teamId', 'role', 'status'],
    SEED_DELEGATES.map(x => [x.token, x.delegateName, x.phone, x.teamId, x.role, x.status]));
  createOrResetSheet_(SHEETS.CALLUPS, ['callupId', 'timestamp', 'matchId', 'teamId', 'delegateToken', 'status', 'totalTitulares', 'totalSuplentes', 'notes'], []);
  createOrResetSheet_(SHEETS.CALLUP_DETAILS, ['callupId', 'playerId', 'dni', 'fullName', 'role'], []);
  createOrResetSheet_(SHEETS.SANCTIONS, ['id', 'playerId', 'dni', 'fullName', 'teamId', 'matchId', 'type', 'matchesSuspended', 'status', 'note'], []);
  applyBasicFormatting_();
  return {
    ok: true,
    spreadsheetUrl: ss.getUrl(),
    webAppInstruction: 'Ahora publica como Aplicación web desde Implementar > Nueva implementación.'
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
    delegateData: getDelegateData(token || 'demo-guerreros-sub6')
  };
}

function getPublicData() {
  const categories = rows_(SHEETS.CATEGORIES);
  const teams = rows_(SHEETS.TEAMS);
  const fixture = rows_(SHEETS.FIXTURE);
  const played = fixture.filter(r => norm_(r.status) === 'jugado');
  return {
    categories,
    teams,
    fixture: fixture.sort(sortFixture_),
    results: played.sort(sortFixture_),
    standings: buildStandings_(teams, played),
    latestResults: played.slice().sort(sortFixture_).reverse().slice(0, 8),
    upcoming: fixture.filter(r => r.away && norm_(r.status) !== 'jugado' && norm_(r.status) !== 'descansa').sort(sortFixture_).slice(0, 12)
  };
}

function getDelegateData(token) {
  const delegates = rows_(SHEETS.DELEGATES);
  const delegate = delegates.find(d => String(d.token) === String(token)) || delegates[0];
  if (!delegate) return null;

  const teams = rows_(SHEETS.TEAMS);
  const team = teams.find(t => String(t.teamId) === String(delegate.teamId));
  if (!team) return null;

  const players = rows_(SHEETS.PLAYERS)
    .filter(p => String(p.teamId) === String(team.teamId))
    .map(p => ({
      ...p,
      photoUrl: resolvePlayerPhotoUrl_(p)
    }));

  const fixture = rows_(SHEETS.FIXTURE);
  const teamName = norm_(team.name);
  const upcomingMatches = fixture
    .filter(m => m.away && norm_(m.status) !== 'jugado' && (norm_(m.home) === teamName || norm_(m.away) === teamName))
    .sort(sortFixture_)
    .slice(0, 8);

  const category = rows_(SHEETS.CATEGORIES).find(c => String(c.id) === String(team.categoryId)) || {};
  return { delegate, team, category, players, upcomingMatches };
}

function saveCallup(payload) {
  ensureSheets_();
  if (!payload || !payload.token || !payload.matchId) {
    throw new Error('Faltan datos de convocatoria.');
  }
  const delegateData = getDelegateData(payload.token);
  if (!delegateData) throw new Error('Token de delegado no válido.');

  const selected = []
    .concat((payload.starters || []).map(id => ({ playerId: id, role: 'titular' })))
    .concat((payload.substitutes || []).map(id => ({ playerId: id, role: 'suplente' })));

  const unique = [...new Set(selected.map(x => x.playerId))];
  if (unique.length !== selected.length) throw new Error('Hay jugadores repetidos en la convocatoria.');

  const approvedIds = new Set(delegateData.players.filter(p => norm_(p.status) === 'aprobado').map(p => String(p.playerId)));
  selected.forEach(x => {
    if (!approvedIds.has(String(x.playerId))) throw new Error('Uno o más jugadores no están aprobados.');
  });

  const callupId = 'conv-' + Utilities.getUuid();
  const timestamp = new Date();
  const ss = getSpreadsheet_();
  ss.getSheetByName(SHEETS.CALLUPS).appendRow([
    callupId,
    timestamp,
    payload.matchId,
    delegateData.team.teamId,
    payload.token,
    'enviada',
    (payload.starters || []).length,
    (payload.substitutes || []).length,
    payload.notes || ''
  ]);

  const detailsSheet = ss.getSheetByName(SHEETS.CALLUP_DETAILS);
  selected.forEach(x => {
    const p = delegateData.players.find(pl => String(pl.playerId) === String(x.playerId));
    detailsSheet.appendRow([callupId, p.playerId, p.dni, p.fullName, x.role]);
  });

  return { ok: true, callupId, message: 'Convocatoria guardada correctamente.' };
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
    status: headers.indexOf('status'),
    homeScore: headers.indexOf('homeScore'),
    awayScore: headers.indexOf('awayScore'),
    resultType: headers.indexOf('resultType'),
    note: headers.indexOf('note')
  };

  sh.getRange(rowIndex + 1, columns.status + 1).setValue(payload.status || 'jugado');
  sh.getRange(rowIndex + 1, columns.homeScore + 1).setValue(Number(payload.homeScore || 0));
  sh.getRange(rowIndex + 1, columns.awayScore + 1).setValue(Number(payload.awayScore || 0));
  sh.getRange(rowIndex + 1, columns.resultType + 1).setValue(payload.resultType || 'normal');
  sh.getRange(rowIndex + 1, columns.note + 1).setValue(payload.note || '');
  return { ok: true, message: 'Resultado actualizado.' };
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
  if (!ss.getSheetByName(SHEETS.CONFIG) || !ss.getSheetByName(SHEETS.FIXTURE)) {
    setupMinettiFutbol();
  }
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

function resolvePlayerPhotoUrl_(player) {
  if (player.photoUrl) return player.photoUrl;
  const cfg = getConfig_();
  const folderId = cfg.PLAYER_PHOTOS_FOLDER_ID;
  const fileName = player.photoFileName || (player.dni + '.png');
  if (!folderId || String(folderId).indexOf('PEGAR_AQUI') >= 0) return '';
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFilesByName(fileName);
    if (files.hasNext()) {
      const file = files.next();
      return 'https://drive.google.com/uc?export=view&id=' + file.getId();
    }
  } catch (err) {
    return '';
  }
  return '';
}

function buildStandings_(teams, results) {
  const table = {};
  teams.forEach(t => {
    const key = t.categoryId + '__' + t.group + '__' + norm_(t.name);
    table[key] = {
      categoryId: t.categoryId,
      categoryName: t.categoryName,
      group: t.group,
      team: t.name,
      pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0
    };
  });

  results.forEach(r => {
    if (!r.away) return;
    const homeKey = r.categoryId + '__' + r.group + '__' + norm_(r.home);
    const awayKey = r.categoryId + '__' + r.group + '__' + norm_(r.away);
    const home = table[homeKey];
    const away = table[awayKey];
    if (!home || !away) return;

    const hs = Number(r.homeScore || 0);
    const as = Number(r.awayScore || 0);
    home.pj++; away.pj++;
    home.gf += hs; home.gc += as;
    away.gf += as; away.gc += hs;

    if (norm_(r.resultType) === 'wo') {
      home.pg++; away.pp++; home.pts += 3; away.pts -= 3;
    } else if (hs > as) {
      home.pg++; away.pp++; home.pts += 3;
    } else if (hs < as) {
      away.pg++; home.pp++; away.pts += 3;
    } else {
      home.pe++; away.pe++; home.pts++; away.pts++;
    }
  });

  const rows = Object.values(table).map(r => ({ ...r, dg: r.gf - r.gc }));
  const groups = {};
  rows.forEach(r => {
    const key = r.categoryId + '__' + r.group;
    groups[key] = groups[key] || [];
    groups[key].push(r);
  });

  Object.values(groups).forEach(groupRows => {
    groupRows.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || String(a.team).localeCompare(String(b.team)));
    groupRows.forEach((r, idx) => r.position = idx + 1);
  });

  return rows.sort((a, b) => String(a.categoryName).localeCompare(String(b.categoryName)) || String(a.group).localeCompare(String(b.group)) || a.position - b.position);
}

function sortFixture_(a, b) {
  return Number(a.round || 999) - Number(b.round || 999) ||
    String(a.dateLabel).localeCompare(String(b.dateLabel)) ||
    String(a.field).localeCompare(String(b.field)) ||
    String(a.time).localeCompare(String(b.time));
}

function norm_(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function applyBasicFormatting_() {
  const ss = getSpreadsheet_();
  Object.values(SHEETS).forEach(name => {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    const range = sh.getDataRange();
    if (range.getNumRows() > 0) {
      sh.getRange(1, 1, 1, range.getNumColumns())
        .setFontWeight('bold')
        .setBackground('#166534')
        .setFontColor('#ffffff');
      sh.autoResizeColumns(1, range.getNumColumns());
    }
  });
}
