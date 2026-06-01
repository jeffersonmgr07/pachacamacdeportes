document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  if(!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    try{
      btn.disabled = true; btn.textContent = 'Enviando...';
      const res = await API.registerCoachRequest(payload);
      if(!res?.ok){ toast(res?.message || 'No se pudo enviar la solicitud.'); return; }
      form.reset();
      toast('Solicitud enviada. Te contactaremos pronto.');
    }catch(err){
      console.error(err);
      toast(err?.message || 'No se pudo conectar con el servidor.');
    }finally{
      btn.disabled = false; btn.textContent = original;
    }
  });
});
