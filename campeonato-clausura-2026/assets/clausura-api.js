(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const config = () => window.CLAUSURA_CONFIG || {};
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const digits = value => String(value || '').replace(/\D/g,'');
  const money = value => new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(Number(value||0));
  const date = value => { const d=new Date(value); return Number.isNaN(d.getTime())?'':d.toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric'}); };
  const dateTime = value => { const d=new Date(value); return Number.isNaN(d.getTime())?'':d.toLocaleString('es-PE',{day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit'}); };
  function toast(message, type='info'){
    let node=$('#clausuraToast');
    if(!node){node=document.createElement('div');node.id='clausuraToast';node.className='toast clausura-toast';document.body.appendChild(node);}
    node.className=`toast clausura-toast show ${type}`;node.textContent=message;setTimeout(()=>node.classList.remove('show'),3500);
  }
  function setBusy(button,busy,label='Procesando…'){
    if(!button)return;
    if(busy){button.dataset.label=button.textContent;button.disabled=true;button.textContent=label;}
    else{button.disabled=false;button.textContent=button.dataset.label||button.textContent;}
  }
  function request(action,payload={}){
    return new Promise((resolve,reject)=>{
      const url=config().API_URL;
      if(!url){reject(new Error('Falta configurar API_URL en campeonato-clausura-2026/assets/clausura-config.js.'));return;}
      const callback='cl26_'+Math.random().toString(36).slice(2);
      const script=document.createElement('script');
      const timer=setTimeout(()=>cleanup(new Error('El servidor tardó demasiado en responder. Revisa la conexión e intenta nuevamente.')),Number(config().REQUEST_TIMEOUT_MS||60000));
      function cleanup(error){clearTimeout(timer);script.remove();try{delete window[callback];}catch(_){window[callback]=undefined;}if(error)reject(error);}
      window[callback]=response=>{cleanup();resolve(response);};
      const params=new URLSearchParams({action,callback,payload:JSON.stringify(payload),_ts:String(Date.now())});
      script.src=`${url}?${params.toString()}`;script.async=true;script.onerror=()=>cleanup(new Error('No se pudo conectar con el sistema del campeonato.'));document.body.appendChild(script);
    });
  }
  async function post(action,payload={}){
    const url=config().API_URL;
    if(!url) throw new Error('Falta configurar API_URL.');
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),Number(config().UPLOAD_TIMEOUT_MS||180000));
    try{
      const response=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,payload}),signal:controller.signal,redirect:'follow'});
      const text=await response.text();
      try{return JSON.parse(text);}catch(_){throw new Error('El servidor respondió con un formato no válido.');}
    }catch(error){
      if(error.name==='AbortError') throw new Error('La carga de documentos tardó demasiado. Reduce el tamaño de los archivos e intenta nuevamente.');
      throw error;
    }finally{clearTimeout(timer);}
  }
  function session(){try{return JSON.parse(localStorage.getItem('cl26_session')||'null');}catch(_){return null;}}
  function setSession(value){localStorage.setItem('cl26_session',JSON.stringify(value));}
  function clearSession(){localStorage.removeItem('cl26_session');}
  function qrUrl(order){
    const statusUrl=new URL('estado.html',location.href);statusUrl.searchParams.set('codigo',order.orderCode||order.registrationId||'');
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(statusUrl.href)}`;
  }
  function orderHtml(order,options={}){
    const categories=(order.categories||[]).map(c=>typeof c==='string'?c:(c.label||c.name||c.categoryId)).join(', ');
    return `<div class="order-success-icon">✓</div><h2>${safe(options.title||'Orden de pago generada')}</h2><p>${safe(options.subtitle||'La inscripción fue registrada y queda pendiente de pago.')}</p>
      <div class="order-deadline">Plazo principal: ${safe(dateTime(order.paymentDeadline))}<br><small>Periodo de gracia hasta ${safe(dateTime(order.graceDeadline))}</small></div>
      <div class="cl-order-code"><div><small>Código de inscripción</small><strong>${safe(order.registrationId)}</strong><small>Código de pago</small><strong>${safe(order.orderCode)}</strong></div><img src="${qrUrl(order)}" alt="QR para consultar la inscripción"></div>
      <div class="order-details"><div class="order-detail-row"><span>Equipo</span><strong>${safe(order.teamName)}</strong></div><div class="order-detail-row"><span>Categorías</span><strong>${safe(categories)}</strong></div><div class="order-detail-row"><span>Total</span><strong>${money(order.amount||order.total)}</strong></div><div class="order-detail-row"><span>Estado</span><strong>${safe(order.statusLabel||order.status||'Pendiente')}</strong></div></div>
      <div class="order-instructions"><strong>Pago en caja municipal</strong><ol><li>Presenta el código <b>${safe(order.orderCode)}</b> en la caja de Pacha Deportes.</li><li>El cajero registrará el pago en la misma plataforma utilizada para campos deportivos y talleres.</li><li>La cuenta se habilitará automáticamente para registrar jugadores y recibirás un correo de confirmación.</li></ol></div>
      <div class="order-actions"><a class="btn btn-secondary" href="estado.html?codigo=${encodeURIComponent(order.orderCode||'')}">Consultar estado</a><a class="btn btn-secondary" href="panel.html">Ir al panel</a></div>`;
  }
  window.Clausura={$, $$, safe, digits, money, date, dateTime, toast, setBusy, request, post, session, setSession, clearSession, orderHtml};
})();
