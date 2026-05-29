document.addEventListener('DOMContentLoaded', async () => {
  const session = MF.requireRole(['admin']);
  if (!session) return;
  const res = await MF.call('getAdminDashboard');
  renderAdmin(session, res);
  document.querySelectorAll('[data-panel-link]').forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('[data-panel-link]').forEach(a=>a.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    document.getElementById(`panel-${link.dataset.panelLink}`).classList.add('active');
  }));
});
function renderAdmin(session, data){
  adminWelcome.innerHTML = `<h2>Bienvenido, ${session.name}</h2><p class="sub">Panel de consulta y gestión rápida. Las modificaciones principales se pueden mantener desde Google Sheets.</p>`;
  document.getElementById('panel-resumen').innerHTML = `<div class="grid grid-4">
    ${[['Equipos',data.teams.length],['Partidos',data.fixture.length],['Jugadores',data.players.length],['Convocatorias',data.convocations.length],['Accesos',(data.users||[]).length]].map(x=>`<div class="card metric"><span class="chip">${x[0]}</span><strong>${x[1]}</strong></div>`).join('')}
  </div>`;
  document.getElementById('panel-equipos').innerHTML = `<h2>Equipos registrados</h2><div class="table-wrap"><table><thead><tr><th>ID</th><th>Equipo</th><th>Categoría</th><th>Grupo</th></tr></thead><tbody>${data.teams.map(t=>`<tr><td>${t.id}</td><td><b>${t.name}</b></td><td>${MF.categoryLabel(t.category)}</td><td>${t.group}</td></tr>`).join('')}</tbody></table></div>`;
  document.getElementById('panel-jugadores').innerHTML = `<h2>Jugadores registrados</h2><div class="player-grid">${data.players.map(playerCard).join('')}</div>`;
  document.getElementById('panel-resultados').innerHTML = `<h2>Cargar resultado rápido</h2><form id="resultForm" class="card form-grid three">
    <div><label>Partido</label><select id="matchId">${data.fixture.map(m=>`<option value="${m.id}">${m.id} · ${m.home} vs ${m.away}</option>`).join('')}</select></div>
    <div><label>Goles local</label><input id="homeScore" type="number" min="0" value="0"></div>
    <div><label>Goles visita</label><input id="awayScore" type="number" min="0" value="0"></div>
    <button class="btn btn-primary" type="submit">Guardar resultado</button>
  </form>`;
  document.getElementById('resultForm').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = { matchId: matchId.value, homeScore: homeScore.value, awayScore: awayScore.value };
    const res = await MF.call('saveResult', payload, 'POST');
    MF.toast(res.message || 'Resultado guardado');
  });
  document.getElementById('panel-convocatorias').innerHTML = `<h2>Convocatorias recibidas</h2><div class="card"><p class="sub">Aquí aparecerán las convocatorias enviadas por entrenadores desde el panel.</p></div>`;
  document.getElementById('panel-accesos').innerHTML = `<h2>Accesos de entrenadores</h2><p class="sub">El login se realiza con correo electrónico y clave temporal.</p><div class="table-wrap"><table><thead><tr><th>Entrenador</th><th>Correo/Login</th><th>Clave temporal</th><th>Equipo</th><th>Estado</th></tr></thead><tbody>${(data.users||[]).filter(u=>u.role==='entrenador').map(u=>`<tr><td><b>${u.name}</b></td><td>${u.email || u.username}</td><td><code>${u.password}</code></td><td>${u.teamName || u.teamId || ''}</td><td>${u.status || 'activo'}</td></tr>`).join('')}</tbody></table></div>`;
}
function playerCard(p){
  return `<article class="player-card"><img class="avatar" src="${MF.imgForPlayer(p)}" onerror="this.style.display='none'"><div><b>${p.firstName} ${p.lastName}</b><br><small>DNI: ${p.dni}</small><br><small>${p.category} · ${p.status}</small></div></article>`;
}
