let dashboard = null;
let localPlayers = [];
let selectedMatch = null;
let starters = [];
let substitutes = [];
let convocationState = {};

const OPEN_ROUND = 3;

const $ = (id) => document.getElementById(id);

function normalizePlayer(p){
  const cats = Array.isArray(p.categories) ? p.categories : (typeof p.categories === 'string' ? p.categories.split(',').map(x => x.trim()).filter(Boolean) : (p.category ? [p.category] : []));
  return { ...p, categories: cats }; 
}

document.addEventListener('DOMContentLoaded', async () => {
  const session = MF.requireRole(['entrenador']);
  if (!session) return;
  const res = await MF.call('getCoachDashboard', { teamId: session.teamId });
  dashboard = res;
  localPlayers = (res.players || []).map(normalizePlayer);
  convocationState = JSON.parse(localStorage.getItem('mf_convocations_demo') || '{}');
  renderCoach(session, res);
  bindDashboardNav();
});

function bindDashboardNav(){
  document.querySelectorAll('[data-panel-link]').forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('[data-panel-link]').forEach(a=>a.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    const panel = $(`panel-${link.dataset.panelLink}`);
    if (panel) panel.classList.add('active');
  }));
  document.querySelectorAll('[data-toggle-submenu]').forEach(btn => btn.addEventListener('click', () => {
    const menu = $(`submenu-${btn.dataset.toggleSubmenu}`);
    if (menu) menu.classList.toggle('open');
  }));
}

function renderCoach(session, data){
  $('sidebarCoachName').textContent = session.name || 'Entrenador';
  $('sidebarTeamName').textContent = data.team.name;
  $('coachWelcome').innerHTML = `<div class="welcome-card__content"><div><span class="chip gold">Panel entrenador</span><h2>${data.team.name}</h2><p class="sub">Bienvenido, <b>${session.name || session.username}</b>. Gestiona perfil, jugadores y convocatorias del equipo.</p></div><a class="btn btn-light" href="campeonato-futbol-menores-2026.html">Ver campeonato</a></div>`;
  renderProfile(data, false);
  renderPlayers(data);
  renderChampionships(data);
  renderUpcoming(data);
  renderConvocations(data);
}

function enabledCategories(){
  const value = dashboard.team.enabledCategories || dashboard.team.categories || dashboard.team.category;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(x => x.trim()).filter(Boolean);
  return [dashboard.team.category].filter(Boolean);
}

