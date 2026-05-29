function login_(username, password) {
  username = String(username || '').toLowerCase().trim();
  password = String(password || '').trim();
  var users = sheetObjects_('Usuarios');
  var user = users.find(function(u){
    var loginA = String(u.username || '').toLowerCase().trim();
    var loginB = String(u.email || '').toLowerCase().trim();
    return (loginA === username || loginB === username) &&
           String(u.password).trim() === password &&
           String(u.status || 'activo').toLowerCase() === 'activo';
  });
  if (!user) return { ok: false, message: 'Correo o contraseña incorrectos.' };
  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username || user.email,
      email: user.email,
      role: user.role,
      name: user.name,
      teamId: user.teamId,
      teamName: user.teamName
    }
  };
}
