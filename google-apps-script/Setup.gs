
function setupPachaDeportes() {
  // Seguro: no borra datos existentes. Para reiniciar todo usa resetPachaDeportesConDatosDemo_().
  createSheet_('Config', ['key','value','description'], [
    ['APP_NAME','Portal de deportes Pachacamac','Nombre visible del portal'],
    ['CURRENT_ROUND','3','Fecha habilitada para convocatorias'],
    ['CHAMPIONSHIP_ID','CHAMP_FUT_MEN_2026','Campeonato activo'],
    ['MAX_PLAYERS_PER_CATEGORY','15','Máximo de jugadores por categoría'],
    ['IMAGES_TEAMS_PATH','assets/img/equipos/','Ruta de insignias en GitHub Pages'],
    ['IMAGES_PLAYERS_PATH','assets/img/jugadores/','Ruta de fotos de jugadores en GitHub Pages'],
    ['PUBLIC_LOGO_URL','','URL pública completa del logo para correos HTML']
  ]);

  createSheet_('Categorias', ['categoryId','name','label','birthYears','minYear','maxYear','playersOnField','minPlayers'], 
    SEED_DATA.categories.map(function(c){ return [c.categoryId,c.name,c.label,c.birthYears,c.minYear,c.maxYear,c.playersOnField,c.minPlayers]; }));

  createSheet_('Usuarios', ['userId','trainerId','teamId','fullName','shortName','dni','email','password','teamName','role','status'], 
    SEED_DATA.users.map(function(u){ return [u.userId,u.trainerId,u.teamId,u.fullName,u.shortName,u.dni,u.email,u.password,u.teamName,u.role,u.status]; }));

  createSheet_('Entrenadores', ['trainerId','teamId','fullName','shortName','dni','email','password','teamName','role','status','legalName','address','whatsapp','crestUrl','categories'], 
    SEED_DATA.trainers.map(function(t){ return [t.trainerId,t.teamId,t.fullName,t.shortName,t.dni,t.email,t.password,t.teamName,t.role,t.status,t.legalName||'',t.address||'',t.whatsapp||'',t.crestUrl||'',t.categories||'']; }));

  createSheet_('Equipos', ['teamId','teamName','legalName','coachName','email','whatsapp','address','categories','crestUrl'], 
    SEED_DATA.teams.map(function(t){ return [t.teamId,t.teamName,t.legalName||'',t.coachName||'',t.email||'',t.whatsapp||'',t.address||'',t.categories||'',t.crestUrl||'']; }));

  createSheet_('Jugadores', ['playerId','teamId','teamName','firstName','lastName','fullName','documentType','dni','birthDate','categories','photoUrl','status','notes'], 
    SEED_DATA.players.map(function(p){ return [p.playerId,p.teamId,p.teamName,p.firstName||'',p.lastName||'',p.fullName,p.documentType||'DNI',p.dni,p.birthDate,p.categories,p.photoUrl,p.status||'activo',p.notes||'']; }));

  createSheet_('Fixture', ['matchId','round','dateLabel','matchDate','field','time','home','away','category','status','homeScore','awayScore','resultType','notes'], 
    SEED_DATA.fixture.map(function(m){ return [m.matchId,m.round,m.dateLabel,m.matchDate,m.field,m.time,m.home,m.away,m.category,m.status,m.homeScore,m.awayScore,m.resultType||'',m.notes||'']; }));

  createSheet_('Descansos', ['round','dateLabel','category','team','notes'],
    (SEED_DATA.descansos||[]).map(function(d){ return [d.round,d.dateLabel,d.category,d.team,'Descansa según fixture']; }));

  createSheet_('Convocatorias', ['convocatoriaId','matchId','teamId','teamName','starters','substitutes','status','savedAt','notes'], []);
  createSheet_('Sanciones', ['sanctionId','matchId','playerId','teamId','playerName','type','matches','notes','status'], []);
  createSheet_('Resultados_Log', ['logId','matchId','date','home','away','homeScore','awayScore','updatedBy','updatedAt','notes'], []);
  createSheet_('Tabla_Posiciones', ['category','team','PJ','PG','PE','PP','GF','GC','DG','PTS','notes'], [['Se calcula en el HTML leyendo Fixture','','','','','','','','','','']]);
  SpreadsheetApp.getActive().toast('Estructura creada correctamente', 'Pacha Deportes', 5);
}
function createSheet_(name, headers, rows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  var isNew = false;
  if(!sh){
    sh = ss.insertSheet(name);
    isNew = true;
  }
  // No borrar datos existentes al actualizar el Apps Script. Solo crea/ordena encabezados si la hoja está vacía.
  if(sh.getLastRow() === 0 || sh.getLastColumn() === 0){
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    if(rows && rows.length) sh.getRange(2,1,rows.length,headers.length).setValues(rows);
  } else {
    // Agrega encabezados faltantes al final sin tocar las columnas existentes.
    var current = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
    headers.forEach(function(h){
      if(current.indexOf(h) === -1){
        sh.getRange(1, sh.getLastColumn()+1).setValue(h);
      }
    });
  }
  sh.getRange(1,1,1,sh.getLastColumn()).setFontWeight('bold').setBackground('#071225').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, sh.getLastColumn());
}

function resetPachaDeportesConDatosDemo_(){
  // Usar solo si quieres borrar todo y volver a cargar datos demo.
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheets().forEach(function(sh){ sh.clear(); });
  setupPachaDeportes();
}
