let dashboard = null;
let selectedMatch = null;
let starters = [];
let substitutes = [];

document.addEventListener('DOMContentLoaded', async () => {
  const session = MF.requireRole(['entrenador']);
  if (!session) return;
  const res = await MF.call('getCoachDashboard', { teamId: session.teamId });
  dashboard = res;
  renderCoach(session, res);
  document.querySelectorAll('[data-panel-link]').forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('[data-panel-link]').forEach(a=>a.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    document.getElementById(`panel-${link.dataset.panelLink}`).classList.add('active');
  }));
});

function renderCoach(session, data){
  coachWelcome.innerHTML = `<h2>${data.team.name}</h2><p class="sub">Categoría ${MF.categoryLabel(data.team.category)} · Grupo ${data.team.group}. Sesión: ${session.name}</p>`;
  renderProfile(data);
  renderPlayers(data);
  renderConvocations(data);
}

function renderProfile(data){
  const cats = (data.categories || []).map(c => `<label style="display:flex;gap:8px;align-items:center;margin:0"><input type="checkbox" value="${c.id}" ${c.id===data.team.category?'checked':''}> ${c.label}</label>`).join('');
  document.getElementById('panel-perfil').innerHTML = `<h2>Perfil del equipo</h2>
    <form id="teamForm" class="card">
      <div class="form-grid">
        <div><label>Nombre del equipo</label><input id="teamName" value="${data.team.name}"></div>
        <div><label>Razón social / academia</label><input id="businessName" placeholder="Opcional"></div>
        <div><label>Dirección</label><input id="address" placeholder="Dirección del club o academia"></div>
        <div><label>WhatsApp</label><input id="whatsapp" placeholder="+51 999 999 999"></div>
        <div><label>Correo</label><input id="email" type="email" placeholder="correo@ejemplo.com"></div>
      </div>
      <h3>Categorías que maneja</h3>
      <div class="grid grid-3">${cats}</div>
      <button class="btn btn-primary" style="margin-top:18px">Guardar perfil</button>
    </form>`;
  teamForm.addEventListener('submit', async e => {e.preventDefault(); const res = await MF.call('saveTeamProfile', {}, 'POST'); MF.toast(res.message || 'Guardado');});
}

function renderPlayers(data){
  document.getElementById('panel-jugadores').innerHTML = `<div class="section-head"><div><h2>Nómina general de jugadores</h2><p class="sub">Registra jugadores con DNI, fecha de nacimiento y foto. La foto puede subirse a <b>assets/img/jugadores/</b> con nombre DNI.png si trabajas en GitHub.</p></div></div>
  <form id="playerForm" class="card form-grid three" style="margin-bottom:20px">
    <div><label>Nombres</label><input id="firstName" required></div>
    <div><label>Apellidos</label><input id="lastName" required></div>
    <div><label>DNI</label><input id="dni" required></div>
    <div><label>Fecha de nacimiento</label><input id="birthDate" type="date" required></div>
    <div><label>Categoría</label><select id="playerCategory">${data.categories.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}</select></div>
    <div><label>Foto</label><input id="photo" type="file" accept="image/png,image/jpeg"></div>
    <button class="btn btn-primary">Registrar jugador</button>
  </form>
  <div class="player-grid" id="playerCards">${data.players.map(playerCard).join('')}</div>`;
  playerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = { firstName:firstName.value, lastName:lastName.value, dni:dni.value, birthDate:birthDate.value, category:playerCategory.value };
    const res = await MF.call('savePlayer', payload, 'POST');
    MF.toast(res.message || 'Jugador guardado');
    playerForm.reset();
  });
}

