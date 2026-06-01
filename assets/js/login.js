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
    if(!window.API || typeof API.login !== 'function'){
      toast('No se cargó la conexión de login. Revisa que api.js esté publicado.');
      return;
    }
    const res = await API.login(identifier, pass);
    if(!res || !res.ok){
      const msg = (res && res.message) || 'Correo o clave incorrecta';
      if(String(msg).includes('login_')){
        toast('Falta actualizar Apps Script: copia Code.gs/Auth.gs y despliega una nueva versión.');
      }else{
        toast(msg);
      }
      return;
    }
    Store.setUser(res.user);
    const role = String(res.user.role || '').toLowerCase();
    location.href = role === 'admin' ? 'admin.html' : (role === 'arbitro' || role === 'árbitro' || role === 'referee' ? 'arbitro.html' : 'entrenador.html');
  }catch(err){
    console.error('Error de login:', err);
    const msg = err?.message || 'No se pudo conectar con el servidor. Revisa el despliegue de Apps Script.';
    toast(String(msg).includes('login_') ? 'Falta actualizar Apps Script: copia Code.gs/Auth.gs y despliega una nueva versión.' : msg);
  }finally{
    if(button){
      button.disabled = false;
      button.textContent = originalText || 'Iniciar sesión';
    }
  }
}
window.handleLogin = handleLogin;

function bindLoginForms(){
  document.querySelectorAll('[data-login-form]:not([data-login-bound])').forEach(form=>{
    form.dataset.loginBound = 'true';
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      await handleLogin(fd.get('email'), fd.get('password'), form);
    });
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  bindLoginForms();
  setTimeout(bindLoginForms, 50);
  const current = Store.getUser?.();
  if(current && location.pathname.endsWith('/login.html')){
    // Se permite cambiar de usuario manualmente.
  }
});

document.addEventListener('submit', async (e)=>{
  const form = e.target.closest?.('[data-login-form]');
  if(!form || form.dataset.loginBound === 'true') return;
  e.preventDefault();
  const fd = new FormData(form);
  await handleLogin(fd.get('email'), fd.get('password'), form);
});
