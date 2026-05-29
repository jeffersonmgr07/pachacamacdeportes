function setupPachaDeportes() {
  createSheet_('Config', ['key','value','description'], [
    ['APP_NAME','Portal de deportes Pachacamac','Nombre visible del portal'],
    ['CURRENT_ROUND','3','Fecha habilitada para convocatorias'],
    ['CHAMPIONSHIP_ID','CHAMP_FUT_MEN_2026','Campeonato activo']
  ]);
  createSheet_('Categorias', ['categoryId','name','label','birthYears','minYear','maxYear','playersOnField','minPlayers'], SEED_DATA.categories.map(function(c){ return [c.categoryId,c.name,c.label,c.birthYears,c.minYear,c.maxYear,c.playersOnField,c.minPlayers]; }));
  createSheet_('Usuarios', ['userId','trainerId','teamId','fullName','shortName','dni','email','password','teamName','role','status'], SEED_DATA.users.map(function(u){ return [u.userId,u.trainerId,u.teamId,u.fullName,u.shortName,u.dni,u.email,u.password,u.teamName,u.role,u.status]; }));
  createSheet_('Entrenadores', ['trainerId','teamId','fullName','shortName','dni','email','password','teamName','role','status','legalName','address','whatsapp','crestUrl','categories'], SEED_DATA.trainers.map(function(t){ return [t.trainerId,t.teamId,t.fullName,t.shortName,t.dni,t.email,t.password,t.teamName,t.role,t.status,'','', '', '', 'SUB 6,SUB 8,SUB 10,SUB 12']; }));
  createSheet_('Equipos', ['teamId','teamName','trainerId','legalName','address','email','whatsapp','crestUrl','status'], SEED_DATA.trainers.map(function(t){ return [t.teamId,t.teamName,t.trainerId,'','',t.email,'','',t.status]; }));
  createSheet_('Jugadores', ['playerId','teamId','teamName','fullName','dni','birthDate','categories','photoUrl','createdAt'], SEED_DATA.players.map(function(p){ return [p.playerId,p.teamId,p.teamName,p.fullName,p.dni,p.birthDate,p.categories,p.photoUrl,new Date()]; }));
  createSheet_('Fixture', ['matchId','round','dateLabel','matchDate','field','time','home','away','category','status','homeScore','awayScore','resultType','notes'], SEED_DATA.fixture.map(function(m){ return [m[0]||m.matchId,m[1]||m.round,m[2]||m.dateLabel,m[3]||m.matchDate,m[4]||m.field,m[5]||m.time,m[6]||m.home,m[7]||m.away,m[8]||m.category,m[9]||m.status,'','','','']; }));
  createSheet_('Convocatorias', ['convocatoriaId','matchId','teamId','teamName','starters','substitutes','status','savedAt'], []);
  createSheet_('Sanciones', ['sanctionId','playerId','teamId','matchId','type','matches','status','notes'], []);
  createSheet_('Resultados_Log', ['logId','matchId','homeScore','awayScore','resultType','updatedAt','updatedBy'], []);
  SpreadsheetApp.getActive().toast('Estructura creada correctamente', 'Pacha Deportes', 5);
}
function createSheet_(name, headers, rows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clear();
  sh.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold').setBackground('#071225').setFontColor('#ffffff');
  if(rows && rows.length) sh.getRange(2,1,rows.length,headers.length).setValues(rows);
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, headers.length);
}
