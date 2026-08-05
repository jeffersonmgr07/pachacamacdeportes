(() => {
  'use strict';

  const W = window.PachaWorkshops;
  const DEPARTMENTS = ['Amazonas','Áncash','Apurímac','Arequipa','Ayacucho','Cajamarca','Callao','Cusco','Huancavelica','Huánuco','Ica','Junín','La Libertad','Lambayeque','Lima','Loreto','Madre de Dios','Moquegua','Pasco','Piura','Puno','San Martín','Tacna','Tumbes','Ucayali'];
  const LIMA_DISTRICTS = ['Ancón','Ate','Barranco','Breña','Carabayllo','Chaclacayo','Chorrillos','Cieneguilla','Comas','El Agustino','Independencia','Jesús María','La Molina','La Victoria','Lima','Lince','Los Olivos','Lurigancho-Chosica','Lurín','Magdalena del Mar','Miraflores','Pachacámac','Pucusana','Pueblo Libre','Puente Piedra','Punta Hermosa','Punta Negra','Rímac','San Bartolo','San Borja','San Isidro','San Juan de Lurigancho','San Juan de Miraflores','San Luis','San Martín de Porres','San Miguel','Santa Anita','Santa María del Mar','Santa Rosa','Santiago de Surco','Surquillo','Villa El Salvador','Villa María del Triunfo'];
  const state = { catalog: [], selectedWorkshop: null };

  function populateLocations() {
    const department = W.$('#residenceDepartment');
    const district = W.$('#residenceDistrict');
    department.innerHTML = DEPARTMENTS.map(item => `<option value="${W.safe(item)}"${item === 'Lima' ? ' selected' : ''}>${W.safe(item)}</option>`).join('');
    district.innerHTML = LIMA_DISTRICTS.map(item => `<option value="${W.safe(item)}"${item === 'Pachacámac' ? ' selected' : ''}>${W.safe(item)}</option>`).join('');
    updateDistrictMode();
  }

  function updateDistrictMode() {
    const isLimaProvince = W.normalize(W.$('#residenceDepartment').value) === 'LIMA' && W.normalize(W.$('#residenceProvince').value) === 'LIMA';
    const select = W.$('#residenceDistrict');
    const other = W.$('#residenceDistrictOther');
    select.hidden = !isLimaProvince;
    select.disabled = !isLimaProvince;
    other.hidden = isLimaProvince;
    other.disabled = isLimaProvince;
    other.required = !isLimaProvince;
    select.required = isLimaProvince;
    updateFeePreview();
  }

  function currentDistrict() {
    return W.$('#residenceDistrict').disabled
      ? W.$('#residenceDistrictOther').value.trim()
      : W.$('#residenceDistrict').value;
  }

  function updateFeePreview() {
    const district = currentDistrict();
    const selected = state.selectedWorkshop;
    const localFee = Number(selected?.localFee || 25);
    const externalFee = Number(selected?.externalFee || 30);
    const amount = W.normalize(district) === 'PACHACAMAC' ? localFee : externalFee;
    W.$('#monthlyFeePreview').innerHTML = `Cuota mensual: <strong>${W.formatMoney(amount)}</strong>${district ? ` · ${W.safe(district)}` : ''}`;
  }

  function calculateAge(dateText) {
    if (!dateText) return null;
    const birth = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function updateAge() {
    const age = calculateAge(W.$('#birthDate').value);
    const field = W.$('#birthDate').closest('.field');
    const ageField = W.$('#childAge').closest('.field');
    field.classList.remove('field-invalid');
    ageField.classList.remove('field-invalid');
    W.$('#childAge').value = age == null ? '' : `${age} años`;
    if (age != null && (age < 6 || age > 17)) {
      field.classList.add('field-invalid');
      ageField.classList.add('field-invalid');
      W.$('#ageHelp').textContent = 'No puede inscribirse: debe tener entre 6 y 17 años cumplidos.';
      return false;
    }
    W.$('#ageHelp').textContent = 'Solo se admiten menores de 6 a 17 años.';
    return age != null;
  }

  function setBirthDateLimits() {
    const today = new Date();
    const latest = new Date(today.getFullYear() - 6, today.getMonth(), today.getDate());
    const earliest = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() + 1);
    const localKey = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    W.$('#birthDate').max = localKey(latest);
    W.$('#birthDate').min = localKey(earliest);
  }

  function declarationText() {
    const guardian = W.$('#guardianFullName').value.trim() || '[nombre del apoderado]';
    const guardianDni = W.digits(W.$('#guardianDni').value) || '[DNI]';
    const child = [
      W.$('#childNames').value.trim(),
      W.$('#childPaternalSurname').value.trim(),
      W.$('#childMaternalSurname').value.trim()
    ].filter(Boolean).join(' ') || '[nombre del menor]';

    return `Por intermedio de la presente, yo <strong>${W.safe(guardian)}</strong>, identificado(a) con DNI <strong>${W.safe(guardianDni)}</strong>, AUTORIZO bajo mi responsabilidad a mi menor hijo(a) <strong>${W.safe(child)}</strong> a participar de las escuelas y/o talleres municipales, dejando constancia de que se encuentra en perfectas condiciones físicas y psicológicas; asimismo, me comprometo a cumplir y respetar las indicaciones, reglas y disposiciones que se determinen dentro de los mismos. EXONERO DE TODA RESPONSABILIDAD A LA MUNICIPALIDAD DISTRITAL DE PACHACÁMAC.`;
  }

  function updateDeclaration() {
    W.$('#declarationPreview').innerHTML = declarationText();
  }

  function renderWorkshopSelector() {
    const selector = W.$('#workshopSelector');
    selector.innerHTML = state.catalog.map(workshop => `<option value="${W.safe(workshop.workshopId)}">${W.safe(workshop.name)}</option>`).join('');
    const preset = new URLSearchParams(location.search).get('taller');
    const selected = state.catalog.find(item => String(item.workshopId) === String(preset)) || state.catalog[0];
    if (selected) {
      selector.value = selected.workshopId;
      selectWorkshop(selected.workshopId);
    }
  }

  function selectWorkshop(workshopId) {
    const workshop = state.catalog.find(item => String(item.workshopId) === String(workshopId));
    if (!workshop) return;
    state.selectedWorkshop = workshop;
    W.$('#workshopId').value = workshop.workshopId;
    W.$('#selectedWorkshopSummary').innerHTML = `<span>Taller seleccionado</span><strong>${W.safe(workshop.name)}</strong><small><b>Días y horario:</b> ${W.safe(workshop.scheduleText)}</small><small><b>Ubicación:</b> ${W.safe(workshop.location)}</small>`;
    updateFeePreview();
  }

  function formPayload(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    data.childDni = W.digits(data.childDni);
    data.guardianDni = W.digits(data.guardianDni);
    data.guardianPhone = W.digits(data.guardianPhone);
    data.residenceDistrict = currentDistrict();
    data.declarationAccepted = W.$('#declarationAccepted').checked;
    delete data.childAge;
    delete data.residenceDistrictOther;
    return data;
  }

  function validateEnrollment(payload) {
    if (!payload.workshopId) return 'Selecciona uno de los talleres disponibles.';
    if (!updateAge()) return 'La edad del menor debe estar entre 6 y 17 años cumplidos.';
    if (payload.childDni.length !== 8) return 'El DNI del menor debe tener 8 dígitos.';
    if (payload.guardianDni.length !== 8) return 'El DNI del apoderado debe tener 8 dígitos.';
    if (payload.guardianPhone.length < 9) return 'El celular del apoderado no es válido.';
    if (!payload.declarationAccepted) return 'Debes aceptar la declaración jurada para continuar.';
    if (!payload.residenceDistrict) return 'Ingresa el distrito de residencia.';
    return '';
  }

  async function submitEnrollment(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = W.$('#enrollmentSubmit');
    if (!form.reportValidity()) return;

    const payload = formPayload(form);
    const validation = validateEnrollment(payload);
    if (validation) {
      W.showMessage('#enrollmentMessage', 'error', validation);
      return;
    }

    W.setButtonBusy(button, true, 'Registrando inscripción…');
    W.showMessage('#enrollmentMessage', 'info', 'Estamos guardando la ficha y generando la orden de pago.');
    try {
      const response = await W.request('createWorkshopEnrollment', payload);
      if (!response?.ok) throw new Error(response?.message || 'No se pudo registrar la inscripción.');
      W.showMessage('#enrollmentMessage', response.warning ? 'info' : 'ok', response.warning || 'Inscripción registrada. Revisa la orden de pago generada.');
      W.openOrderModal(response.order, {
        subtitle: 'La ficha fue registrada. Presenta el código o el QR en caja para efectuar el primer pago.',
        accountHref: 'taller-consulta.html'
      });
      const keepWorkshopId = state.selectedWorkshop?.workshopId;
      form.reset();
      populateLocations();
      setBirthDateLimits();
      W.$('#childAge').value = '';
      updateDeclaration();
      if (keepWorkshopId) {
        W.$('#workshopSelector').value = keepWorkshopId;
        selectWorkshop(keepWorkshopId);
      }
    } catch (error) {
      W.showMessage('#enrollmentMessage', 'error', error.message || String(error));
    } finally {
      W.setButtonBusy(button, false);
    }
  }

  async function loadCatalog() {
    const selector = W.$('#workshopSelector');
    selector.innerHTML = '<option value="">Cargando talleres…</option>';
    selector.disabled = true;
    try {
      const response = await W.request('getWorkshopCatalog');
      if (!response?.ok) throw new Error(response?.message || 'No se pudo cargar el catálogo.');
      state.catalog = response.workshops || [];
      if (!state.catalog.length) throw new Error('No hay talleres habilitados en este momento.');
      renderWorkshopSelector();
      selector.disabled = false;
    } catch (error) {
      selector.innerHTML = '<option value="">Sin talleres disponibles</option>';
      W.showMessage('#enrollmentMessage', 'error', error.message || String(error));
    }
  }

  function bindEvents() {
    W.$('#workshopSelector').addEventListener('change', event => selectWorkshop(event.target.value));
    W.$('#residenceDepartment').addEventListener('change', updateDistrictMode);
    W.$('#residenceProvince').addEventListener('input', updateDistrictMode);
    W.$('#residenceDistrict').addEventListener('change', updateFeePreview);
    W.$('#residenceDistrictOther').addEventListener('input', updateFeePreview);
    W.$('#birthDate').addEventListener('change', updateAge);
    ['guardianFullName','guardianDni','childNames','childPaternalSurname','childMaternalSurname'].forEach(id => {
      W.$(`#${id}`).addEventListener('input', updateDeclaration);
    });
    W.$('#workshopEnrollmentForm').addEventListener('submit', submitEnrollment);
    W.$$('input[inputmode="numeric"]').forEach(input => input.addEventListener('input', () => {
      const limit = Number(input.maxLength) > 0 ? input.maxLength : undefined;
      input.value = W.digits(input.value).slice(0, limit);
    }));
    W.bindModal();
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