function renderProfile(data, editMode){
  const catLabels = (data.categories || []).filter(c => enabledCategories().includes(c.id)).map(c => `<span class="chip">${c.label}</span>`).join('');
  if (!editMode) {
    $('panel-perfil').innerHTML = `<div class="section-head"><div><h2>Perfil de equipo</h2><p class="sub">Información registrada del club o academia. Presiona editar para modificar datos.</p></div><button class="btn btn-primary" id="editProfileBtn">Editar perfil</button></div>
      <div class="card profile-display">
        <div class="team-badge-box"><img src="assets/img/${data.team.badgeFileName || 'logo-placeholder.svg'}" alt="Insignia del equipo"></div>
        <div>
          <div class="info-grid">
            <div class="info-item"><small>Equipo</small><strong>${data.team.name}</strong></div>
            <div class="info-item"><small>Razón social</small><strong>${data.team.businessName || 'No registrado'}</strong></div>
            <div class="info-item"><small>Dirección</small><strong>${data.team.address || 'No registrado'}</strong></div>
            <div class="info-item"><small>WhatsApp</small><strong>${data.team.whatsapp || 'No registrado'}</strong></div>
            <div class="info-item"><small>Correo</small><strong>${data.team.email || 'No registrado'}</strong></div>
            <div class="info-item"><small>Categorías habilitadas</small><div class="pill-row" style="margin-top:8px">${catLabels}</div></div>
          </div>
        </div>
      </div>`;
    $('editProfileBtn').addEventListener('click', () => renderProfile(data, true));
    return;
  }

  const cats = (data.categories || []).map(c => `<label class="category-check"><input type="checkbox" value="${c.id}" ${enabledCategories().includes(c.id)?'checked':''}> ${c.label}</label>`).join('');
  $('panel-perfil').innerHTML = `<div class="section-head"><div><h2>Editar perfil de equipo</h2><p class="sub">Actualiza la información institucional y categorías habilitadas.</p></div><button class="btn btn-light" id="cancelProfileBtn">Cancelar</button></div>
    <form id="teamForm" class="card">
      <div class="form-grid">
        <div><label>Nombre del equipo</label><input id="teamName" value="${data.team.name || ''}"></div>
        <div><label>Razón social / academia</label><input id="businessName" value="${data.team.businessName || ''}"></div>
        <div><label>Dirección</label><input id="address" value="${data.team.address || ''}"></div>
        <div><label>WhatsApp</label><input id="whatsapp" value="${data.team.whatsapp || ''}"></div>
        <div><label>Correo</label><input id="email" type="email" value="${data.team.email || ''}"></div>
        <div><label>Insignia del equipo</label><input id="badge" type="file" accept="image/png,image/jpeg,image/svg+xml"><small class="sub mini">En GitHub puedes subirla a assets/img/</small></div>
      </div>
      <h3>Categorías habilitadas</h3>
      <div class="category-checks">${cats}</div>
      <button class="btn btn-primary" style="margin-top:18px">Guardar perfil</button>
    </form>`;
  $('cancelProfileBtn').addEventListener('click', () => renderProfile(data, false));
  $('teamForm').addEventListener('submit', async e => {
    e.preventDefault();
    const selected = [...document.querySelectorAll('#teamForm .category-check input:checked')].map(i => i.value);
    dashboard.team = {...dashboard.team, name:teamName.value, businessName:businessName.value, address:address.value, whatsapp:whatsapp.value, email:email.value, enabledCategories:selected};
    const res = await MF.call('saveTeamProfile', dashboard.team, 'POST');
    MF.toast(res.message || 'Perfil guardado');
    renderProfile(dashboard, false);
  });
}

function renderPlayers(data){
  const maxReached = localPlayers.length >= 15;
  $('panel-jugadores').innerHTML = `<div class="section-head"><div><h2>Jugadores</h2><p class="sub">Registra hasta 15 jugadores. La categoría elegible se calcula desde la fecha de nacimiento.</p></div><span class="player-count">${localPlayers.length}/15 jugadores registrados</span></div>
  <form id="playerForm" class="card form-grid three" style="margin-bottom:20px">
    <div><label>Nombres</label><input id="firstName" required ${maxReached?'disabled':''}></div>
    <div><label>Apellidos</label><input id="lastName" required ${maxReached?'disabled':''}></div>
    <div><label>DNI</label><input id="dni" required ${maxReached?'disabled':''}></div>
    <div><label>Fecha de nacimiento</label><input id="birthDate" type="date" required ${maxReached?'disabled':''}></div>
    <div><label>Categorías elegibles</label><div id="playerCategoryChecks" class="category-checks"><small class="future-note">Ingresa fecha de nacimiento.</small></div></div>
    <div><label>Foto del jugador</label><input id="photo" type="file" accept="image/png,image/jpeg" ${maxReached?'disabled':''}><small class="sub mini">Recomendado: DNI.png en assets/img/jugadores/</small></div>
    <button class="btn btn-primary" ${maxReached?'disabled':''}>Registrar jugador</button>
  </form>
  <div class="player-grid" id="playerCards">${localPlayers.map(playerCard).join('')}</div>`;
  if (maxReached) return;
  $('birthDate').addEventListener('change', renderEligibleCategoryChecks);
  $('playerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const selectedCats = [...document.querySelectorAll('#playerCategoryChecks input:checked')].map(i => i.value);
    if (!selectedCats.length) return MF.toast('Selecciona al menos una categoría elegible.', 'error');
    if (localPlayers.length >= 15) return MF.toast('Máximo 15 jugadores por equipo.', 'error');
    const payload = { id:`LOCAL-${Date.now()}`, teamId:dashboard.team.id, teamName:dashboard.team.name, firstName:firstName.value, lastName:lastName.value, dni:dni.value, birthDate:birthDate.value, categories:selectedCats, category:selectedCats[0], photoFileName:`${dni.value}.png` };
    const res = await MF.call('savePlayer', payload, 'POST');
    localPlayers.push(payload);
    MF.toast(res.message || 'Jugador guardado');
    renderPlayers(dashboard);
  });
}

