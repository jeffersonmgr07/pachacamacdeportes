(() => {
  'use strict';

  const W = window.PachaWorkshops;
  const DEPARTMENTS = ['Amazonas','Áncash','Apurímac','Arequipa','Ayacucho','Cajamarca','Callao','Cusco','Huancavelica','Huánuco','Ica','Junín','La Libertad','Lambayeque','Lima','Loreto','Madre de Dios','Moquegua','Pasco','Piura','Puno','San Martín','Tacna','Tumbes','Ucayali'];
  const PROVINCES = {
    'Amazonas':['Bagua','Bongará','Chachapoyas','Condorcanqui','Luya','Rodríguez de Mendoza','Utcubamba'],
    'Áncash':['Aija','Antonio Raymondi','Asunción','Bolognesi','Carhuaz','Carlos Fermín Fitzcarrald','Casma','Corongo','Huaraz','Huari','Huarmey','Huaylas','Mariscal Luzuriaga','Ocros','Pallasca','Pomabamba','Recuay','Santa','Sihuas','Yungay'],
    'Apurímac':['Abancay','Andahuaylas','Antabamba','Aymaraes','Chincheros','Cotabambas','Grau'],
    'Arequipa':['Arequipa','Camaná','Caravelí','Castilla','Caylloma','Condesuyos','Islay','La Unión'],
    'Ayacucho':['Cangallo','Huamanga','Huanca Sancos','Huanta','La Mar','Lucanas','Parinacochas','Páucar del Sara Sara','Sucre','Víctor Fajardo','Vilcas Huamán'],
    'Cajamarca':['Cajabamba','Cajamarca','Celendín','Chota','Contumazá','Cutervo','Hualgayoc','Jaén','San Ignacio','San Marcos','San Miguel','San Pablo','Santa Cruz'],
    'Callao':['Callao'],
    'Cusco':['Acomayo','Anta','Calca','Canas','Canchis','Chumbivilcas','Cusco','Espinar','La Convención','Paruro','Paucartambo','Quispicanchi','Urubamba'],
    'Huancavelica':['Acobamba','Angaraes','Castrovirreyna','Churcampa','Huancavelica','Huaytará','Tayacaja'],
    'Huánuco':['Ambo','Dos de Mayo','Huacaybamba','Huamalíes','Huánuco','Lauricocha','Leoncio Prado','Marañón','Pachitea','Puerto Inca','Yarowilca'],
    'Ica':['Chincha','Ica','Nasca','Palpa','Pisco'],
    'Junín':['Chanchamayo','Chupaca','Concepción','Huancayo','Jauja','Junín','Satipo','Tarma','Yauli'],
    'La Libertad':['Ascope','Bolívar','Chepén','Gran Chimú','Julcán','Otuzco','Pacasmayo','Pataz','Sánchez Carrión','Santiago de Chuco','Trujillo','Virú'],
    'Lambayeque':['Chiclayo','Ferreñafe','Lambayeque'],
    'Lima':['Barranca','Cajatambo','Cañete','Canta','Huaral','Huarochirí','Huaura','Lima','Oyón','Yauyos'],
    'Loreto':['Alto Amazonas','Datem del Marañón','Loreto','Mariscal Ramón Castilla','Maynas','Putumayo','Requena','Ucayali'],
    'Madre de Dios':['Manu','Tahuamanu','Tambopata'],
    'Moquegua':['General Sánchez Cerro','Ilo','Mariscal Nieto'],
    'Pasco':['Daniel Alcides Carrión','Oxapampa','Pasco'],
    'Piura':['Ayabaca','Huancabamba','Morropón','Paita','Piura','Sechura','Sullana','Talara'],
    'Puno':['Azángaro','Carabaya','Chucuito','El Collao','Huancané','Lampa','Melgar','Moho','Puno','San Antonio de Putina','San Román','Sandia','Yunguyo'],
    'San Martín':['Bellavista','El Dorado','Huallaga','Lamas','Mariscal Cáceres','Moyobamba','Picota','Rioja','San Martín','Tocache'],
    'Tacna':['Candarave','Jorge Basadre','Tacna','Tarata'],
    'Tumbes':['Contralmirante Villar','Tumbes','Zarumilla'],
    'Ucayali':['Atalaya','Coronel Portillo','Padre Abad','Purús']
  };
  const DISTRICTS = {
    'LIMA|BARRANCA':['Barranca','Paramonga','Pativilca','Supe','Supe Puerto'],
    'LIMA|CAJATAMBO':['Cajatambo','Copa','Gorgor','Huancapón','Manás'],
    'LIMA|CANETE':['San Vicente de Cañete','Asia','Calango','Cerro Azul','Chilca','Coayllo','Imperial','Lunahuaná','Mala','Nuevo Imperial','Pacarán','Quilmaná','San Antonio','San Luis','Santa Cruz de Flores','Zúñiga'],
    'LIMA|CANTA':['Canta','Arahuay','Huamantanga','Huaros','Lachaqui','San Buenaventura','Santa Rosa de Quives'],
    'LIMA|HUARAL':['Huaral','Atavillos Alto','Atavillos Bajo','Aucallama','Chancay','Ihuarí','Lampián','Pacaraos','San Miguel de Acos','Santa Cruz de Andamarca','Sumbilca','Veintisiete de Noviembre'],
    'LIMA|HUAROCHIRI':['Matucana','Antioquía','Callahuanca','Carampoma','Chicla','Cuenca','Huachupampa','Huanza','Huarochirí','Lahuaytambo','Langa','Laraos','Mariatana','Ricardo Palma','San Andrés de Tupicocha','San Antonio','San Bartolomé','San Damián','San Juan de Iris','San Juan de Tantaranche','San Lorenzo de Quinti','San Mateo','San Mateo de Otao','San Pedro de Casta','San Pedro de Huancayre','Sangallaya','Santa Cruz de Cocachacra','Santa Eulalia','Santiago de Anchucaya','Santiago de Tuna','Santo Domingo de los Olleros','Surco'],
    'LIMA|HUAURA':['Huacho','Ámbar','Caleta de Carquín','Checras','Hualmay','Huaura','Leoncio Prado','Paccho','Santa Leonor','Santa María','Sayán','Végueta'],
    'LIMA|LIMA':['Ancón','Ate','Barranco','Breña','Carabayllo','Chaclacayo','Chorrillos','Cieneguilla','Comas','El Agustino','Independencia','Jesús María','La Molina','La Victoria','Lima','Lince','Los Olivos','Lurigancho-Chosica','Lurín','Magdalena del Mar','Miraflores','Pachacámac','Pucusana','Pueblo Libre','Puente Piedra','Punta Hermosa','Punta Negra','Rímac','San Bartolo','San Borja','San Isidro','San Juan de Lurigancho','San Juan de Miraflores','San Luis','San Martín de Porres','San Miguel','Santa Anita','Santa María del Mar','Santa Rosa','Santiago de Surco','Surquillo','Villa El Salvador','Villa María del Triunfo'],
    'LIMA|OYON':['Oyón','Andajes','Caujul','Cochamarca','Naván','Pachangara'],
    'LIMA|YAUYOS':['Yauyos','Alis','Allauca','Ayavirí','Azángaro','Cacra','Carania','Catahuasi','Chocos','Cochas','Colonia','Hongos','Huampará','Huancaya','Huangáscar','Huantán','Huañec','Laraos','Lincha','Madeán','Miraflores','Omas','Putinza','Quinches','Quinocay','San Joaquín','San Pedro de Pilas','Tanta','Tauripampa','Tomas','Tupe','Viñac','Vitis'],
    'CALLAO|CALLAO':['Bellavista','Callao','Carmen de la Legua-Reynoso','La Perla','La Punta','Mi Perú','Ventanilla']
  };
  const DOCUMENT_LABELS = {DNI:'DNI',PASSPORT:'Pasaporte',CE:'Carné de extranjería',PTP_CPP:'PTP / CPP',OTHER:'Otro documento'};
  const state = { catalog: [], selectedWorkshop: null };

  function documentNumber(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
  }

  function validateDocument(type, number, person) {
    const normalized = documentNumber(number);
    if (type === 'DNI') {
      if (!/^\d{8}$/.test(normalized)) return `El DNI ${person} debe tener exactamente 8 dígitos.`;
      return '';
    }
    if (normalized.length < 4) return `El número de documento ${person} debe tener al menos 4 caracteres.`;
    return '';
  }

  function configureDocumentInput(typeSelector, inputSelector) {
    const type = W.$(typeSelector).value;
    const input = W.$(inputSelector);
    const isDni = type === 'DNI';
    input.inputMode = isDni ? 'numeric' : 'text';
    input.maxLength = isDni ? 8 : 20;
    input.placeholder = isDni ? '8 dígitos' : 'Número de documento';
    input.value = isDni ? W.digits(input.value).slice(0, 8) : documentNumber(input.value);
  }

  function populateLocations() {
    const department = W.$('#residenceDepartment');
    department.innerHTML = DEPARTMENTS.map(item => `<option value="${W.safe(item)}"${item === 'Lima' ? ' selected' : ''}>${W.safe(item)}</option>`).join('');
    updateProvinceOptions('Lima', 'Lima');
  }

  function updateProvinceOptions(departmentName, preferredProvince = '') {
    const province = W.$('#residenceProvince');
    const other = W.$('#residenceProvinceOther');
    const items = PROVINCES[departmentName] || [];
    province.innerHTML = items.map(item => `<option value="${W.safe(item)}">${W.safe(item)}</option>`).join('') + '<option value="__OTHER__">Otra provincia</option>';
    const selected = items.includes(preferredProvince) ? preferredProvince : (departmentName === 'Lima' ? 'Lima' : items[0] || '__OTHER__');
    province.value = selected;
    const isOther = selected === '__OTHER__';
    other.hidden = !isOther;
    other.disabled = !isOther;
    other.required = isOther;
    updateDistrictOptions(departmentName, currentProvince(), departmentName === 'Lima' && selected === 'Lima' ? 'Pachacámac' : '');
  }

  function currentProvince() {
    const province = W.$('#residenceProvince');
    return province.value === '__OTHER__' ? W.$('#residenceProvinceOther').value.trim() : province.value;
  }

  function updateDistrictOptions(departmentName, provinceName, preferredDistrict = '') {
    const select = W.$('#residenceDistrict');
    const other = W.$('#residenceDistrictOther');
    const key = `${W.normalize(departmentName)}|${W.normalize(provinceName)}`;
    const items = DISTRICTS[key] || [];
    const hasList = items.length > 0;
    select.hidden = !hasList;
    select.disabled = !hasList;
    select.required = hasList;
    other.hidden = hasList;
    other.disabled = hasList;
    other.required = !hasList;
    if (hasList) {
      select.innerHTML = items.map(item => `<option value="${W.safe(item)}">${W.safe(item)}</option>`).join('');
      const selected = items.includes(preferredDistrict) ? preferredDistrict : items[0];
      select.value = selected;
      other.value = '';
    } else {
      select.innerHTML = '';
    }
    updateFeePreview();
  }

  function currentDistrict() {
    return W.$('#residenceDistrict').disabled ? W.$('#residenceDistrictOther').value.trim() : W.$('#residenceDistrict').value;
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
    W.$('#ageHelp').textContent = age == null ? 'La edad se calculará según la fecha de nacimiento.' : 'Edad permitida para la inscripción.';
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
    const guardianType = DOCUMENT_LABELS[W.$('#guardianDocumentType').value] || 'documento';
    const guardianNumber = documentNumber(W.$('#guardianDocumentNumber').value) || '[número de documento]';
    const child = [W.$('#childNames').value.trim(), W.$('#childPaternalSurname').value.trim(), W.$('#childMaternalSurname').value.trim()].filter(Boolean).join(' ') || '[nombre del menor]';
    return `Por intermedio de la presente, yo <strong>${W.safe(guardian)}</strong>, identificado(a) con ${W.safe(guardianType)} <strong>${W.safe(guardianNumber)}</strong>, AUTORIZO bajo mi responsabilidad a mi menor hijo(a) <strong>${W.safe(child)}</strong> a participar de las escuelas y/o talleres municipales, dejando constancia de que se encuentra en perfectas condiciones físicas y psicológicas; asimismo, me comprometo a cumplir y respetar las indicaciones, reglas y disposiciones que se determinen dentro de los mismos. EXONERO DE TODA RESPONSABILIDAD A LA MUNICIPALIDAD DISTRITAL DE PACHACÁMAC.`;
  }

  function updateDeclaration() { W.$('#declarationPreview').innerHTML = declarationText(); }

  function renderWorkshopSelector() {
    const selector = W.$('#workshopSelector');
    selector.innerHTML = state.catalog.map(workshop => `<option value="${W.safe(workshop.workshopId)}">${W.safe(workshop.name)}</option>`).join('');
    const preset = new URLSearchParams(location.search).get('taller');
    const selected = state.catalog.find(item => String(item.workshopId) === String(preset)) || state.catalog[0];
    if (selected) { selector.value = selected.workshopId; selectWorkshop(selected.workshopId); }
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
    data.childDocumentNumber = documentNumber(data.childDocumentNumber);
    data.guardianDocumentNumber = documentNumber(data.guardianDocumentNumber);
    data.guardianPhone = W.digits(data.guardianPhone);
    data.residenceProvince = currentProvince();
    data.residenceDistrict = currentDistrict();
    data.declarationAccepted = W.$('#declarationAccepted').checked;
    delete data.childAge;
    delete data.residenceProvinceOther;
    delete data.residenceDistrictOther;
    return data;
  }

  function validateEnrollment(payload) {
    if (!payload.workshopId) return 'Selecciona uno de los talleres disponibles.';
    if (!updateAge()) return 'La edad del menor debe estar entre 6 y 17 años cumplidos.';
    const childDocumentError = validateDocument(payload.childDocumentType, payload.childDocumentNumber, 'del menor');
    if (childDocumentError) return childDocumentError;
    const guardianDocumentError = validateDocument(payload.guardianDocumentType, payload.guardianDocumentNumber, 'del apoderado');
    if (guardianDocumentError) return guardianDocumentError;
    if (payload.guardianPhone.length < 9) return 'El celular del apoderado no es válido.';
    if (!payload.declarationAccepted) return 'Debes aceptar la declaración jurada para continuar.';
    if (!payload.residenceProvince) return 'Ingresa la provincia de residencia.';
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
    if (validation) { W.showMessage('#enrollmentMessage', 'error', validation); return; }
    W.setButtonBusy(button, true, 'Registrando inscripción…');
    W.showMessage('#enrollmentMessage', 'info', 'Estamos guardando la ficha y generando la orden de pago.');
    try {
      const response = await W.request('createWorkshopEnrollment', payload);
      if (!response?.ok) throw new Error(response?.message || 'No se pudo registrar la inscripción.');
      W.showMessage('#enrollmentMessage', response.warning ? 'info' : 'ok', response.warning || 'Inscripción registrada. Revisa la orden de pago generada.');
      W.openOrderModal(response.order, {
        subtitle: 'La ficha fue registrada. Sigue las instrucciones para realizar el primer pago en caja.',
        accountHref: 'taller-consulta.html'
      });
      const keepWorkshopId = state.selectedWorkshop?.workshopId;
      form.reset();
      populateLocations();
      setBirthDateLimits();
      configureDocumentInput('#childDocumentType', '#childDocumentNumber');
      configureDocumentInput('#guardianDocumentType', '#guardianDocumentNumber');
      W.$('#childAge').value = '';
      updateDeclaration();
      if (keepWorkshopId) { W.$('#workshopSelector').value = keepWorkshopId; selectWorkshop(keepWorkshopId); }
    } catch (error) {
      W.showMessage('#enrollmentMessage', 'error', error.message || String(error));
    } finally { W.setButtonBusy(button, false); }
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
      renderWorkshopSelector(); selector.disabled = false;
    } catch (error) {
      selector.innerHTML = '<option value="">Sin talleres disponibles</option>';
      W.showMessage('#enrollmentMessage', 'error', error.message || String(error));
    }
  }

  function bindEvents() {
    W.$('#workshopSelector').addEventListener('change', event => selectWorkshop(event.target.value));
    W.$('#residenceDepartment').addEventListener('change', event => updateProvinceOptions(event.target.value));
    W.$('#residenceProvince').addEventListener('change', event => {
      const other = W.$('#residenceProvinceOther');
      const isOther = event.target.value === '__OTHER__';
      other.hidden = !isOther; other.disabled = !isOther; other.required = isOther;
      updateDistrictOptions(W.$('#residenceDepartment').value, currentProvince());
    });
    W.$('#residenceProvinceOther').addEventListener('input', () => updateDistrictOptions(W.$('#residenceDepartment').value, currentProvince()));
    W.$('#residenceDistrict').addEventListener('change', updateFeePreview);
    W.$('#residenceDistrictOther').addEventListener('input', updateFeePreview);
    W.$('#birthDate').addEventListener('change', updateAge);
    W.$('#childDocumentType').addEventListener('change', () => configureDocumentInput('#childDocumentType', '#childDocumentNumber'));
    W.$('#guardianDocumentType').addEventListener('change', () => { configureDocumentInput('#guardianDocumentType', '#guardianDocumentNumber'); updateDeclaration(); });
    W.$('#childDocumentNumber').addEventListener('input', event => { event.target.value = event.target.inputMode === 'numeric' ? W.digits(event.target.value).slice(0, 8) : documentNumber(event.target.value); });
    W.$('#guardianDocumentNumber').addEventListener('input', event => { event.target.value = event.target.inputMode === 'numeric' ? W.digits(event.target.value).slice(0, 8) : documentNumber(event.target.value); updateDeclaration(); });
    ['guardianFullName','childNames','childPaternalSurname','childMaternalSurname'].forEach(id => W.$(`#${id}`).addEventListener('input', updateDeclaration));
    W.$('#guardianPhone').addEventListener('input', event => { event.target.value = W.digits(event.target.value).slice(0, 15); });
    W.$('#workshopEnrollmentForm').addEventListener('submit', submitEnrollment);
    W.bindModal();
  }

  document.addEventListener('DOMContentLoaded', () => {
    populateLocations(); setBirthDateLimits();
    configureDocumentInput('#childDocumentType', '#childDocumentNumber');
    configureDocumentInput('#guardianDocumentType', '#guardianDocumentNumber');
    updateDeclaration(); updateFeePreview(); bindEvents(); loadCatalog();
  });
})();
