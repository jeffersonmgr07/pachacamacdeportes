function cleanLogin_(value) {
  return String(value || '').trim().toLowerCase();
}

function pickFirst_(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (obj && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') return obj[k];
  }
  return '';
}

function normalizeLoginUser_(u) {
  var fullName = pickFirst_(u, ['fullName', 'nombre', 'name']) || [pickFirst_(u, ['firstName', 'nombres']), pickFirst_(u, ['lastName', 'apellidos'])].join(' ').trim();
  var shortName = pickFirst_(u, ['shortName', 'nombreCorto']) || fullName;
  return Object.assign({}, u, {
    email: pickFirst_(u, ['email', 'correo', 'Correo']),
    password: String(pickFirst_(u, ['password', 'clave', 'contraseña', 'contrasena', 'Password'])),
    role: String(pickFirst_(u, ['role', 'rol', 'Rol']) || 'entrenador').toLowerCase(),
    status: String(pickFirst_(u, ['status', 'estado', 'Estado']) || 'activo').toLowerCase(),
    fullName: fullName,
    shortName: shortName,
    teamId: pickFirst_(u, ['teamId', 'equipoId', 'EquipoId']),
    teamName: pickFirst_(u, ['teamName', 'equipo', 'Equipo'])
  });
}

function login_(email, password) {
  var identifier = cleanLogin_(email);
  var pass = String(password || '').trim();
  if (!identifier || !pass) return {ok:false, message:'Ingresa correo y contraseña'};

  var users = readTable_('Usuarios').map(normalizeLoginUser_);
  var user = users.find(function(u){
    var candidates = [u.email, u.username, u.usuario, u.dni, u.userId].map(cleanLogin_).filter(Boolean);
    return candidates.indexOf(identifier) !== -1 && String(u.password || '').trim() === pass && String(u.status || 'activo').toLowerCase() !== 'inactivo';
  });

  // Respaldo: algunas plantillas antiguas guardaban accesos de entrenadores en la hoja Entrenadores.
  if (!user) {
    user = readTable_('Entrenadores').map(normalizeLoginUser_).find(function(u){
      var candidates = [u.email, u.username, u.usuario, u.dni, u.userId, u.trainerId].map(cleanLogin_).filter(Boolean);
      return candidates.indexOf(identifier) !== -1 && String(u.password || '').trim() === pass && String(u.status || 'activo').toLowerCase() !== 'inactivo';
    });
  }

  if (!user) return {ok:false, message:'Correo o clave incorrecta'};
  return {ok:true, user:user};
}
