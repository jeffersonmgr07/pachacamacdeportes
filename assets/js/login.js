async function handleLogin(email, password){
  const res = await API.login(email, password);
  if(!res.ok){ toast(res.message || 'No se pudo iniciar sesión'); return; }
  Store.setUser(res.user);
  if(res.user.role === 'admin') location.href = 'admin.html';
  else location.href = 'entrenador.html';
}
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('[data-login-form]').forEach(form=>{
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      await handleLogin(fd.get('email'), fd.get('password'));
    });
  });
});
