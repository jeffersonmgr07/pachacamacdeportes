(() => {
  'use strict';

  const cfg = window.APP_CONFIG || {};
  const API_URL = cfg.RENTALS_API_URL || '';
  
  const venuesFallback = [
    {venueId:'COLISEO_PACHACAMAC',name:'Coliseo Deportivo Municipal de Pachacámac',type:'Losa deportiva municipal',address:'Jirón Paraíso s/n, Pachacámac',pricingCode:'LOSA',active:true},
    {venueId:'CAMPO_MATAMOROS',name:'Campo Deportivo Matamoros',type:'Campo de grass sintético',address:'Matamoros, Pachacámac',pricingCode:'GRASS',active:true},
    {venueId:'ESTADIO_SECTOR_B_MANCHAY',name:'Estadio Municipal Sector B Manchay',type:'Estadio municipal',address:'Sector B, Manchay, Pachacámac',pricingCode:'ESTADIO',active:true},
    {venueId:'ESTADIO_MUNICIPAL_PACHACAMAC',name:'Estadio Municipal de Pachacámac',type:'Estadio municipal',address:'Pachacámac, Lima',pricingCode:'ESTADIO',active:true}
  ];

  const state = {
    venues: venuesFallback,
    venue: null,
    weekStart: startOfWeek(new Date()),
    bookings: [],
    unavailableDates: new Map(),
    holidays: new Set(),
    selected: new Set(),
    serverNow: new Date()
  };
  const $ = selector => document.querySelector(selector);
  const els = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    Object.assign(els, {
      cards: $('#venueCards'), chooser: $('#venueChooser'), chooserText: $('#venuePickerText'),
      agenda: $('#weeklyAgenda'), weekLabel: $('#weekLabel'), status: $('#calendarStatus'), venueLabel: $('#selectedVenueLabel'),
      prev: $('#prevWeek'), next: $('#nextWeek'), today: $('#todayWeek'), panel: $('#reservationPanel'),
      details: $('#selectionDetails'), total: $('#selectionTotal'), title: $('#selectionTitle'), form: $('#reservationForm'),
      modal: $('#reservationModal'), code: $('#reservationCode'), deadline: $('#reservationDeadline'), qr: $('#reservationQr'),
      message: $('#resultMessage'), print: $('#printReservation'), receiptVenue: $('#receiptVenue'), receiptAddress: $('#receiptAddress'),
      receiptItems: $('#receiptItems'), receiptDuration: $('#receiptDuration'), receiptTotal: $('#receiptTotal'),
      receiptName: $('#receiptName'), receiptDni: $('#receiptDni'), receiptPhone: $('#receiptPhone'), receiptEmail: $('#receiptEmail'),
      availabilityModal: $('#availabilityAlertModal'), availabilityForm: $('#availabilityAlertForm'),
      availabilityFormView: $('#availabilityAlertFormView'), availabilitySuccess: $('#availabilityAlertSuccess'),
      availabilityDateText: $('#availabilityAlertDateText')
    });

    els.prev.addEventListener('click', () => changeWeek(-7));
    els.next.addEventListener('click', () => changeWeek(7));
    els.today.addEventListener('click', () => { state.weekStart = startOfWeek(state.serverNow || new Date()); loadAvailability(); });
    els.form.addEventListener('submit', submitReservation);
    els.print.addEventListener('click', () => window.print());
    document.querySelectorAll('[data-close-result]').forEach(button => button.addEventListener('click', closeModal));
    const syncVenueChooser = () => { if (!els.chooser) return; window.matchMedia('(max-width: 680px)').matches ? els.chooser.removeAttribute('open') : els.chooser.setAttribute('open', ''); };
    syncVenueChooser();
    window.addEventListener('resize', syncVenueChooser);
    if (els.availabilityForm) els.availabilityForm.addEventListener('submit', submitAvailabilityAlert);
    document.querySelectorAll('[data-close-availability-alert]').forEach(button => button.addEventListener('click', closeAvailabilityAlert));
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (els.modal.classList.contains('open')) closeModal();
      if (els.availabilityModal && els.availabilityModal.classList.contains('open')) closeAvailabilityAlert();
    });
    if (els.availabilityModal) els.availabilityModal.addEventListener('click', event => {
      if (event.target === els.availabilityModal) closeAvailabilityAlert();
    });
    loadVenues();
  }

  async function loadVenues() {
    try {
      const res = await api('getVenues', {});
      if (res.ok && Array.isArray(res.venues) && res.venues.length) state.venues = res.venues;
      if (res.serverNow) state.serverNow = new Date(res.serverNow);
    } catch (_) {}
    renderVenues();
    const params = new URLSearchParams(location.search);
    const requestedDate = params.get('date');
    if (/^\d{4}-\d{2}-\d{2}$/.test(requestedDate || '')) {
      state.weekStart = startOfWeek(new Date(requestedDate + 'T12:00:00'));
    }
    const requestedVenue = params.get('venue');
    const first = state.venues.find(venue => truthy(venue.active) && venue.venueId === requestedVenue)
      || state.venues.find(venue => truthy(venue.active));
    if (first) selectVenue(first);
  }

  function renderVenues() {
    els.cards.innerHTML = state.venues.map(venue => `
      <button class="venue-card ${state.venue?.venueId === venue.venueId ? 'active' : ''}" type="button"
        data-venue="${escapeHtml(venue.venueId)}" ${truthy(venue.active) ? '' : 'disabled'}>
        <span class="venue-badge ${truthy(venue.active) ? '' : 'soon'}">${truthy(venue.active) ? 'Disponible' : 'Próximamente'}</span>
        <h3>${escapeHtml(venue.name)}</h3><p>${escapeHtml(venue.type || 'Espacio deportivo municipal')}</p>
      </button>`).join('');
    els.cards.querySelectorAll('[data-venue]:not(:disabled)').forEach(button => {
      button.addEventListener('click', () => selectVenue(state.venues.find(venue => venue.venueId === button.dataset.venue)));
    });
  }

  function selectVenue(venue) {
    if (state.venue && state.venue.venueId !== venue.venueId && state.selected.size && !confirm('Cambiar de espacio eliminará los horarios seleccionados. ¿Continuar?')) return;
    if (state.venue?.venueId !== venue.venueId) state.selected.clear();
    state.venue = venue;
    renderVenues();
    els.venueLabel.textContent = venue.name;
    if (els.chooserText) els.chooserText.textContent = venue.name;
    if (els.chooser && window.matchMedia('(max-width: 680px)').matches) els.chooser.removeAttribute('open');
    updateSummary();
    loadAvailability();
  }

  function changeWeek(days) {
    const date = new Date(state.weekStart); date.setDate(date.getDate() + days); state.weekStart = date;
    loadAvailability();
  }

  async function loadAvailability() {
    if (!state.venue) return;
    updateWeekButton();
    const requestId = `${state.venue.venueId}-${Date.now()}`;
    state.availabilityRequestId = requestId;
    const payload = {
      venueId:state.venue.venueId,
      startDate:dateKey(state.weekStart),
      endDate:dateKey(addDays(state.weekStart,6))
    };
    setCalendarLoading(true);
    try {
      const res = await api('getAvailability', payload);
      if (state.availabilityRequestId !== requestId) return;
      if (!res.ok) throw new Error(res.message || 'No fue posible consultar la agenda.');
      applyAvailability(res);
    } catch (error) {
      if (state.availabilityRequestId !== requestId) return;
      state.bookings = [];
      setCalendarLoading(false, API_URL ? error.message : 'Configura RENTALS_API_URL en assets/js/config.js.');
    }
    renderAgenda();
  }

  function applyAvailability(res) {
    state.bookings = res.bookings || [];
    state.unavailableDates = new Map((res.unavailableDates || []).map(item => [String(item.date), item]));
    state.holidays = new Set(res.holidayDates || []);
    if (res.serverNow) state.serverNow = new Date(res.serverNow);
    setCalendarLoading(false);
  }


  function setCalendarLoading(isLoading, message = '') {
    const shell = els.agenda?.closest('.agenda-shell');
    if (shell) shell.classList.toggle('is-loading', isLoading);
    if (isLoading) {
      els.status.className = 'calendar-status loading-card';
      els.status.innerHTML = '<span class="calendar-spinner" aria-hidden="true"></span><span><strong>Revisando disponibilidad</strong><small>Estamos cargando los horarios del espacio seleccionado.</small></span>';
      els.agenda.setAttribute('aria-busy', 'true');
    } else {
      els.status.className = 'calendar-status' + (message ? ' error-card' : '');
      els.status.textContent = message;
      els.agenda.removeAttribute('aria-busy');
    }
  }

  function renderAgenda() {
    const days = Array.from({length:7}, (_, i) => addDays(state.weekStart, i));
    els.weekLabel.textContent = `Del ${fmtDate(days[0])} al ${fmtDate(days[6])}`;
    updateWeekButton();

    const parts = [];
    parts.push('<div class="agenda-cell agenda-header agenda-corner" style="grid-column:1;grid-row:1"></div>');
    days.forEach((day, dayIndex) => {
      const key = dateKey(day);
      const hasAvailabilityHold = state.bookings.some(block =>
        (String(block.status || '').toUpperCase() === 'NO_DISPONIBLE' || truthy(block.availabilityHold)) &&
        dateKey(new Date(block.startDateTime)) === key
      );
      parts.push(`
        <div class="agenda-cell agenda-header ${key === dateKey(state.serverNow) ? 'today' : ''} ${hasAvailabilityHold ? 'unavailable-day' : ''}"
             style="grid-column:${dayIndex + 2};grid-row:1">
          <strong>${day.toLocaleDateString('es-PE',{weekday:'short'}).replace('.','')}</strong>
          <span>${day.toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit'})}</span>
        </div>`);
    });

    for (let hour=8; hour<23; hour++) {
      parts.push(`<div class="agenda-cell agenda-time" style="grid-column:1;grid-row:${hour - 6}">${hourLabel(hour)}</div>`);
    }

    days.forEach((day, dayIndex) => {
      const dayBlocks = consolidatedBookingsForDay(day);
      const covered = new Set();

      dayBlocks.forEach(block => {
        for (let hour=block.startHour; hour<block.endHour; hour++) covered.add(hour);
        const view = bookingPresentation(block);
        const span = Math.max(1, block.endHour - block.startHour);
        const availabilityDate = String(block.availabilityDate || dateKey(day));
        const compactAvailability = !!view.waitlist && span <= 2;
        const mediumAvailability = !!view.waitlist && span === 3;
        const blockClass = [
          view.cls,
          compactAvailability ? 'availability-compact' : '',
          mediumAvailability ? 'availability-medium' : ''
        ].filter(Boolean).join(' ');

        parts.push(`
          <button class="calendar-booking-block ${blockClass}" type="button"
                  ${view.waitlist ? `data-waitlist-date="${escapeHtml(availabilityDate)}"` : 'disabled'}
                  style="grid-column:${dayIndex + 2};grid-row:${block.startHour - 6} / span ${span}"
                  aria-label="${escapeHtml(view.aria)}">
            <span class="booking-status">${escapeHtml(compactAvailability ? 'No disponible' : view.title)}</span>
            ${!compactAvailability && view.name ? `<strong>${escapeHtml(view.name)}</strong>` : ''}
            ${!compactAvailability && view.reason ? `<strong>${escapeHtml(view.reason)}</strong>` : ''}
            ${!compactAvailability ? `<small>${hourLabel(block.startHour)} a ${hourLabel(block.endHour)}</small>` : ''}
            ${view.waitlist ? `<span class="booking-waitlist-cta">${compactAvailability ? 'Avisarme' : 'Avisarme cuando esté disponible'}</span>` : ''}
          </button>`);
      });

      for (let hour=8; hour<23; hour++) {
        if (covered.has(hour)) continue;
        const key = `${dateKey(day)}|${hour}`;
        const info = slotInfo(day,hour,key);
        parts.push(`
          <button class="slot-button ${info.cls}" type="button" data-slot="${key}"
                  style="grid-column:${dayIndex + 2};grid-row:${hour - 6}"
                  ${info.disabled?'disabled':''}>
            ${info.label}${info.sub?`<small>${info.sub}</small>`:''}
          </button>`);
      }
    });

    els.agenda.innerHTML = parts.join('');
    els.agenda.querySelectorAll('[data-slot]:not(:disabled)').forEach(button =>
      button.addEventListener('click', () => toggleSlot(button.dataset.slot))
    );
    els.agenda.querySelectorAll('[data-waitlist-date]').forEach(button =>
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openAvailabilityAlert(button.dataset.waitlistDate);
      })
    );
  }

  function consolidatedBookingsForDay(day) {
    const dayStart = new Date(`${dateKey(day)}T00:00:00`);
    const dayEnd = new Date(`${dateKey(day)}T23:59:59`);
    const normalized = state.bookings
      .filter(item => new Date(item.startDateTime) < dayEnd && new Date(item.endDateTime) > dayStart)
      .map(item => {
        const start = new Date(item.startDateTime);
        const end = new Date(item.endDateTime);
        return {
          ...item,
          startHour: Math.max(8, start.getHours()),
          endHour: Math.min(23, end.getHours() + (end.getMinutes() > 0 ? 1 : 0))
        };
      })
      .filter(item => item.endHour > item.startHour)
      .sort((a,b) => a.startHour - b.startHour);

    const groups = [];
    normalized.forEach(item => {
      const last = groups[groups.length - 1];
      const sameReservation = last &&
        String(last.status || '').toUpperCase() === String(item.status || '').toUpperCase() &&
        String(last.reservationCode || last.blockId || '') === String(item.reservationCode || item.blockId || '') &&
        last.endHour === item.startHour;

      if (sameReservation) {
        last.endHour = item.endHour;
      } else {
        groups.push({...item});
      }
    });
    return groups;
  }

  function bookingPresentation(block) {
    const status = String(block.status || '').toUpperCase();
    const time = `${hourLabel(block.startHour)} a ${hourLabel(block.endHour)}`;

    if (status === 'NO_DISPONIBLE' || truthy(block.availabilityHold)) {
      return {
        cls:'availability-hold',
        title:'Horario no disponible',
        reason:'Posibles usos de la Municipalidad',
        name:'',
        waitlist:true,
        aria:`Horario no disponible por posibles usos de la Municipalidad, de ${time}. Puedes registrarte para recibir un aviso si la fecha se libera.`
      };
    }

    if (status === 'EVENTO' || status === 'BLOQUEADO') {
      const reason = String(block.reason || 'Reserva administrativa').trim();
      const municipal = truthy(block.isMunicipalEvent);
      return {
        cls: 'municipal-event',
        title: municipal ? 'Evento municipal' : 'Reservado para',
        reason,
        name: '',
        aria: municipal ? `Evento municipal: ${reason}, de ${time}` : `Reservado para ${reason}, de ${time}`
      };
    }

    if (status === 'PAGADO') {
      const renterName = String(block.renterName || 'Reserva confirmada').trim();
      return {
        cls: 'confirmed-rental',
        title: 'Ocupado',
        name: `Alquilado por ${renterName}`,
        reason: '',
        aria: `Ocupado, alquilado por ${renterName}, de ${time}`
      };
    }

    return {
      cls: 'pending-rental',
      title: 'Pago pendiente',
      name: '',
      reason: '',
      aria: `Horario con pago pendiente, de ${time}`
    };
  }

  function updateWeekButton() {
    const number = isoWeekNumber(state.weekStart);
    els.today.textContent = `Semana ${number}`;
    els.today.setAttribute('aria-label', `Semana ${number}. Volver a la semana actual`);
  }

  function slotInfo(day,hour,key) {
    const start = new Date(`${dateKey(day)}T${String(hour).padStart(2,'0')}:00:00`);
    const end = new Date(start.getTime()+3600000);
    const now = state.serverNow;
    const isCurrentHour = start <= now && end > now;

    if (end <= now || isCurrentHour) {
      return {
        cls:`past ${isCurrentHour?'now':''}`,
        label:isCurrentHour?'Ahora':'No disponible',
        sub:isCurrentHour?'Hora actual':'',
        disabled:true
      };
    }
    if (state.selected.has(key)) return {cls:'selected',label:'Seleccionado',sub:`S/ ${priceFor(hour,day)}`,disabled:false};
    return {cls:'available',label:'Disponible',sub:`S/ ${priceFor(hour,day)}`,disabled:false};
  }

  function toggleSlot(key) {
    state.selected.has(key) ? state.selected.delete(key) : state.selected.add(key);
    renderAgenda(); updateSummary();
  }

  function selectedSlots() {
    return [...state.selected].map(key => { const [date,hour] = key.split('|'); return {date,hour:Number(hour),start:new Date(`${date}T${hour.padStart(2,'0')}:00:00`)}; }).sort((a,b)=>a.start-b.start);
  }

  function groupSlots(slots) {
    const groups = [];
    slots.forEach(slot => {
      const last = groups[groups.length-1];
      if (last && last.date === slot.date && last.endHour === slot.hour) {
        last.endHour = slot.hour + 1; last.hours++; last.subtotal += priceFor(slot.hour,slot.start);
      } else {
        groups.push({date:slot.date,startHour:slot.hour,endHour:slot.hour+1,hours:1,subtotal:priceFor(slot.hour,slot.start)});
      }
    });
    return groups;
  }

  function updateSummary() {
    const slots = selectedSlots();
    els.panel.hidden = !slots.length;
    if (!slots.length) return;
    const groups = groupSlots(slots);
    const total = groups.reduce((sum,g)=>sum+g.subtotal,0);
    els.title.textContent = state.venue?.name || 'Reserva';
    const multiple = groups.length > 1;
    els.details.innerHTML = `<div class="selection-block-list">${groups.map((g,i)=>`
      <div class="selection-block">
        <div><span>${multiple ? `Horario ${i+1}` : 'Horario'}</span><strong>${hourLabel(g.startHour)} a ${hourLabel(g.endHour)}</strong><small>${formatFullDate(g.date)}</small></div>
        <div class="selection-block-price"><strong>S/ ${g.subtotal.toFixed(2)}</strong><small>${g.hours} ${g.hours===1?'hora':'horas'}</small></div>
      </div>`).join('')}</div>`;
    els.total.textContent = `S/ ${total.toFixed(2)}`;
  }


  function openAvailabilityAlert(date) {
    if (!els.availabilityModal || !state.venue) return;
    state.availabilityAlertDate = String(date || '');
    const dateText = formatFullDate(state.availabilityAlertDate);
    els.availabilityDateText.textContent = `${state.venue.name} · ${dateText}`;
    els.availabilityForm.reset();
    els.availabilityForm.hidden = false;
    els.availabilityFormView.hidden = false;
    els.availabilitySuccess.hidden = true;
    els.availabilityModal.classList.add('open');
    els.availabilityModal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    setTimeout(() => els.availabilityForm.querySelector('input[name="name"]')?.focus(), 50);
  }

  function closeAvailabilityAlert() {
    if (!els.availabilityModal) return;
    els.availabilityModal.classList.remove('open');
    els.availabilityModal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }

  async function submitAvailabilityAlert(event) {
    event.preventDefault();
    if (!els.availabilityForm.reportValidity() || !state.venue || !state.availabilityAlertDate) return;
    const button = els.availabilityForm.querySelector('button[type="submit"]');
    const formData = new FormData(els.availabilityForm);
    button.disabled = true;
    button.textContent = 'Registrando…';
    try {
      const res = await api('createAvailabilityAlert', {
        venueId:state.venue.venueId,
        date:state.availabilityAlertDate,
        name:String(formData.get('name') || '').trim(),
        email:String(formData.get('email') || '').trim(),
        phone:String(formData.get('phone') || '').trim(),
        website:String(formData.get('website') || '').trim(),
        source:location.pathname
      });
      if (!res.ok) throw new Error(res.message || 'No fue posible registrar el aviso.');
      els.availabilityFormView.hidden = true;
      els.availabilitySuccess.hidden = false;
    } catch (error) {
      alert(error.message || error);
      if (String(error.message || '').includes('ya no figura')) await loadAvailability();
    } finally {
      button.disabled = false;
      button.textContent = 'Registrarme';
    }
  }

  async function submitReservation(event) {
    event.preventDefault();
    const slots = selectedSlots();
    if (!slots.length) return alert('Selecciona al menos una hora.');
    if (!API_URL) return alert('Primero debes configurar RENTALS_API_URL.');
    if (!els.form.reportValidity()) return;
    const formData = new FormData(els.form);
    const applicant = {firstName:String(formData.get('firstName')||'').trim(),lastName:String(formData.get('lastName')||'').trim(),dni:String(formData.get('dni')||'').trim(),email:String(formData.get('email')||'').trim(),phone:String(formData.get('phone')||'').trim()};
    const groups = groupSlots(slots);
    const button = els.form.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = 'Generando solicitud…';
    try {
      const payload = {venueId:state.venue.venueId,items:groups.map(g=>({startDateTime:`${g.date}T${String(g.startHour).padStart(2,'0')}:00:00`,endDateTime:`${g.date}T${String(g.endHour).padStart(2,'0')}:00:00` })),...applicant};
      const res = await api('createReservation', payload);
      if (!res.ok) throw new Error(res.message || 'No se pudo crear la reserva.');
      showResult(res, applicant);
      state.selected.clear(); els.form.reset(); updateSummary(); await loadAvailability();
    } catch (error) { alert(error.message); }
    finally { button.disabled=false; button.textContent='Solicitar reserva'; }
  }

  function showResult(res, applicant) {
    const items = res.items || [];
    const totalHours = items.reduce((s,i)=>s+Number(i.hours||0),0);
    const address = state.venue?.address || 'Pachacámac, Lima';
    els.code.textContent = res.reservationCode;
    els.message.textContent = res.requiresAdminCoordination
      ? 'La caja municipal está cerrada. El horario quedó bloqueado temporalmente mientras coordinas el pago con el administrador.'
      : 'Los horarios se encuentran bloqueados temporalmente mientras realizas el pago.';
    els.deadline.innerHTML = `<strong>Tiempo límite de pago</strong><span>${formatSpanishDeadline(new Date(res.paymentDeadline))}</span>${res.requiresAdminCoordination ? `<em class="coordination-note">${escapeHtml(res.paymentNotice || 'Coordina de inmediato con el administrador para concretar la reserva.')}</em>` : ''}`;
    els.receiptVenue.textContent = res.venueName;
    els.receiptAddress.textContent = address;
    const multipleItems = items.length > 1;
    els.receiptItems.innerHTML = items.map((item,i)=>{
      const start=new Date(item.startDateTime), end=new Date(item.endDateTime);
      return `<div class="receipt-item-row">
        <span>${multipleItems ? `Horario ${i+1}` : 'Horario'}</span>
        <div>
          <strong class="receipt-item-time">${formatTime(start)} a ${formatTime(end)}</strong>
          <small class="receipt-item-date">${start.toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</small>
          <small class="receipt-item-meta">${Number(item.hours)} ${Number(item.hours)===1?'hora':'horas'} · S/ ${Number(item.subtotal).toFixed(2)}</small>
        </div>
      </div>`;
    }).join('');
    els.receiptDuration.textContent = `${totalHours} ${totalHours===1?'hora':'horas'}`;
    els.receiptTotal.textContent = `S/ ${Number(res.total).toFixed(2)}`;
    els.receiptName.textContent = `${applicant.firstName} ${applicant.lastName}`;
    els.receiptDni.textContent = applicant.dni; els.receiptPhone.textContent = applicant.phone; els.receiptEmail.textContent = applicant.email;
    const qrText = JSON.stringify({codigo:res.reservationCode,campo:res.venueName,items:items.map(i=>({inicio:i.startDateTime,fin:i.endDateTime,subtotal:i.subtotal})),total:res.total,dni:applicant.dni});
    const qrData = encodeURIComponent(qrText);
    els.qr.dataset.fallbackUsed='false';
    els.qr.onerror=()=>{ if(els.qr.dataset.fallbackUsed==='true')return; els.qr.dataset.fallbackUsed='true'; els.qr.src=`https://quickchart.io/qr?size=300&margin=1&text=${qrData}`; };
    els.qr.src=`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${qrData}`;
    els.modal.classList.add('open'); els.modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; setTimeout(()=>els.print.focus(),50);
  }

  function closeModal(){els.modal.classList.remove('open');els.modal.setAttribute('aria-hidden','true');document.body.style.overflow='';}
  function api(action,payload){return new Promise((resolve,reject)=>{const callback=`rentalCb_${Math.random().toString(36).slice(2)}`;const script=document.createElement('script');const timer=setTimeout(()=>finish(new Error('La solicitud está tardando más de lo normal. Antes de volver a intentarlo, revisa tu correo para confirmar si la reserva fue generada.')),90000);function finish(error,data){clearTimeout(timer);delete window[callback];script.remove();error?reject(error):resolve(data);}window[callback]=data=>finish(null,data);script.onerror=()=>finish(new Error('No se pudo conectar con el sistema de reservas.'));script.src=`${API_URL}?${new URLSearchParams({action,callback,payload:JSON.stringify(payload)})}`;document.body.appendChild(script);});}
  function startOfWeek(date){const v=new Date(date);v.setHours(0,0,0,0);v.setDate(v.getDate()-((v.getDay()+6)%7));return v;}
  function addDays(date,days){const v=new Date(date);v.setDate(v.getDate()+days);return v;}
  function dateKey(date){const v=new Date(date);return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`;}
  function fmtDate(date){return date.toLocaleDateString('es-PE',{day:'numeric',month:'long'});}
  function formatFullDate(date){return new Date(`${date}T12:00:00`).toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long',year:'numeric'});}
  function formatTime(date){return date.toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit',hour12:true});}
  function formatSpanishDeadline(date){return `${date.toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}, hasta las ${formatTime(date)}`;}
  function hourLabel(hour){const value=hour%12||12;return `${value}:00 ${hour<12?'a. m.':'p. m.'}`;}
  function priceFor(hour,date){
    const venueCode = String(state.venue?.pricingCode || 'LOSA').toUpperCase();
    const d = date instanceof Date ? date : new Date(date || Date.now());
    const weekend = d.getDay() === 0 || d.getDay() === 6 || state.holidays.has(dateKey(d));
    const night = hour >= 18;
    if (venueCode === 'GRASS') return weekend ? (night ? 50 : 40) : (night ? 40 : 30);
    if (venueCode === 'ESTADIO') return weekend ? (night ? 160 : 150) : (night ? 160 : 120);
    return weekend && night ? 25 : 20;
  }
  function truthy(value){return value===true||String(value).toLowerCase()==='true'||value===1;}
  function isoWeekNumber(date){const v=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));const day=v.getUTCDay()||7;v.setUTCDate(v.getUTCDate()+4-day);const ys=new Date(Date.UTC(v.getUTCFullYear(),0,1));return Math.ceil((((v-ys)/86400000)+1)/7);}
  function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
})();
