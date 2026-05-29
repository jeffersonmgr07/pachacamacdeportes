function setupMinettiFutbol() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = {
    Config: ['name','organizer','venue','season','status'],
    Campeonatos: ['id','name','sport','status','url'],
    Categorias: ['id','label','birthYears','fieldPlayers','minPlayers','gameTime','break'],
    Usuarios: ['id','username','password','role','name','teamId','status'],
    Solicitudes_Registro: ['id','userId','firstName','lastName','dni','whatsapp','teamName','tempPassword','status','createdAt'],
    Equipos: ['id','name','category','group','businessName','address','whatsapp','email','enabledCategories','badgeFileName'],
    Equipos_Perfil: ['id','name','businessName','address','whatsapp','email','updatedAt'],
    Jugadores: ['id','teamId','teamName','category','categories','firstName','lastName','dni','birthDate','photoFileName','status','createdAt'],
    Fixture: ['id','round','dateLabel','field','time','home','away','category','group','status','homeScore','awayScore','updatedAt'],
    Convocatorias: ['id','matchId','teamId','status','createdAt'],
    Convocatoria_Detalle: ['convocationId','playerId','type'],
    Sanciones: ['id','playerId','matchId','type','matches','status','notes']
  };

  Object.keys(sheets).forEach(function(name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.appendRow(sheets[name]);
    else {
      sh.getRange(1,1,1,sheets[name].length).setValues([sheets[name]]);
    }
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,sheets[name].length).setFontWeight('bold').setBackground('#06101f').setFontColor('#ffffff');
    sh.autoResizeColumns(1, sheets[name].length);
  });

  seedMinettiFutbol();
}
