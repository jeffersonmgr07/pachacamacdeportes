(() => {
  'use strict';
  const cfg = window.APP_CONFIG || {};
  const API_URL = cfg.RENTALS_API_URL || '';
  const venuesFallback = [
    {venueId:'COLISEO_PACHACAMAC',name:'Coliseo Deportivo Pachacámac',type:'Coliseo deportivo',active:true},
    {venueId:'ESTADIO_MUNICIPAL_PACHACAMAC',name:'Estadio Municipal de Pachacámac',type:'Estadio',active:false},
    {venueId:'CAMPO_MATAMOROS',name:'Campo Deportivo Matamoros',type:'Grass sintético',active:false},
    {venueId:'ESTADIO_SECTOR_B_MANCHAY',name:'Estadio Municipal Sector B Manchay',type:'Estadio',active:false}
  ];
  const state = { venues:venuesFallback, venue:null, weekStart:startOfWeek(new Date()), bookings:[], selected:new Set(), serverNow:new Date() };
  const $ = s => document.querySelector(s);
  const els = {};

  document.addEventListener('DOMContentLoaded', init);

  function init(){
    Object.assign(els, {
      cards:$('#venueCards'), agenda:$('#weeklyAgenda'), weekLabel:$('#weekLabel'), status:$('#calendarStatus'), venueLabel:$('#selectedVenueLabel'),
      prev:$('#prevWeek'), next:$('#nextWeek'), today:$('#todayWeek'), panel:$('#reservationPanel'), details:$('#selectionDetails'), total:$('#selectionTotal'),
      title:$('#selectionTitle'), form:$('#reservationForm'), modal:$('#reservationModal'), code:$('#reservationCode'), deadline:$('#reservationDeadline'), qr:$('#reservationQr'), message:$('#resultMessage')
    });
    els.prev.addEventListener('click',()=>changeWeek(-7)); els.next.addEventListener('click',()=>changeWeek(7)); els.today.addEventListener('click',()=>{state.weekStart=startOfWeek(new Date()); loadAvailability();});
    els.form.addEventListener('submit',submitReservation); document.querySelectorAll('[data-close-result]').forEach(b=>b.addEventListener('click',closeModal));
    loadVenues();
  }

  async function loadVenues(){
    try{
      const res = await api('getVenues',{},true);
      if(res.ok && Array.isArray(res.venues) && res.venues.length) state.venues=res.venues;
      if(res.serverNow) state.serverNow=new Date(res.serverNow);
    }catch(e){ /* fallback visual */ }
    renderVenues();
    const first=state.venues.find(v=>truthy(v.active)); if(first) selectVenue(first);
  }
  function renderVenues(){
    els.cards.innerHTML=state.venues.map(v=>`<button class="venue-card ${state.venue?.venueId===v.venueId?'active':''}" type="button" data-venue="${escapeHtml(v.venueId)}" ${truthy(v.active)?'':'disabled'}><span class="venue-badge ${truthy(v.active)?'':'soon'}">${truthy(v.active)?'Disponible':'Próximamente'}</span><h3>${escapeHtml(v.name)}</h3><p>${escapeHtml(v.type||'Espacio deportivo municipal')}</p></button>`).join('');
    els.cards.querySelectorAll('[data-venue]:not(:disabled)').forEach(b=>b.addEventListener('click',()=>selectVenue(state.venues.find(v=>v.venueId===b.dataset.venue))));
  }
  function selectVenue(v){ state.venue=v; state.selected.clear(); renderVenues(); els.venueLabel.textContent=v.name; updateSummary(); loadAvailability(); }
  function changeWeek(days){ const d=new Date(state.weekStart); d.setDate(d.getDate()+days); state.weekStart=d; state.selected.clear(); updateSummary(); loadAvailability(); }

  async function loadAvailability(){
    if(!state.venue) return; els.status.textContent='Consultando disponibilidad…';
    const start=dateKey(state.weekStart), end=dateKey(addDays(state.weekStart,6));
    try{
      const res=await api('getAvailability',{venueId:state.venue.venueId,startDate:start,endDate:end},true);
      if(!res.ok) throw new Error(res.message||'No fue posible consultar la agenda.');
      state.bookings=res.bookings||[]; if(res.serverNow) state.serverNow=new Date(res.serverNow); els.status.textContent='';
    }catch(e){ state.bookings=[]; els.status.textContent=API_URL?e.message:'Configura RENTALS_API_URL en assets/js/config.js para conectar la agenda con Google Sheets.'; }
    renderAgenda();
  }

  function renderAgenda(){
    const days=Array.from({length:7},(_,i)=>addDays(state.weekStart,i));
    els.weekLabel.textContent=`Semana del ${fmtDate(days[0])} al ${fmtDate(days[6])}`;
    let html='<div class="agenda-cell agenda-header"></div>'+days.map(d=>`<div class="agenda-cell agenda-header ${dateKey(d)===dateKey(state.serverNow)?'today':''}"><strong>${d.toLocaleDateString('es-PE',{weekday:'short'}).replace('.','')}</strong><span>${d.toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit'})}</span></div>`).join('');
    for(let hour=8;hour<23;hour++){
      html+=`<div class="agenda-cell agenda-time">${hourLabel(hour)}</div>`;
      for(const day of days){ const key=`${dateKey(day)}|${hour}`; const info=slotInfo(day,hour,key); html+=`<div class="agenda-cell"><button class="slot-button ${info.cls}" type="button" data-slot="${key}" ${info.disabled?'disabled':''}>${info.label}${info.sub?`<small>${info.sub}</small>`:''}</button></div>`; }
    }
    els.agenda.innerHTML=html;
    els.agenda.querySelectorAll('[data-slot]:not(:disabled)').forEach(btn=>btn.addEventListener('click',()=>toggleSlot(btn.dataset.slot)));
  }
  function slotInfo(day,hour,key){
    const start=new Date(`${dateKey(day)}T${String(hour).padStart(2,'0')}:00:00`); const end=new Date(start.getTime()+3600000); const now=state.serverNow;
    const booking=state.bookings.find(b=>dateKey(new Date(b.startDateTime))===dateKey(day) && new Date(b.startDateTime)<end && new Date(b.endDateTime)>start);
    if(start<now) return {cls:'past',label:'No disponible',disabled:true};
    if(booking){ const paid=String(booking.status).toUpperCase()==='PAGADO'; return {cls:paid?'occupied':'pending',label:paid?'Ocupado':'En proceso',sub:paid?'Reservado':'Pago pendiente',disabled:true}; }
    if(state.selected.has(key)) return {cls:'selected',label:'Seleccionado',sub:`S/ ${priceFor(hour)}`,disabled:false};
    const isNow=start<=now&&end>now; return {cls:`available ${isNow?'now':''}`,label:'Disponible',sub:`S/ ${priceFor(hour)}`,disabled:false};
  }
  function toggleSlot(key){ state.selected.has(key)?state.selected.delete(key):state.selected.add(key); renderAgenda(); updateSummary(); }
  function selectedSlots(){ return [...state.selected].map(k=>{const [d,h]=k.split('|');return {date:d,hour:Number(h),start:new Date(`${d}T${h.padStart(2,'0')}:00:00`)}}).sort((a,b)=>a.start-b.start); }
  function validateSelection(slots){ if(!slots.length) return 'Selecciona al menos una hora.'; const date=slots[0].date; if(slots.some(s=>s.date!==date)) return 'Todas las horas deben corresponder al mismo día.'; for(let i=1;i<slots.length;i++) if(slots[i].hour!==slots[i-1].hour+1) return 'Selecciona horas consecutivas para una misma reserva.'; return ''; }
  function updateSummary(){
    const slots=selectedSlots(), error=validateSelection(slots); els.panel.hidden=!slots.length;
    if(!slots.length) return; const total=slots.reduce((s,x)=>s+priceFor(x.hour),0); const first=slots[0], last=slots[slots.length-1];
    els.title.textContent=state.venue?.name||'Reserva'; els.details.innerHTML=`<p><strong>Fecha:</strong> ${new Date(first.date+'T12:00:00').toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p><p><strong>Horario:</strong> ${hourLabel(first.hour)} a ${hourLabel(last.hour+1)} (${slots.length} ${slots.length===1?'hora':'horas'})</p>${error?`<p style="color:#f8c449"><strong>${escapeHtml(error)}</strong></p>`:''}`; els.total.textContent=`S/ ${total.toFixed(2)}`;
  }

  async function submitReservation(ev){
    ev.preventDefault(); const slots=selectedSlots(), selectionError=validateSelection(slots); if(selectionError){alert(selectionError);return;} if(!API_URL){alert('Primero debes configurar RENTALS_API_URL en assets/js/config.js.');return;}
    if(!els.form.reportValidity()) return;
    const fd=new FormData(els.form), first=slots[0], last=slots[slots.length-1]; const btn=els.form.querySelector('button[type="submit"]'); btn.disabled=true; btn.textContent='Generando solicitud…';
    try{
      const payload={venueId:state.venue.venueId,startDateTime:`${first.date}T${String(first.hour).padStart(2,'0')}:00:00`,endDateTime:`${last.date}T${String(last.hour+1).padStart(2,'0')}:00:00`,firstName:fd.get('firstName'),lastName:fd.get('lastName'),dni:fd.get('dni'),email:fd.get('email'),phone:fd.get('phone')};
      const res=await api('createReservation',payload,false); if(!res.ok) throw new Error(res.message||'No se pudo crear la reserva.'); showResult(res); state.selected.clear(); els.form.reset(); updateSummary(); await loadAvailability();
    }catch(e){alert(e.message);}finally{btn.disabled=false;btn.textContent='Solicitar reserva';}
  }
  function showResult(res){ els.code.textContent=res.reservationCode; els.message.textContent=`Tu horario está bloqueado temporalmente para ${res.venueName}.`; els.deadline.textContent=`Paga hasta: ${new Date(res.paymentDeadline).toLocaleString('es-PE',{dateStyle:'full',timeStyle:'short'})}. La caja dispone de 10 minutos adicionales de gracia para registrar un pago recibido a tiempo.`; const qrText=`PACHA DEPORTES|${res.reservationCode}|${res.venueName}|${res.startDateTime}|S/${Number(res.total).toFixed(2)}`; els.qr.src=`https://quickchart.io/qr?size=260&text=${encodeURIComponent(qrText)}`; els.modal.classList.add('open');els.modal.setAttribute('aria-hidden','false'); }
  function closeModal(){els.modal.classList.remove('open');els.modal.setAttribute('aria-hidden','true');}

  function api(action,payload,quiet){
    return new Promise((resolve,reject)=>{ const cb='rentalCb_'+Math.random().toString(36).slice(2); const script=document.createElement('script'); const timer=setTimeout(()=>done(new Error('El servidor de reservas no respondió.')),20000); function done(err,data){clearTimeout(timer);delete window[cb];script.remove();err?reject(err):resolve(data);} window[cb]=data=>done(null,data); script.onerror=()=>done(new Error('No se pudo conectar con el sistema de reservas.')); const params=new URLSearchParams({action,callback:cb,payload:JSON.stringify(payload)}); script.src=`${API_URL}?${params}`; document.body.appendChild(script); });
  }
  function startOfWeek(d){const x=new Date(d);x.setHours(0,0,0,0);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x;} function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;} function dateKey(d){const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;} function fmtDate(d){return d.toLocaleDateString('es-PE',{day:'numeric',month:'long'});} function hourLabel(h){const hh=h%12||12;return `${hh}:00 ${h<12?'a. m.':'p. m.'}`;} function priceFor(h){return h<18?20:30;} function truthy(v){return v===true||String(v).toLowerCase()==='true'||v===1;} function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
})();
