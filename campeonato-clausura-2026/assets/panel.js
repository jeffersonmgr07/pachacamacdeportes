(() => {
  'use strict';
  const C=window.Clausura;
  const login=C.$('#delegateLogin'), dashboard=C.$('#delegateDashboard'), playerModal=C.$('#playerModal');
  let state={dashboard:null,activeCategory:''};
  function alertAt(selector,type,text){const node=C.$(selector);if(node)node.innerHTML=text?`<div class="form-alert ${type}">${C.safe(text)}</div>`:'';}
  function statusClass(status){const value=String(status||'').toUpperCase();if(value==='ACTIVA')return 'status-active';if(value.includes('INHABIL'))return 'status-disabled';return 'status-pending';}
  function labelCategory(id){const c=(state.dashboard?.categories||[]).find(row=>row.categoryId===id);return c?.label||c?.name||id;}
  function validYear(categoryId,birthDate){const year=new Date(`${birthDate}T12:00:00`).getFullYear();const c=(state.dashboard?.categories||[]).find(row=>row.categoryId===categoryId);return c&&year>=Number(c.minBirthYear)&&year<=Number(c.maxBirthYear);}
  async function loadDashboard(){
    const session=C.session();if(!session?.token){showLogin();return;}
    try{const response=await C.request('getDelegateDashboard',{token:session.token});if(!response?.ok)throw new Error(response?.message||'Sesión no válida.');state.dashboard=response;renderDashboard();}
    catch(error){C.clearSession();showLogin();alertAt('#loginMessage','error',error.message||String(error));}
  }
  function showLogin(){login.style.display='block';dashboard.classList.remove('open');}
  function renderDashboard(){
    const data=state.dashboard, registration=data.registration, order=data.order;
    login.style.display='none';dashboard.classList.add('open');
    C.$('#dashboardTeamName').textContent=registration.teamName;C.$('#dashboardRepresentative').textContent=`${registration.representativeName} · ${registration.registrationId}`;
    C.$('#teamStatus').innerHTML=`<span class="status-pill ${statusClass(registration.status)}">${C.safe(data.statusLabel||registration.status)}</span><p style="color:#65758c">${C.safe(data.statusMessage||'')}</p>`;
    C.$('#teamOrderSummary').innerHTML=`<div class="order-details"><div class="order-detail-row"><span>Código de inscripción</span><strong>${C.safe(registration.registrationId||order.orderCode)}</strong></div><div class="order-detail-row"><span>Total</span><strong>${C.money(order.amount)}</strong></div><div class="order-detail-row"><span>Fecha límite de pago</span><strong>${C.safe(C.dateTime(order.paymentDeadline))}</strong></div></div>`;
    const active=String(registration.status).toUpperCase()==='ACTIVA';
    C.$('#panelLocked').innerHTML=active?'':`<div class="cl-lock"><h3 style="margin-top:0">Registro de jugadores bloqueado</h3><p>Tu cuenta ya existe y puedes consultar la inscripción; sin embargo, la nómina se habilitará cuando el pago sea confirmado.</p><a class="btn btn-primary" href="estado.html?codigo=${encodeURIComponent(registration.registrationId||order.orderCode)}">Ver estado y opciones de pago</a><a class="btn btn-secondary" href="pago-online.html?codigo=${encodeURIComponent(registration.registrationId||order.orderCode)}" style="margin-left:8px;background:#fff;color:#741b14;border-color:#d8b2a7">Pagar online</a></div>`;
    C.$('#activePanel').hidden=!active;if(!active)return;
    const teamCategories=data.categories||[];if(!state.activeCategory||!teamCategories.some(c=>c.categoryId===state.activeCategory))state.activeCategory=teamCategories[0]?.categoryId||'';
    C.$('#categoryTabs').innerHTML=teamCategories.map(c=>`<button class="cl-tab ${c.categoryId===state.activeCategory?'active':''}" type="button" data-category="${C.safe(c.categoryId)}">${C.safe(c.label||c.name)}</button>`).join('');
    C.$$('[data-category]').forEach(button=>button.addEventListener('click',()=>{state.activeCategory=button.dataset.category;renderDashboard();}));
    C.$('#playerCategory').innerHTML=teamCategories.map(c=>`<option value="${C.safe(c.categoryId)}">${C.safe(c.label||c.name)} (${C.safe(c.birthYears)})</option>`).join('');C.$('#playerCategory').value=state.activeCategory;
    renderRoster();
  }
  function renderRoster(){
    const data=state.dashboard, players=data.players||[], categories=data.categories||[];
    C.$('#rosterSummary').innerHTML=categories.map(c=>{const count=players.filter(p=>p.categoryId===c.categoryId&&String(p.status).toUpperCase()!=='ELIMINADO').length;const max=Number(c.maxRoster||12),min=Number(c.minRoster||9),pct=Math.min(100,Math.round(count/max*100));const status=count>=max?'Nómina completa':count>=min?'Mínimo cumplido':`Faltan ${Math.max(0,min-count)} para el mínimo`;return `<article class="cl-roster-card"><strong>${C.safe(c.label||c.name)}</strong><p>${count} de ${max} jugadores</p><div class="cl-progress"><span style="width:${pct}%"></span></div><small>${C.safe(status)}</small></article>`;}).join('');
    const categoryPlayers=players.filter(p=>p.categoryId===state.activeCategory&&String(p.status).toUpperCase()!=='ELIMINADO');
    C.$('#playerList').innerHTML=categoryPlayers.map(p=>`<article class="cl-player"><img src="${C.safe(p.photoUrl||'../assets/img/logo-placeholder.svg')}" alt="Foto de ${C.safe(p.fullName)}"><div><strong>${C.safe(p.fullName)}</strong><small>${C.safe(p.documentType)} ${C.safe(p.documentNumber)} · Nacimiento: ${C.safe(C.date(p.birthDate))}</small><small>${C.safe(labelCategory(p.categoryId))}</small></div><span class="status-pill status-active">Registrado</span></article>`).join('')||'<p style="color:#687990">Aún no hay jugadores registrados en esta categoría.</p>';
    const cat=categories.find(c=>c.categoryId===state.activeCategory);const count=categoryPlayers.length;C.$('#openPlayerForm').disabled=!!cat&&count>=Number(cat.maxRoster||12);
  }
  C.$('#delegateLoginForm')?.addEventListener('submit',async event=>{
    event.preventDefault();alertAt('#loginMessage','','');const button=C.$('#loginSubmit');C.setBusy(button,true,'Ingresando…');
    try{const response=await C.request('delegateLogin',{identity:C.$('#loginIdentity').value.trim(),password:C.$('#loginPassword').value});if(!response?.ok)throw new Error(response?.message||'No se pudo iniciar sesión.');C.setSession(response.session);await loadDashboard();}
    catch(error){alertAt('#loginMessage','error',error.message||String(error));}finally{C.setBusy(button,false);}
  });
  C.$('#logoutButton')?.addEventListener('click',()=>{C.clearSession();location.reload();});
  C.$('#openPlayerForm')?.addEventListener('click',()=>{C.$('#playerForm').reset();C.$('#playerCategory').value=state.activeCategory;alertAt('#playerMessage','','');playerModal.classList.add('open');playerModal.setAttribute('aria-hidden','false');});
  C.$$('[data-close-player]').forEach(button=>button.addEventListener('click',()=>{playerModal.classList.remove('open');playerModal.setAttribute('aria-hidden','true');}));playerModal?.addEventListener('click',event=>{if(event.target===playerModal){playerModal.classList.remove('open');playerModal.setAttribute('aria-hidden','true');}});
  function fileAsData(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name,type:file.type||'application/octet-stream',data:String(reader.result).split(',')[1]||''});reader.onerror=()=>reject(new Error(`No se pudo leer ${file.name}.`));reader.readAsDataURL(file);});}
  function compressedPhoto(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const max=1200,scale=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/jpeg',.78).split(',')[1];resolve({name:file.name.replace(/\.[^.]+$/,'.jpg'),type:'image/jpeg',data});};img.onerror=()=>reject(new Error('La foto seleccionada no es válida.'));img.src=String(reader.result);};reader.onerror=()=>reject(new Error('No se pudo leer la foto.'));reader.readAsDataURL(file);});}
  C.$('#playerForm')?.addEventListener('submit',async event=>{
    event.preventDefault();alertAt('#playerMessage','','');const form=event.currentTarget,raw=Object.fromEntries(new FormData(form).entries()),categoryId=raw.categoryId,birthDate=raw.birthDate;
    if(!validYear(categoryId,birthDate)){const cat=(state.dashboard.categories||[]).find(c=>c.categoryId===categoryId);alertAt('#playerMessage','error',`La fecha de nacimiento no corresponde a ${cat?.label||categoryId}. Años permitidos: ${cat?.birthYears||''}.`);return;}
    const photo=C.$('#playerPhoto').files[0],documentFile=C.$('#playerDocumentFile').files[0],authorizationFile=C.$('#playerAuthorization').files[0];if(!photo||!documentFile||!authorizationFile){alertAt('#playerMessage','error','Adjunta la foto, la copia del documento y la autorización firmada.');return;}
    if(documentFile.size>4*1024*1024||authorizationFile.size>4*1024*1024){alertAt('#playerMessage','error','Cada documento debe pesar como máximo 4 MB.');return;}
    const button=C.$('#playerSubmit');C.setBusy(button,true,'Cargando documentos…');
    try{
      const files=await Promise.all([compressedPhoto(photo),fileAsData(documentFile),fileAsData(authorizationFile)]);
      const response=await C.post('savePlayer',{token:C.session().token,categoryId,firstName:String(raw.firstName||'').trim(),lastName:String(raw.lastName||'').trim(),documentType:raw.documentType,documentNumber:String(raw.documentNumber||'').trim(),birthDate,photo:files[0],documentFile:files[1],authorizationFile:files[2]});
      if(!response?.ok)throw new Error(response?.message||'No se pudo guardar el jugador.');C.toast('Jugador registrado correctamente.','ok');playerModal.classList.remove('open');await loadDashboard();
    }catch(error){alertAt('#playerMessage','error',error.message||String(error));}finally{C.setBusy(button,false);}
  });
  loadDashboard();
})();