function renderEligibleCategoryChecks(){
  const birthDate = $('birthDate').value;
  const eligible = MF.eligibleCategoriesForBirthDate(birthDate).filter(c => enabledCategories().includes(c.id));
  $('playerCategoryChecks').innerHTML = eligible.length ? eligible.map(c => `<label class="category-check"><input type="checkbox" value="${c.id}" checked> ${c.label}</label>`).join('') : '<small class="future-note">No hay categorías habilitadas para esa fecha.</small>';
}

function renderChampionships(data){
  const championships = data.championships || [{name:'Torneo Municipal de Fútbol de Menores 2026', status:'Activo'}];
  $('panel-campeonatos').innerHTML = `<h2>Mis campeonatos</h2><p class="sub">Campeonatos asociados a tu equipo.</p>${championships.map(ch => `<div class="champ-mini"><span>⚽</span><div><b>${ch.name}</b><br><small>${ch.status || 'Activo'}</small></div><a class="btn btn-light" href="${ch.url || '#'}">Abrir</a></div>`).join('')}`;
}

function renderUpcoming(data){
  $('panel-proximos').innerHTML = `<h2>Próximos partidos</h2><p class="sub">La convocatoria solo se habilita para la siguiente fecha disponible.</p><div class="grid grid-3">${matchCards(data.matches || []).join('')}</div>`;
}

function renderConvocations(data){
  $('panel-convocatorias').innerHTML = `<h2>Convocatorias</h2><p class="sub">Abre la convocatoria habilitada, elige titulares y suplentes, y guarda.</p><div class="grid grid-3">${matchCards(data.matches || []).join('')}</div>`;
  bindMatchButtons();
}

function matchCards(matches){
  return matches.filter(m => Number(m.round) >= OPEN_ROUND).map(m => {
    const saved = convocationState[m.id];
    const canOpen = Number(m.round) === OPEN_ROUND;
    const isFuture = Number(m.round) > OPEN_ROUND;
    const cls = saved ? 'convocado' : (canOpen ? '' : 'disabled');
    const btnLabel = saved ? 'Editar convocatoria' : 'Abrir convocatoria';
    return `<article class="card match-card ${cls}">
      <span class="chip ${saved?'':'gold'}">${saved ? 'Convocado' : `Fecha ${m.round}`}</span>
      <h3>${m.home} vs ${m.away}</h3>
      <p>${m.dateLabel || 'Por programar'} · ${m.time || '--:--'} · ${m.field || 'Campo por confirmar'}</p>
      <p class="future-note">${MF.categoryLabel(m.category)} · Grupo ${m.group}</p>
      <div class="match-card-footer">
        ${canOpen || saved ? `<button class="btn btn-primary" data-open-convocation="${m.id}">${btnLabel}</button>` : `<button class="btn btn-light" disabled>No habilitado</button>`}
        ${isFuture ? '<small class="future-note">Se habilitará en la siguiente fecha.</small>' : ''}
      </div>
    </article>`;
  });
}

function bindMatchButtons(){
  document.querySelectorAll('[data-open-convocation]').forEach(btn => btn.addEventListener('click', () => openConvocation(btn.dataset.openConvocation)));
}

function openConvocation(matchId){
  selectedMatch = dashboard.matches.find(m => m.id === matchId);
  const saved = convocationState[matchId];
  starters = saved?.starters || [];
  substitutes = saved?.substitutes || [];
  drawConvocationModal();
}