function renderConvocations(data){
  const matchCards = data.matches.map(m => `<article class="card">
    <span class="chip">${m.dateLabel} · ${m.time}</span>
    <h3>${m.home} vs ${m.away}</h3>
    <p>${m.field} · ${MF.categoryLabel(m.category)} Grupo ${m.group}</p>
    <button class="btn btn-primary" data-open-match="${m.id}">Abrir convocatoria</button>
  </article>`).join('');
  document.getElementById('panel-convocatoria').innerHTML = `<h2>Próximos partidos</h2><p class="sub">Elige titulares y suplentes para el partido seleccionado.</p><div class="grid grid-3">${matchCards}</div><div id="convocationBox" style="margin-top:24px"></div>`;
  document.querySelectorAll('[data-open-match]').forEach(btn => btn.addEventListener('click', () => openConvocation(btn.dataset.openMatch)));
}

function openConvocation(matchId){
  selectedMatch = dashboard.matches.find(m => m.id === matchId);
  starters = []; substitutes = [];
  drawConvocation();
}

function drawConvocation(){
  const chosen = new Set([...starters, ...substitutes]);
  const available = dashboard.players.filter(p => !chosen.has(p.id));
  const rules = dashboard.categories.find(c => c.id === selectedMatch.category) || {};
  convocationBox.innerHTML = `<div class="card">
    <span class="chip gold">${selectedMatch.dateLabel} · ${selectedMatch.time} · ${selectedMatch.field}</span>
    <h2>${selectedMatch.home} vs ${selectedMatch.away}</h2>
    <p class="sub">Titulares requeridos: ${rules.fieldPlayers || 7}. Mínimo para iniciar: ${rules.minPlayers || 5}.</p>
    <div class="form-grid">
      <div><label>Jugador disponible</label><select id="playerPick">${available.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName} · DNI ${p.dni}</option>`).join('')}</select></div>
      <div><label>Tipo</label><select id="playerType"><option value="titular">Titular</option><option value="suplente">Suplente</option></select></div>
    </div>
    <button class="btn btn-primary" id="addPlayerBtn" style="margin-top:14px">Agregar al partido</button>
    <div class="split" style="margin-top:20px">
      <div><h3>Titulares (${starters.length})</h3><div class="pick-list">${starters.map(id => pickItem(id,'titular')).join('') || '<p class="sub">Sin titulares.</p>'}</div></div>
      <div><h3>Suplentes (${substitutes.length})</h3><div class="pick-list">${substitutes.map(id => pickItem(id,'suplente')).join('') || '<p class="sub">Sin suplentes.</p>'}</div></div>
    </div>
    <button class="btn btn-dark" id="saveConvocationBtn" style="margin-top:20px">Guardar convocatoria</button>
  </div>`;
  addPlayerBtn.addEventListener('click', () => {
    const id = playerPick.value;
    if (!id) return MF.toast('No quedan jugadores disponibles.', 'error');
    if (playerType.value === 'titular') starters.push(id); else substitutes.push(id);
    drawConvocation();
  });
  document.querySelectorAll('[data-remove-player]').forEach(btn => btn.addEventListener('click', () => {
    starters = starters.filter(x => x !== btn.dataset.removePlayer);
    substitutes = substitutes.filter(x => x !== btn.dataset.removePlayer);
    drawConvocation();
  }));
  saveConvocationBtn.addEventListener('click', async () => {
    const payload = { matchId:selectedMatch.id, starters, substitutes };
    const res = await MF.call('saveConvocation', payload, 'POST');
    MF.toast(res.message || 'Convocatoria enviada');
  });
}

function pickItem(id, type){
  const p = dashboard.players.find(x => x.id === id);
  return `<div class="pick-item"><span><b>${p.firstName} ${p.lastName}</b><br><small>DNI ${p.dni}</small></span><button class="btn btn-danger" data-remove-player="${id}">Quitar</button></div>`;
}

function playerCard(p){
  return `<article class="player-card"><img class="avatar" src="${MF.imgForPlayer(p)}" onerror="this.style.display='none'"><div><b>${p.firstName} ${p.lastName}</b><br><small>DNI: ${p.dni}</small><br><small>Nac.: ${p.birthDate}</small><br><span class="status ${p.status}">${p.status}</span></div></article>`;
}
