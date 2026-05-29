function seedMinettiFutbol() {
  seedRows_('Config', [
    ['Torneo Municipal de Fútbol de Menores 2026','Municipalidad Distrital de Pachacamac','Distrito de Pachacamac','2026','Fase de grupos']
  ]);
  seedRows_('Campeonatos', [
    ['CH-FUT-MEN-2026','Torneo Municipal de Fútbol de Menores 2026','Fútbol','Activo','campeonato-futbol-menores-2026.html'],
    ['CH-VOL-MEN-2026','Torneo Municipal de Vóley de Menores','Vóley','Próximamente','#'],
    ['CH-REL-LIB-2026','Torneo Relámpago Categoría Libre','Fútbol','Próximamente','#']
  ]);
  seedRows_('Categorias', [
    ['SUB6','Sub 6','2020 - 2021',7,5,'15 - 15 minutos','5 minutos'],
    ['SUB8','Sub 8','2018 - 2019',7,5,'15 - 15 minutos','5 minutos'],
    ['SUB10','Sub 10','2016 - 2017',9,7,'15 - 15 minutos','5 minutos'],
    ['SUB12','Sub 12','2014 - 2015',9,7,'20 - 20 minutos','5 minutos'],
    ['SUB13','Sub 13','2013',9,7,'Por confirmar','5 minutos'],
    ['SUB15','Sub 15','2011',9,7,'Por confirmar','5 minutos']
  ]);
  seedRows_('Usuarios', [
    ['U001','admin','admin123','admin','Administrador','', 'activo'],
    ['U002','guerreros','demo123','entrenador','Elvis Robles','EQ-S6-003','activo']
  ]);
  seedRows_('Equipos', [
    ['EQ-S6-001','JM SPORT','SUB6','Único','','','','','',''],
    ['EQ-S6-002','TOLENTINO FC','SUB6','Único','','','','','',''],
    ['EQ-S6-003','GUERREROS DE MANCHAY','SUB6','Único','Academia Deportiva Guerreros de Manchay','Distrito de Pachacamac','+51 900 000 000','guerreros@example.com','SUB6,SUB8,SUB10,SUB12','logo-placeholder.svg'],
    ['EQ-S6-004','CLUB DEPORTIVO LARA','SUB6','Único','','','','','',''],
    ['EQ-S6-005','RENACE JUVENTUD','SUB6','Único','','','','','',''],
    ['EQ-S6-006','BENJAMIN FC','SUB6','Único','','','','','','']
  ]);
  seedRows_('Jugadores', [
    ['P001','EQ-S6-003','GUERREROS DE MANCHAY','SUB6','SUB6,SUB8,SUB10,SUB12','Jugador','Demo 1','90000001','2020-04-15','90000001.png','aprobado', new Date()],
    ['P002','EQ-S6-003','GUERREROS DE MANCHAY','SUB6','SUB6,SUB8,SUB10,SUB12','Jugador','Demo 2','90000002','2020-07-08','90000002.png','aprobado', new Date()]
  ]);
  seedRows_('Fixture', [
    ['M001',1,'17 de mayo','Campo 1','09:00','JM SPORT','RENACE JUVENTUD','SUB6','Único','programado','','', ''],
    ['M002',1,'17 de mayo','Campo 1','09:40','BENJAMIN FC','CLUB DEPORTIVO LARA','SUB6','Único','programado','','', ''],
    ['M003',1,'17 de mayo','Campo 1','10:20','TOLENTINO FC','GUERREROS DE MANCHAY','SUB6','Único','programado','','', ''],
    ['M021',2,'24 de mayo','Campo 1','09:00','RENACE JUVENTUD','GUERREROS DE MANCHAY','SUB6','Único','programado','','', ''],
    ['M033',3,'31 de mayo','Campo 1','Por confirmar','GUERREROS DE MANCHAY','JM SPORT','SUB6','Único','pendiente','','', ''],
    ['M040',4,'7 de junio','Por programar','--:--','GUERREROS DE MANCHAY','BENJAMIN FC','SUB6','Único','pendiente','','', '']
  ]);
}

function seedRows_(sheetName, rows) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) return;
  if (sh.getLastRow() > 1) return; // no pisa datos existentes
  if (rows.length) sh.getRange(2,1,rows.length,rows[0].length).setValues(rows);
}