function drawConvocationModal(){
  const old = $('convocationModal');
  if (old) old.remove();
  const chosen = new Set([...starters, ...substitutes]);
  const available = localPlayers.filter(p => !chosen.has(p.id) && (p.categories || [p.category]).includes(selectedMatch.category));
  const rules = dashboard.categories.find(c => c.id === selectedMatch.category) || {};
  const modal = document.createElement('div');
  modal.className = 'login-modal open';
  modal.id = 'convocationModal';
  modal.innerHTML = `<div class="login-modal__backdrop" data-close-convocation></div>
  <section class="login-modal__panel modal-wide">
    <button class="modal-close" data-close-convocation>×</button>
    <span class="chip gold">${selectedMatch.dateLabel} · ${selectedMatch.time} · ${selectedMatch.field}</span>
    <h2>${selectedMatch.home} vs ${selectedMatch.away}</h2>
    <p class="sub">${MF.categoryLabel(selectedMatch.category)} · Titulares requeridos: ${rules.fieldPlayers || 7}. Mínimo para iniciar: ${rules.minPlayers || 5}.</p>
    <div class="convocation-picker">
      <div class="form-grid">
        <div><label>Jugador disponible</label><select id="playerPick">${available.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName} · DNI ${p.dni}</option>`).join('')}</select></div>
        <div><label>Tipo</label><select id="playerType"><option value="titular">Titular</option><option value="suplente">Suplente</option></select></div>
      </div>
      <button class="btn btn-primary" id="addPlayerBtn" style="margin-top:14px">Agregar al partido</button>
    </div>
    <div class="convocation-modal-layout" style="margin-top:18px">
      <div><h3>Titulares (${starters.length})</h3><div class="pick-list">${starters.map(id => pickItem(id)).join('') || '<p class="sub">Sin titulares.</p>'}</div></div>
      <div><h3>Suplentes (${substitutes.length})</h3><div class="pick-list">${substitutes.map(id => pickItem(id)).join('') || '<p class="sub">Sin suplentes.</p>'}</div></div>
    </div>
    <button class="btn btn-dark full" id="saveConvocationBtn">Guardar convocatoria</button>
  </section>`;
  document.body.appendChild(modal);
  document.querySelectorAll('[data-close-convocation]').forEach(el => el.addEventListener('click', () => modal.remove()));
  $('addPlayerBtn').addEventListener('click', () => {
    const id = $('playerPick').value;
    if (!id) return MF.toast('No quedan jugadores disponibles para esta categoría.', 'error');
    if ($('playerType').value === 'titular') starters.push(id); else substitutes.push(id);
    drawConvocationModal();
  });
  document.querySelectorAll('[data-remove-player]').forEach(btn => btn.addEventListener('click', () => {
    starters = starters.filter(x => x !== btn.dataset.removePlayer);
    substitutes = substitutes.filter(x => x !== btn.dataset.removePlayer);
    drawConvocationModal();
  }));
  $('saveConvocationBtn').addEventListener('click', async () => {
    const payload = { matchId:selectedMatch.id, starters, substitutes };
    const res = await MF.call('saveConvocation', payload, 'POST');
    convocationState[selectedMatch.id] = payload;
    localStorage.setItem('mf_convocations_demo', JSON.stringify(convocationState));
    MF.toast(res.message || 'Convocatoria enviada');
    modal.remove();
    renderUpcoming(dashboard);
    renderConvocations(dashboard);
  });
}

function pickItem(id){
  const p = localPlayers.find(x => x.id === id);
  if (!p) return '';
  return `<div class="player-mini"><span><b>${p.firstName} ${p.lastName}</b><br><small>DNI ${p.dni}</small></span><button class="btn btn-danger" data-remove-player="${id}">Quitar</button></div>`;
}

function playerCard(p){
  const cats = (p.categories || [p.category]).map(MF.categoryLabel).join(', ');
  return `<article class="player-card">
    <img class="avatar" src="${MF.imgForPlayer(p)}" onerror="this.src='assets/img/logo-placeholder.svg'">
    <div class="player-meta"><b>${p.firstName} ${p.lastName}</b><small>DNI: ${p.dni}</small><small>Nac.: ${p.birthDate}</small><span class="category-pill">${cats}</span></div>
  </article>`;
}
