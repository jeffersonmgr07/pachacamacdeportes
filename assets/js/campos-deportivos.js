(() => {
  'use strict';

  const cfg = window.APP_CONFIG || {};
  const API_URL = cfg.RENTALS_API_URL || '';
  const VENUE_ADDRESSES = {
    COLISEO_PACHACAMAC: 'Jirón Paraíso s/n, Pachacámac'
  };
  const venuesFallback = [
    {venueId:'COLISEO_PACHACAMAC',name:'Coliseo Deportivo Pachacámac',type:'Coliseo deportivo',active:true},
    {venueId:'ESTADIO_MUNICIPAL_PACHACAMAC',name:'Estadio Municipal de Pachacámac',type:'Estadio',active:false},
    {venueId:'CAMPO_MATAMOROS',name:'Campo Deportivo Matamoros',type:'Grass sintético',active:false},
    {venueId:'ESTADIO_SECTOR_B_MANCHAY',name:'Estadio Municipal Sector B Manchay',type:'Estadio',active:false}
  ];

  const state = {
    venues: venuesFallback,
    venue: null,
    weekStart: startOfWeek(new Date()),
    bookings: [],
    selected: new Set(),
    serverNow: new Date()
  };
  const $ = selector => document.querySelector(selector);
  const els = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    Object.assign(els, {
      cards: $('#venueCards'),
      agenda: $('#weeklyAgenda'),
      weekLabel: $('#weekLabel'),
      status: $('#calendarStatus'),
      venueLabel: $('#selectedVenueLabel'),
      prev: $('#prevWeek'),
      next: $('#nextWeek'),
      today: $('#todayWeek'),
      panel: $('#reservationPanel'),
      details: $('#selectionDetails'),
      total: $('#selectionTotal'),
      title: $('#selectionTitle'),
      form: $('#reservationForm'),
      modal: $('#reservationModal'),
      code: $('#reservationCode'),
      deadline: $('#reservationDeadline'),
      qr: $('#reservationQr'),
      message: $('#resultMessage'),
      print: $('#printReservation'),
      receiptVenue: $('#receiptVenue'),
      receiptAddress: $('#receiptAddress'),
      receiptDate: $('#receiptDate'),
      receiptTime: $('#receiptTime'),
      receiptDuration: $('#receiptDuration'),
      receiptTotal: $('#receiptTotal'),
      receiptName: $('#receiptName'),
      receiptDni: $('#receiptDni'),
      receiptPhone: $('#receiptPhone'),
      receiptEmail: $('#receiptEmail')
    });

    els.prev.addEventListener('click', () => changeWeek(-7));
    els.next.addEventListener('click', () => changeWeek(7));
    els.today.addEventListener('click', () => {
      state.weekStart = startOfWeek(state.serverNow || new Date());
      state.selected.clear();
      updateSummary();
      loadAvailability();
    });
    els.form.addEventListener('submit', submitReservation);
    els.print.addEventListener('click', () => window.print());
    document.querySelectorAll('[data-close-result]').forEach(button => button.addEventListener('click', closeModal));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && els.modal.classList.contains('open')) closeModal();
    });

    loadVenues();
  }

  async function loadVenues() {
    try {
      const res = await api('getVenues', {}, true);
      if (res.ok && Array.isArray(res.venues) && res.venues.length) state.venues = res.venues;
      if (res.serverNow) state.serverNow = new Date(res.serverNow);
    } catch (error) {
      // Se conserva la información visual de respaldo.
    }
    renderVenues();
    const first = state.venues.find(venue => truthy(venue.active));
    if (first) selectVenue(first);
  }

  function renderVenues() {
    els.cards.innerHTML = state.venues.map(venue => `
      <button class="venue-card ${state.venue?.venueId === venue.venueId ? 'active' : ''}" type="button"
        data-venue="${escapeHtml(venue.venueId)}" ${truthy(venue.active) ? '' : 'disabled'}>
        <span class="venue-badge ${truthy(venue.active) ? '' : 'soon'}">${truthy(venue.active) ? 'Disponible' : 'Próximamente'}</span>
        <h3>${escapeHtml(venue.name)}</h3>
        <p>${escapeHtml(venue.type || 'Espacio deportivo municipal')}</p>
      </button>`).join('');

    els.cards.querySelectorAll('[data-venue]:not(:disabled)').forEach(button => {
      button.addEventListener('click', () => selectVenue(state.venues.find(venue => venue.venueId === button.dataset.venue)));
    });
  }

  function selectVenue(venue) {
    state.venue = venue;
    state.selected.clear();
    renderVenues();
    els.venueLabel.textContent = venue.name;
    updateSummary();
    loadAvailability();
  }

  function changeWeek(days) {
    const date = new Date(state.weekStart);
    date.setDate(date.getDate() + days);
    state.weekStart = date;
    state.selected.clear();
    updateSummary();
    loadAvailability();
  }

  async function loadAvailability() {
    if (!state.venue) return;
    updateWeekButton();
    els.status.textContent = 'Consultando disponibilidad…';
    const start = dateKey(state.weekStart);
    const end = dateKey(addDays(state.weekStart, 6));

    try {
      const res = await api('getAvailability', {venueId: state.venue.venueId, startDate: start, endDate: end}, true);
      if (!res.ok) throw new Error(res.message || 'No fue posible consultar la agenda.');
      state.bookings = res.bookings || [];
      if (res.serverNow) state.serverNow = new Date(res.serverNow);
      els.status.textContent = '';
    } catch (error) {
      state.bookings = [];
      els.status.textContent = API_URL ? error.message : 'Configura RENTALS_API_URL en assets/js/config.js para conectar la agenda con Google Sheets.';
    }
    renderAgenda();
  }

  function renderAgenda() {
    const days = Array.from({length: 7}, (_, index) => addDays(state.weekStart, index));
    els.weekLabel.textContent = `Del ${fmtDate(days[0])} al ${fmtDate(days[6])}`;
    updateWeekButton();

    let html = '<div class="agenda-cell agenda-header"></div>' + days.map(day => `
      <div class="agenda-cell agenda-header ${dateKey(day) === dateKey(state.serverNow) ? 'today' : ''}">
        <strong>${day.toLocaleDateString('es-PE', {weekday:'short'}).replace('.', '')}</strong>
        <span>${day.toLocaleDateString('es-PE', {day:'2-digit', month:'2-digit'})}</span>
      </div>`).join('');

    for (let hour = 8; hour < 23; hour += 1) {
      html += `<div class="agenda-cell agenda-time">${hourLabel(hour)}</div>`;
      for (const day of days) {
        const key = `${dateKey(day)}|${hour}`;
        const info = slotInfo(day, hour, key);
        html += `<div class="agenda-cell"><button class="slot-button ${info.cls}" type="button" data-slot="${key}" ${info.disabled ? 'disabled' : ''}>${info.label}${info.sub ? `<small>${info.sub}</small>` : ''}</button></div>`;
      }
    }

    els.agenda.innerHTML = html;
    els.agenda.querySelectorAll('[data-slot]:not(:disabled)').forEach(button => {
      button.addEventListener('click', () => toggleSlot(button.dataset.slot));
    });
  }

  function updateWeekButton() {
    const number = isoWeekNumber(state.weekStart);
    els.today.textContent = `Semana ${number}`;
    els.today.setAttribute('aria-label', `Semana ${number}. Volver a la semana actual`);
  }

  function slotInfo(day, hour, key) {
    const start = new Date(`${dateKey(day)}T${String(hour).padStart(2, '0')}:00:00`);
    const end = new Date(start.getTime() + 3600000);
    const now = state.serverNow;
    const isCurrentHour = start <= now && end > now;
    const booking = state.bookings.find(item =>
      dateKey(new Date(item.startDateTime)) === dateKey(day) &&
      new Date(item.startDateTime) < end &&
      new Date(item.endDateTime) > start
    );

    if (end <= now || isCurrentHour) {
      return {cls: `past ${isCurrentHour ? 'now' : ''}`, label: isCurrentHour ? 'Ahora' : 'No disponible', sub: isCurrentHour ? 'Hora actual' : '', disabled: true};
    }
    if (booking) {
      const paid = String(booking.status).toUpperCase() === 'PAGADO';
      return {cls: paid ? 'occupied' : 'pending', label: paid ? 'Ocupado' : 'En proceso', sub: paid ? 'Reservado' : 'Pago pendiente', disabled: true};
    }
    if (state.selected.has(key)) return {cls:'selected', label:'Seleccionado', sub:`S/ ${priceFor(hour)}`, disabled:false};
    return {cls:'available', label:'Disponible', sub:`S/ ${priceFor(hour)}`, disabled:false};
  }

  function toggleSlot(key) {
    state.selected.has(key) ? state.selected.delete(key) : state.selected.add(key);
    renderAgenda();
    updateSummary();
  }

  function selectedSlots() {
    return [...state.selected].map(key => {
      const [date, hour] = key.split('|');
      return {date, hour:Number(hour), start:new Date(`${date}T${hour.padStart(2, '0')}:00:00`)};
    }).sort((a, b) => a.start - b.start);
  }

  function validateSelection(slots) {
    if (!slots.length) return 'Selecciona al menos una hora.';
    const date = slots[0].date;
    if (slots.some(slot => slot.date !== date)) return 'Todas las horas deben corresponder al mismo día.';
    for (let index = 1; index < slots.length; index += 1) {
      if (slots[index].hour !== slots[index - 1].hour + 1) return 'Selecciona horas consecutivas para una misma reserva.';
    }
    return '';
  }

  function updateSummary() {
    const slots = selectedSlots();
    const error = validateSelection(slots);
    els.panel.hidden = !slots.length;
    if (!slots.length) return;

    const total = slots.reduce((sum, slot) => sum + priceFor(slot.hour), 0);
    const first = slots[0];
    const last = slots[slots.length - 1];
    els.title.textContent = state.venue?.name || 'Reserva';
    els.details.innerHTML = `
      <p><strong>Fecha:</strong> ${formatFullDate(first.date)}</p>
      <p><strong>Horario:</strong> ${hourLabel(first.hour)} a ${hourLabel(last.hour + 1)} (${slots.length} ${slots.length === 1 ? 'hora' : 'horas'})</p>
      ${error ? `<p style="color:#f8c449"><strong>${escapeHtml(error)}</strong></p>` : ''}`;
    els.total.textContent = `S/ ${total.toFixed(2)}`;
  }

  async function submitReservation(event) {
    event.preventDefault();
    const slots = selectedSlots();
    const selectionError = validateSelection(slots);
    if (selectionError) return alert(selectionError);
    if (!API_URL) return alert('Primero debes configurar RENTALS_API_URL en assets/js/config.js.');
    if (!els.form.reportValidity()) return;

    const formData = new FormData(els.form);
    const applicant = {
      firstName: String(formData.get('firstName') || '').trim(),
      lastName: String(formData.get('lastName') || '').trim(),
      dni: String(formData.get('dni') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim()
    };
    const first = slots[0];
    const last = slots[slots.length - 1];
    const button = els.form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Generando solicitud…';

    try {
      const payload = {
        venueId: state.venue.venueId,
        startDateTime: `${first.date}T${String(first.hour).padStart(2, '0')}:00:00`,
        endDateTime: `${last.date}T${String(last.hour + 1).padStart(2, '0')}:00:00`,
        ...applicant
      };
      const res = await api('createReservation', payload, false);
      if (!res.ok) throw new Error(res.message || 'No se pudo crear la reserva.');
      showResult(res, applicant);
      state.selected.clear();
      els.form.reset();
      updateSummary();
      await loadAvailability();
    } catch (error) {
      alert(error.message);
    } finally {
      button.disabled = false;
      button.textContent = 'Solicitar reserva';
    }
  }

  function showResult(res, applicant) {
    const start = new Date(res.startDateTime);
    const end = new Date(res.endDateTime);
    const duration = Math.round((end - start) / 3600000);
    const address = VENUE_ADDRESSES[state.venue?.venueId] || 'Pachacámac, Lima';
    const deadline = new Date(res.paymentDeadline);

    els.code.textContent = res.reservationCode;
    els.message.textContent = 'El horario se encuentra bloqueado temporalmente mientras realizas el pago.';
    els.deadline.innerHTML = `<strong>Tiempo límite de pago:</strong><br>${deadline.toLocaleString('es-PE', {dateStyle:'full', timeStyle:'short'})}<br><small>Luego del vencimiento, caja dispone de 10 minutos de gracia para registrar un pago recibido dentro del plazo.</small>`;
    els.receiptVenue.textContent = res.venueName;
    els.receiptAddress.textContent = address;
    els.receiptDate.textContent = start.toLocaleDateString('es-PE', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
    els.receiptTime.textContent = `${formatTime(start)} a ${formatTime(end)}`;
    els.receiptDuration.textContent = `${duration} ${duration === 1 ? 'hora' : 'horas'}`;
    els.receiptTotal.textContent = `S/ ${Number(res.total).toFixed(2)}`;
    els.receiptName.textContent = `${applicant.firstName} ${applicant.lastName}`;
    els.receiptDni.textContent = applicant.dni;
    els.receiptPhone.textContent = applicant.phone;
    els.receiptEmail.textContent = applicant.email;

    const qrText = [
      'PACHA DEPORTES',
      `CODIGO:${res.reservationCode}`,
      `ESPACIO:${res.venueName}`,
      `FECHA:${start.toLocaleDateString('es-PE')}`,
      `HORARIO:${formatTime(start)}-${formatTime(end)}`,
      `TOTAL:S/${Number(res.total).toFixed(2)}`,
      `DNI:${applicant.dni}`
    ].join('|');
    els.qr.src = `https://quickchart.io/qr?size=300&margin=1&text=${encodeURIComponent(qrText)}`;

    els.modal.classList.add('open');
    els.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => els.print.focus(), 50);
  }

  function closeModal() {
    els.modal.classList.remove('open');
    els.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function api(action, payload) {
    return new Promise((resolve, reject) => {
      const callback = `rentalCb_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      const timer = setTimeout(() => finish(new Error('El servidor de reservas no respondió.')), 20000);
      function finish(error, data) {
        clearTimeout(timer);
        delete window[callback];
        script.remove();
        error ? reject(error) : resolve(data);
      }
      window[callback] = data => finish(null, data);
      script.onerror = () => finish(new Error('No se pudo conectar con el sistema de reservas.'));
      const params = new URLSearchParams({action, callback, payload:JSON.stringify(payload)});
      script.src = `${API_URL}?${params}`;
      document.body.appendChild(script);
    });
  }

  function startOfWeek(date) { const value = new Date(date); value.setHours(0,0,0,0); value.setDate(value.getDate() - ((value.getDay() + 6) % 7)); return value; }
  function addDays(date, days) { const value = new Date(date); value.setDate(value.getDate() + days); return value; }
  function dateKey(date) { const value = new Date(date); return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`; }
  function fmtDate(date) { return date.toLocaleDateString('es-PE', {day:'numeric', month:'long'}); }
  function formatFullDate(date) { return new Date(`${date}T12:00:00`).toLocaleDateString('es-PE', {weekday:'long', day:'numeric', month:'long', year:'numeric'}); }
  function formatTime(date) { return date.toLocaleTimeString('es-PE', {hour:'numeric', minute:'2-digit', hour12:true}); }
  function hourLabel(hour) { const value = hour % 12 || 12; return `${value}:00 ${hour < 12 ? 'a. m.' : 'p. m.'}`; }
  function priceFor(hour) { return hour < 18 ? 20 : 30; }
  function truthy(value) { return value === true || String(value).toLowerCase() === 'true' || value === 1; }
  function isoWeekNumber(date) { const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())); const day = value.getUTCDay() || 7; value.setUTCDate(value.getUTCDate() + 4 - day); const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1)); return Math.ceil((((value - yearStart) / 86400000) + 1) / 7); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }
})();
