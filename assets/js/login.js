async function handleLogin(email, password, form){
  const button = form?.querySelector('button[type="submit"], button:not([type])');
  const originalText = button?.textContent;
  try{
    if(button){
      button.disabled = true;
      button.textContent = 'Ingresando...';
    }
    const identifier = String(email || '').trim();
    const pass = String(password || '').trim();
    if(!identifier || !pass){
      toast('Ingresa correo y contraseña');
      return;
    }
    const res = await API.login(identifier, pass);
    if(!res || !res.ok){
      toast((res && res.message) || 'Correo o clave incorrecta');
      return;
    }
    Store.setUser(res.user);
    const role = String(res.user.role || '').toLowerCase();
    location.href = role === 'admin' ? 'admin.html' : (role === 'arbitro' || role === 'árbitro' || role === 'referee' ? 'arbitro.html' : 'entrenador.html');
  }catch(err){
    console.error('Error de login:', err);
    toast(err?.message || 'No se pudo conectar con el servidor. Revisa el despliegue de Apps Script.');
  }finally{
    if(button){
      button.disabled = false;
      button.textContent = originalText || 'Iniciar sesión';
    }
  }
}
document.addEventListener('DOMContentLoaded', ()=>{
  const current = Store.getUser?.();
  if(current && location.pathname.endsWith('/login.html')){
    const role = String(current.role || '').toLowerCase();
    // Si ya inició sesión, no lo forzamos inmediatamente para que pueda cambiar de usuario si desea.
  }
  document.querySelectorAll('[data-login-form]').forEach(form=>{
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      await handleLogin(fd.get('email'), fd.get('password'), form);
    });
  });
});
