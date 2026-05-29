function login_(username, password) {
  username = String(username || '').toLowerCase().trim();
  password = String(password || '').trim();
  var users = sheetObjects_('Usuarios');
  var user = users.find(function(u){
    return String(u.username).toLowerCase().trim() === username &&
           String(u.password).trim() === password &&
           String(u.status || 'activo').toLowerCase() === 'activo';
  });
  if (!user) return { ok: false, message: 'Usuario o contraseña incorrectos.' };
  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      teamId: user.teamId
    }
  };
}
