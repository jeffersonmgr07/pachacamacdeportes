function login_(email, password) {
  email = String(email || '').trim().toLowerCase();
  password = String(password || '').trim();
  var users = readTable_('Usuarios');
  var user = users.find(function(u){
    return String(u.email || '').trim().toLowerCase() === email &&
           String(u.password || '').trim() === password &&
           String(u.status || '').toLowerCase() !== 'inactivo';
  });
  if (!user) return {ok:false, message:'Correo o clave incorrecta'};
  return {ok:true, user:user};
}
