function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}
function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('No existe la hoja: ' + name);
  return sh;
}
function readTable_(sheetName) {
  var sh = sheet_(sheetName);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(String);
  return values.slice(1).filter(function(row){
    return row.some(function(v){ return v !== '' && v !== null; });
  }).map(function(row){
    var obj = {};
    headers.forEach(function(h,i){ obj[h] = row[i]; });
    return obj;
  });
}
function appendRowByHeaders_(sheetName, obj) {
  var sh = sheet_(sheetName);
  var headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
  var row = headers.map(function(h){ return obj[h] !== undefined ? obj[h] : ''; });
  sh.appendRow(row);
}
function updateRowByKey_(sheetName, keyName, keyValue, obj) {
  var sh = sheet_(sheetName);
  var values = sh.getDataRange().getValues();
  if (values.length < 1) return false;
  var headers = values[0].map(String);
  var keyIdx = headers.indexOf(keyName);
  if (keyIdx === -1) throw new Error('No existe columna clave: ' + keyName);
  for (var r=1; r<values.length; r++) {
    if (String(values[r][keyIdx]) === String(keyValue)) {
      headers.forEach(function(h,c){
        if (obj[h] !== undefined) sh.getRange(r+1,c+1).setValue(obj[h]);
      });
      return true;
    }
  }
  return false;
}
function nextId_(prefix, sheetName, idCol) {
  var rows = readTable_(sheetName);
  var max = 0;
  rows.forEach(function(r){
    var val = String(r[idCol] || '').replace(prefix,'');
    var n = Number(val);
    if(!isNaN(n) && n > max) max = n;
  });
  return prefix + Utilities.formatString('%03d', max + 1);
}


function deleteRowByKey_(sheetName, keyName, keyValue) {
  var sh = sheet_(sheetName);
  var values = sh.getDataRange().getValues();
  if (values.length < 1) return false;
  var headers = values[0].map(String);
  var keyIdx = headers.indexOf(keyName);
  if (keyIdx === -1) throw new Error('No existe columna clave: ' + keyName);
  for (var r=1; r<values.length; r++) {
    if (String(values[r][keyIdx]) === String(keyValue)) {
      sh.deleteRow(r+1);
      return true;
    }
  }
  return false;
}


function configValue_(key, fallback) {
  try {
    var rows = readTable_('Config');
    var found = rows.find(function(r){ return String(r.key) === String(key); });
    return found && found.value ? found.value : fallback;
  } catch(err) { return fallback; }
}


function safeReadTable_(sheetName) {
  try { return readTable_(sheetName); }
  catch(err) { return []; }
}
function ensureSheetWithHeaders_(sheetName, headers) {
  var ss = ss_();
  var sh = ss.getSheetByName(sheetName);
  if(!sh) {
    sh = ss.insertSheet(sheetName);
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    return sh;
  }
  if(sh.getLastRow() === 0 || sh.getLastColumn() === 0) {
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    return sh;
  }
  var current = sh.getRange(1,1,1,Math.max(sh.getLastColumn(),1)).getValues()[0].map(String);
  var changed = false;
  headers.forEach(function(h){ if(current.indexOf(h) === -1){ current.push(h); changed = true; } });
  if(changed) sh.getRange(1,1,1,current.length).setValues([current]);
  return sh;
}
