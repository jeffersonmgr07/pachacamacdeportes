(() => {
  'use strict';

  const DEPARTMENTS = ['Amazonas','Áncash','Apurímac','Arequipa','Ayacucho','Cajamarca','Callao','Cusco','Huancavelica','Huánuco','Ica','Junín','La Libertad','Lambayeque','Lima','Loreto','Madre de Dios','Moquegua','Pasco','Piura','Puno','San Martín','Tacna','Tumbes','Ucayali'];
  const LIMA_DISTRICTS = ['Ancón','Ate','Barranco','Breña','Carabayllo','Chaclacayo','Chorrillos','Cieneguilla','Comas','El Agustino','Independencia','Jesús María','La Molina','La Victoria','Lima','Lince','Los Olivos','Lurigancho-Chosica','Lurín','Magdalena del Mar','Miraflores','Pachacámac','Pucusana','Pueblo Libre','Puente Piedra','Punta Hermosa','Punta Negra','Rímac','San Bartolo','San Borja','San Isidro','San Juan de Lurigancho','San Juan de Miraflores','San Luis','San Martín de Porres','San Miguel','Santa Anita','Santa María del Mar','Santa Rosa','Santiago de Surco','Surquillo','Villa El Salvador','Villa María del Triunfo'];
  const SPORT_ICONS = {VOLEY:'🏐', FUTBOL:'⚽', BASQUET:'🏀'};
  const state = {catalog: [], selectedWorkshop: null, accountCredentials: null};
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

  function apiUrl(){
    return window.APP_CONFIG?.WORKSHOPS_API_URL || window.APP_CONFIG?.RENTALS_API_URL || '';
  }

  function workshopRequest(action, payload={}){
    return new Promise((resolve, reject) => {
      const url = apiUrl();
      if(!url){ reject(new Error('Falta configurar WORKSHOPS_API_URL en assets/js/config.js.')); return; }
      const callback = 'workshop_cb_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      const timeout = setTimeout(() => cleanup(new Error('El servidor demoró demasiado en responder. Intenta nuevamente.')), Number(window.APP_CONFIG?.API_TIMEOUT_MS || 15000));
      function cleanup(error){
        clearTimeout(timeout);
        if(script.parentNode) script.parentNode.removeChild(script);
        try{ delete window[callback]; }catch(_){ window[callback] = undefined; }
        if(error) reject(error);
      }
      window[callback] = response => { cleanup(); resolve(response); };
      const params = new URLSearchParams({action, callback, payload: JSON.stringify(payload)});
      script.src = `${url}?${params.toString()}`;
      script.async = true;
      script.onerror = () => cleanup(new Error('No se pudo conectar con el sistema de talleres.'));
      document.body.appendChild(script);
    });
  }

  function safe(value){
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function normalize(value){
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
  }

  function digits(value){ return String(value || '').replace(/\D/g,''); }

  function formatMoney(value){
    return new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN',minimumFractionDigits:2}).format(Number(value || 0));
  }

  function formatDate(value){
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric'});
  }

  function formatDateTime(value){
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('es-PE',{weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit'});
  }

  function showMessage(target, type, text){
    const el = typeof target === 'string' ? $(target) : target;
    if(!el) return;
    el.innerHTML = text ? `<div class="form-alert ${safe(type)}">${safe(text)}</div>` : '';
  }

  function setButtonBusy(button, busy, label){
    if(!button) return;
    if(busy){
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = label || 'Procesando…';
    }else{
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  function populateLocations(){
    const department = $('#residenceDepartment');
    const district = $('#residenceDistrict');
    department.innerHTML = DEPARTMENTS.map(item => `<option value="${safe(item)}"${item === 'Lima' ? ' selected' : ''}>${safe(item)}</option>`).join('');
    district.innerHTML = LIMA_DISTRICTS.map(item => `<option value="${safe(item)}"${item === 'Pachacámac' ? ' selected' : ''}>${safe(item)}</option>`).join('');
    updateDistrictMode();
  }

  function updateDistrictMode(){
    const isLimaProvince = normalize($('#residenceDepartment').value) === 'LIMA' && normalize($('#residenceProvince').value) === 'LIMA';
    const select = $('#residenceDistrict');
    const other = $('#residenceDistrictOther');
    select.hidden = !isLimaProvince;
    select.disabled = !isLimaProvince;
    other.hidden = isLimaProvince;
    other.disabled = isLimaProvince;
    other.required = !isLimaProvince;
    select.required = isLimaProvince;
    updateFeePreview();
  }

  function currentDistrict(){
    return $('#residenceDistrict').disabled ? $('#residenceDistrictOther').value.trim() : $('#residenceDistrict').value;
  }

  function updateFeePreview(){
    const district = currentDistrict();
    const amount = normalize(district) === 'PACHACAMAC' ? 25 : 30;
    $('#monthlyFeePreview').innerHTML = `Cuota mensual: <strong>${formatMoney(amount)}</strong>${district ? ` · ${safe(district)}` : ''}`;
  }

  function calculateAge(dateText){
    if(!dateText) return null;
    const birth = new Date(`${dateText}T00:00:00`);
    if(Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();
    if(monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function updateAge(){
    const age = calculateAge($('#birthDate').value);
    const field = $('#birthDate').closest('.field');
    const ageField = $('#childAge').closest('.field');
    field.classList.remove('field-invalid');
    ageField.classList.remove('field-invalid');
    $('#childAge').value = age == null ? '' : `${age} años`;
    if(age != null && (age < 6 || age > 17)){
      field.classList.add('field-invalid');
      ageField.classList.add('field-invalid');
      $('#ageHelp').textContent = 'No puede inscribirse: debe tener entre 6 y 17 años cumplidos.';
      return false;
    }
    $('#ageHelp').textContent = 'Solo se admiten menores de 6 a 17 años.';
    return age != null;
  }

  function setBirthDateLimits(){
    const today = new Date();
    const latest = new Date(today.getFullYear()-6, today.getMonth(), today.getDate());
    const earliest = new Date(today.getFullYear()-18, today.getMonth(), today.getDate()+1);
    const localKey = d => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
    $('#birthDate').max = localKey(latest);
    $('#birthDate').min = localKey(earliest);
  }

  function declarationText(){
    const guardian = $('#guardianFullName').value.trim() || '[nombre del apoderado]';
    const guardianDni = digits($('#guardianDni').value) || '[DNI]';
    const child = [$('#childNames').value.trim(), $('#childPaternalSurname').value.trim(), $('#childMaternalSurname').value.trim()].filter(Boolean).join(' ') || '[nombre del menor]';
    return `Por intermedio de la presente, yo <strong>${safe(guardian)}</strong>, identificado(a) con DNI <strong>${safe(guardianDni)}</strong>, AUTORIZO bajo mi responsabilidad a mi menor hijo(a) <strong>${safe(child)}</strong> a participar de las escuelas y/o talleres municipales, dejando constancia de que se encuentra en perfectas condiciones físicas y psicológicas; asimismo, me comprometo a cumplir y respetar las indicaciones, reglas y disposiciones que se determinen dentro de los mismos. EXONERO DE TODA RESPONSABILIDAD A LA MUNICIPALIDAD DISTRITAL DE PACHACÁMAC.`;
  }

  function updateDeclaration(){ $('#declarationPreview').innerHTML = declarationText(); }

  function renderCatalog(){
    const root = $('#workshopCatalog');
    if(!state.catalog.length){ root.innerHTML = '<article class="workshop-card workshop-card-loading">No hay talleres habilitados en este momento.</article>'; return; }
    root.innerHTML = state.catalog.map(workshop => {
      const icon = SPORT_ICONS[normalize(workshop.sportCode)] || '🏅';
      return `<article class="workshop-card">
        <div class="workshop-sport-icon" aria-hidden="true">${icon}</div>
        <span class="badge badge-green">Inscripciones abiertas</span>
        <h3>${safe(workshop.name)}</h3>
        <p>${safe(workshop.description || 'Taller deportivo municipal para niñas, niños y adolescentes.')}</p>
        <div class="workshop-meta">
          <div class="workshop-meta-row"><span>🗓️</span><span>${safe(workshop.scheduleText)}</span></div>
          <div class="workshop-meta-row"><span>📍</span><span>${safe(workshop.location)}</span></div>
          <div class="workshop-meta-row"><span>🎂</span><span>De 6 a 17 años</span></div>
          <div class="workshop-meta-row"><span>🏁</span><span>Hasta ${safe(formatDate(workshop.endDate))}</span></div>
        </div>
        <div class="workshop-price-row"><div><small>Desde</small><strong>${formatMoney(workshop.localFee)}</strong></div><small>Pago mensual</small></div>
        <button class="btn btn-primary" type="button" data-select-workshop="${safe(workshop.workshopId)}">Inscribirme</button>
      </article>`;
    }).join('');
    $$('[data-select-workshop]', root).forEach(button => button.addEventListener('click', () => selectWorkshop(button.dataset.selectWorkshop, true)));
  }

  function selectWorkshop(workshopId, scroll){
    const workshop = state.catalog.find(item => String(item.workshopId) === String(workshopId));
    if(!workshop) return;
    state.selectedWorkshop = workshop;
    $('#workshopId').value = workshop.workshopId;
    $('#selectedWorkshopSummary').innerHTML = `<strong>${safe(workshop.name)}</strong>${safe(workshop.scheduleText)}<small>${safe(workshop.location)}</small>`;
    if(scroll) $('#inscripcion').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function formPayload(form){
    const data = Object.fromEntries(new FormData(form).entries());
    data.childDni = digits(data.childDni);
    data.guardianDni = digits(data.guardianDni);
    data.guardianPhone = digits(data.guardianPhone);
    data.residenceDistrict = currentDistrict();
    data.declarationAccepted = $('#declarationAccepted').checked;
    delete data.childAge;
    delete data.residenceDistrictOther;
    return data;
  }

  function validateEnrollment(payload){
    if(!payload.workshopId) return 'Selecciona uno de los talleres disponibles.';
    if(!updateAge()) return 'La edad del menor debe estar entre 6 y 17 años cumplidos.';
    if(payload.childDni.length !== 8) return 'El DNI del menor debe tener 8 dígitos.';
    if(payload.guardianDni.length !== 8) return 'El DNI del apoderado debe tener 8 dígitos.';
    if(payload.guardianPhone.length < 9) return 'El celular del apoderado no es válido.';
    if(!payload.declarationAccepted) return 'Debes aceptar la declaración jurada para continuar.';
    if(!payload.residenceDistrict) return 'Ingresa el distrito de residencia.';
    return '';
  }

  function qrUrl(order){
    const data = JSON.stringify({tipo:'TALLER',codigo:order.orderCode,matricula:order.enrollmentCode,total:Number(order.total)});
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(data)}`;
  }

  function renderOrder(order, options={}){
    const invoiceText = (order.invoices || []).map(item => item.label || formatDate(item.dueDate)).join(', ');
    return `<div class="order-success-icon">✓</div>
      <h2 id="orderModalTitle" class="order-title">${safe(options.title || 'Orden de pago generada')}</h2>
      <p class="order-subtitle">${safe(options.subtitle || 'Presenta el código o el QR en la caja de la Municipalidad de Pachacámac.')}</p>
      <div class="order-deadline">Válida hasta ${safe(formatDateTime(order.paymentDeadline))}</div>
      <div class="order-code-box"><div><small>Código de pago</small><strong>${safe(order.orderCode)}</strong><small style="margin-top:13px">Código de matrícula</small><strong style="font-size:18px">${safe(order.enrollmentCode)}</strong></div><img src="${qrUrl(order)}" alt="Código QR de la orden de pago"></div>
      <div class="order-details">
        <div class="order-detail-row"><span>Alumno(a)</span><strong>${safe(order.studentName)}</strong></div>
        <div class="order-detail-row"><span>Taller</span><strong>${safe(order.workshopName)}</strong></div>
        <div class="order-detail-row"><span>Cuota(s)</span><strong>${safe(invoiceText || 'Matrícula inicial')}</strong></div>
        <div class="order-detail-row"><span>Total</span><strong>${formatMoney(order.total)}</strong></div>
      </div>
      <div class="order-note">La orden de pago no confirma la matrícula. La inscripción se activa cuando la cajera registra el pago. Conserva ambos códigos.</div>
      <div class="order-actions"><button class="btn btn-primary" type="button" data-close-workshop-modal>Aceptar</button><a class="btn btn-secondary" href="#mis-pagos" data-close-workshop-modal>Ver mis pagos</a></div>`;
  }

  function openOrderModal(order, options){
    $('#workshopOrderContent').innerHTML = renderOrder(order, options);
    const modal = $('#workshopOrderModal');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    $$('[data-close-workshop-modal]', modal).forEach(el => el.addEventListener('click', closeOrderModal));
  }

  function closeOrderModal(){
    const modal = $('#workshopOrderModal');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
  }

  async function submitEnrollment(event){
    event.preventDefault();
    const form = event.currentTarget;
    const button = $('#enrollmentSubmit');
    if(!form.reportValidity()) return;
    const payload = formPayload(form);
    const validation = validateEnrollment(payload);
    if(validation){ showMessage('#enrollmentMessage','error',validation); return; }
    setButtonBusy(button,true,'Registrando inscripción…');
    showMessage('#enrollmentMessage','info','Estamos guardando la ficha y generando la orden de pago.');
    try{
      const response = await workshopRequest('createWorkshopEnrollment', payload);
      if(!response?.ok) throw new Error(response?.message || 'No se pudo registrar la inscripción.');
      showMessage('#enrollmentMessage',response.warning ? 'info' : 'ok',response.warning || 'Inscripción registrada. Revisa la orden de pago generada.');
      openOrderModal(response.order, {subtitle:'La ficha fue registrada. Presenta el código o el QR en caja para efectuar el primer pago.'});
      form.reset();
      populateLocations();
      setBirthDateLimits();
      state.selectedWorkshop = null;
      $('#workshopId').value = '';
      $('#childAge').value = '';
      $('#selectedWorkshopSummary').textContent = 'Selecciona un taller arriba.';
      updateDeclaration();
      updateFeePreview();
    }catch(error){
      showMessage('#enrollmentMessage','error',error.message || String(error));
    }finally{
      setButtonBusy(button,false);
    }
  }

  function accountStatusClass(status){
    const s = normalize(status);
    if(s === 'ACTIVO') return 'active';
    if(s.includes('PENDIENTE')) return 'pending';
    return 'cancelled';
  }

  function invoiceStatus(item){
    if(normalize(item.status) === 'PAGADO') return {className:'paid', text:'Pagado'};
    if(item.overdue) return {className:'overdue', text:'Vencido'};
    return {className:'', text:'Pendiente'};
  }

  function renderAccount(data){
    const root = $('#workshopAccountResults');
    if(!data.enrollments?.length){ root.innerHTML = '<div class="empty-account">No se encontraron matrículas vigentes o históricas con esos datos.</div>'; return; }
    root.innerHTML = data.enrollments.map(enrollment => {
      const invoices = enrollment.invoices || [];
      const pending = invoices.filter(item => normalize(item.status) !== 'PAGADO' && normalize(item.status) !== 'ANULADO');
      const rows = invoices.map(item => {
        const st = invoiceStatus(item);
        const checkbox = normalize(item.status) === 'PAGADO' || normalize(enrollment.status).includes('BAJA') ? '' : `<input type="checkbox" value="${safe(item.invoiceId)}" data-invoice-checkbox="${safe(enrollment.enrollmentCode)}" aria-label="Seleccionar ${safe(item.label)}">`;
        return `<div class="invoice-row">${checkbox}<div><strong>${safe(item.label)}</strong><small>Vence: ${safe(formatDate(item.dueDate))}${item.paidAt ? ` · Pagado: ${safe(formatDate(item.paidAt))}` : ''}</small></div><span class="invoice-amount">${formatMoney(item.amount)}</span><span class="invoice-status ${st.className}">${st.text}</span></div>`;
      }).join('');
      const actions = pending.length && !normalize(enrollment.status).includes('BAJA')
        ? `<div class="account-actions"><button class="btn btn-secondary btn-small" type="button" data-select-all-invoices="${safe(enrollment.enrollmentCode)}">Seleccionar pendientes</button><button class="btn btn-primary btn-small" type="button" data-create-payment-order="${safe(enrollment.enrollmentCode)}">Generar orden de pago</button></div>`
        : '';
      return `<article class="account-enrollment">
        <div class="account-enrollment-head"><div><h3>${safe(enrollment.studentName)}</h3><p>${safe(enrollment.workshopName)} · Matrícula ${safe(enrollment.enrollmentCode)}</p></div><span class="status-chip ${accountStatusClass(enrollment.status)}">${safe(enrollment.statusLabel || enrollment.status)}</span></div>
        <div class="invoice-list">${rows || '<div class="empty-account">No hay cuotas registradas.</div>'}</div>${actions}
      </article>`;
    }).join('');
    $$('[data-select-all-invoices]', root).forEach(button => button.addEventListener('click', () => {
      $$('[data-invoice-checkbox]', root).filter(box => box.dataset.invoiceCheckbox === button.dataset.selectAllInvoices).forEach(box => { box.checked = true; });
    }));
    $$('[data-create-payment-order]', root).forEach(button => button.addEventListener('click', () => createPaymentOrder(button.dataset.createPaymentOrder, button)));
  }

  async function submitAccountLookup(event){
    event.preventDefault();
    const form = event.currentTarget;
    const button = $('#accountSubmit');
    if(!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    values.guardianDni = digits(values.guardianDni);
    state.accountCredentials = values;
    setButtonBusy(button,true,'Consultando…');
    showMessage('#accountMessage','info','Consultando matrículas y cuotas.');
    try{
      const response = await workshopRequest('lookupWorkshopAccount', values);
      if(!response?.ok) throw new Error(response?.message || 'No se pudo consultar la cuenta.');
      showMessage('#accountMessage','','');
      renderAccount(response);
    }catch(error){
      $('#workshopAccountResults').innerHTML = '';
      showMessage('#accountMessage','error',error.message || String(error));
    }finally{
      setButtonBusy(button,false);
    }
  }

  async function createPaymentOrder(enrollmentCode, button){
    if(!state.accountCredentials) return;
    const invoiceIds = $$('[data-invoice-checkbox]').filter(box => box.dataset.invoiceCheckbox === enrollmentCode && box.checked).map(box => box.value);
    if(!invoiceIds.length){ showMessage('#accountMessage','error','Selecciona al menos una cuota pendiente.'); return; }
    setButtonBusy(button,true,'Generando…');
    try{
      const response = await workshopRequest('createWorkshopPaymentOrder',{...state.accountCredentials,enrollmentCode,invoiceIds});
      if(!response?.ok) throw new Error(response?.message || 'No se pudo generar la orden.');
      openOrderModal(response.order,{subtitle:'Presenta el código o el QR en caja para pagar las cuotas seleccionadas.'});
      showMessage('#accountMessage',response.warning ? 'info' : 'ok',response.warning || 'La orden de pago fue generada correctamente.');
    }catch(error){
      showMessage('#accountMessage','error',error.message || String(error));
    }finally{
      setButtonBusy(button,false);
    }
  }

  async function loadCatalog(){
    try{
      const response = await workshopRequest('getWorkshopCatalog');
      if(!response?.ok) throw new Error(response?.message || 'No se pudo cargar el catálogo.');
      state.catalog = response.workshops || [];
      renderCatalog();
      const preset = new URLSearchParams(location.search).get('taller');
      if(preset) selectWorkshop(preset,false);
    }catch(error){
      $('#workshopCatalog').innerHTML = `<article class="workshop-card workshop-card-loading">${safe(error.message || String(error))}</article>`;
    }
  }

  function bindEvents(){
    $('#residenceDepartment').addEventListener('change', updateDistrictMode);
    $('#residenceProvince').addEventListener('input', updateDistrictMode);
    $('#residenceDistrict').addEventListener('change', updateFeePreview);
    $('#residenceDistrictOther').addEventListener('input', updateFeePreview);
    $('#birthDate').addEventListener('change', updateAge);
    ['guardianFullName','guardianDni','childNames','childPaternalSurname','childMaternalSurname'].forEach(id => $(`#${id}`).addEventListener('input', updateDeclaration));
    $('#workshopEnrollmentForm').addEventListener('submit', submitEnrollment);
    $('#workshopAccountForm').addEventListener('submit', submitAccountLookup);
    $('#workshopOrderModal').addEventListener('click', event => { if(event.target.id === 'workshopOrderModal') closeOrderModal(); });
    document.addEventListener('keydown', event => { if(event.key === 'Escape') closeOrderModal(); });
    $$('input[inputmode="numeric"]').forEach(input => input.addEventListener('input', () => { input.value = digits(input.value).slice(0, Number(input.maxLength) > 0 ? input.maxLength : undefined); }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    populateLocations();
    setBirthDateLimits();
    updateDeclaration();
    updateFeePreview();
    bindEvents();
    loadCatalog();
  });
})();
