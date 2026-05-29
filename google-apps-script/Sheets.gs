function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('No existe la hoja: ' + name);
  return sh;
}

function sheetObjects_(name) {
  var sh = sheet_(name);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function(h){ return String(h).trim(); });
  return values.slice(1).filter(function(row){
    return row.some(function(cell){ return cell !== '' && cell !== null; });
  }).map(function(row){
    var obj = {};
    headers.forEach(function(h, i){ obj[h] = row[i]; });
    return obj;
  });
}

function appendObject_(sheetName, obj) {
  var sh = sheet_(sheetName);
  var headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  var row = headers.map(function(h){ return obj[h] || ''; });
  sh.appendRow(row);
}

function updateRowById_(sheetName, idField, idValue, patch) {
  var sh = sheet_(sheetName);
  var data = sh.getDataRange().getValues();
  var headers = data[0];
  var idIndex = headers.indexOf(idField);
  if (idIndex < 0) throw new Error('No existe columna ' + idField);
  for (var r=1; r<data.length; r++) {
    if (String(data[r][idIndex]) === String(idValue)) {
      headers.forEach(function(h, i){
        if (patch.hasOwnProperty(h)) sh.getRange(r+1, i+1).setValue(patch[h]);
      });
      return true;
    }
  }
  return false;
}
