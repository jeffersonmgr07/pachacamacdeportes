(function(){
  let adminData = { users:[], trainers:[], teams:[], players:[], fixture:[], categories:[], referees:[], matchReferees:[], matchEvents:[] };

  const $ = (sel) => document.querySelector(sel);
  const safe = (value) => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const lower = (value) => String(value || '').toLowerCase().trim();
  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

  function getTeamName(team){ return team?.teamName || team?.name || team?.equipo || team?.club || ''; }
  function getTeamId(team){ return team?.teamId || team?.id || team?.equipoId || ''; }
  function getPlayerName(player){ return player?.fullName || [player?.firstName, player?.lastName].filter(Boolean).join(' ') || player?.nombre || ''; }
  function getPlayerTeamName(player){ return player?.teamName || player?.equipo || teamNameById(player?.teamId) || ''; }
  function getPlayerCategories(player){ return player?.categories || player?.category || player?.categoria || ''; }
  function splitCategories(value){ return String(value || '').split(',').map(x=>x.trim()).filter(Boolean); }
  function categoryWidgets(value){ const cats = splitCategories(value); return cats.length ? cats.map(c=>`<span class="badge badge-blue admin-category-widget">${safe(c)}</span>`).join(' ') : '<span class="admin-muted">No registrado</span>'; }
  function getMatchDate(match){ return match?.matchDate || match?.date || match?.fecha || ''; }
  function getMatchDateLabel(match){ return match?.dateLabel || match?.fechaTexto || ''; }
  function getMatchRound(match){ return match?.round || match?.fecha || ''; }
  function getMatchTeams(match){ return [match?.home || match?.local || '', match?.away || match?.visitante || '']; }
  function getMatchCategory(match){ return match?.category || match?.categoria || ''; }
  function getMatchStatus(match){ return match?.status || match?.estado || 'programado'; }
  function teamNameById(teamId){
    const id = String(teamId || '').trim();
    if(!id) return '';
    const team = (adminData.teams || []).find(t => String(getTeamId(t)) === id);
    return getTeamName(team);
  }

  function formatDate(value, label){
    const raw = String(value || '').trim();
    if(label && !/^\d{4}-\d{2}-\d{2}/.test(raw)) return label;
    if(!raw) return label || 'Fecha por definir';
    const parts = raw.slice(0,10).split('-');
    if(parts.length !== 3) return label || raw;
    const [y,m,d] = parts.map(Number);
    if(!y || !m || !d) return label || raw;
    return `${String(d).padStart(2,'0')}.${String(m).padStart(2,'0')}.${y}`;
  }

  function roundText(match){
    let round = String(getMatchRound(match) || '').trim();
    if(/^\d+$/.test(round)) round = 'Fecha ' + round;
    const date = formatDate(getMatchDate(match), getMatchDateLabel(match));
    if(round && date && !normalize(date).includes(normalize(round))) return `${round} - ${date}`;
    return round || date || 'Fecha por definir';
  }

  function formatStatus(status){
    const s = normalize(status || 'programado');
    if(s === 'en_juego') return 'En juego';
    if(s === 'jugado') return 'Jugado';
    if(s === 'finalizado') return 'Finalizado';
    if(['wo','w.o','walkover','bwo'].includes(s)) return 'Walkover';
    return String(status || 'Programado').replace(/_/g,' ').replace(/^./, c => c.toUpperCase());
  }

  function statusClass(status){
    const s = normalize(status || 'programado');
    if(s === 'jugado' || s === 'finalizado') return 'badge-green';
    if(s === 'en_juego') return 'badge-gold';
    if(['wo','walkover','bwo'].includes(s)) return 'badge-red';
    return 'badge-blue';
  }

  function filteredData(){
    const q = normalize($('#adminSearch')?.value || '');
    const teamFilter = $('#adminTeamFilter')?.value || '';
    const categoryFilter = $('#adminCategoryFilter')?.value || '';
    const teamMatchesFilter = (teamName, teamId) => !teamFilter || String(teamId || '') === teamFilter || getTeamIdByName(teamName) === teamFilter;
    const categoryMatchesFilter = (value) => !categoryFilter || normalize(value).includes(normalize(categoryFilter));
    const matchesSearch = (obj) => !q || normalize(Object.values(obj || {}).join(' ')).includes(q);

    const teams = (adminData.teams || []).filter(t => {
      const teamName = getTeamName(t);
      const trainer = trainerForTeam(getTeamId(t), teamName);
      return teamMatchesFilter(teamName, getTeamId(t)) && matchesSearch({...t, trainerName:trainer?.fullName, trainerEmail:trainer?.email});
    });
    const players = (adminData.players || []).filter(p => teamMatchesFilter(getPlayerTeamName(p), p.teamId) && categoryMatchesFilter(getPlayerCategories(p)) && matchesSearch(p));
    const fixture = (adminData.fixture || []).filter(m => {
      const [home, away] = getMatchTeams(m);
      const teamOk = !teamFilter || getTeamIdByName(home) === teamFilter || getTeamIdByName(away) === teamFilter;
      return teamOk && categoryMatchesFilter(getMatchCategory(m)) && matchesSearch(m);
    });
    const users = (adminData.users || []).filter(u => teamMatchesFilter(u.teamName, u.teamId) && matchesSearch(u));
    return {teams, players, fixture, users};
  }

  function getTeamIdByName(teamName){
    const name = normalize(teamName);
    const team = (adminData.teams || []).find(t => normalize(getTeamName(t)) === name);
    return team ? String(getTeamId(team)) : '';
  }

  function trainerForTeam(teamId, teamName){
    return (adminData.trainers || []).find(t => String(t.teamId || '') === String(teamId || '') || normalize(t.teamName) === normalize(teamName)) || {};
  }

  function playersForTeam(teamId, teamName){
    return (adminData.players || []).filter(p => String(p.teamId || '') === String(teamId || '') || normalize(getPlayerTeamName(p)) === normalize(teamName));
  }

  function matchesForTeam(teamName){
    const name = normalize(teamName);
    return (adminData.fixture || []).filter(m => {
      const [home, away] = getMatchTeams(m);
      return normalize(home) === name || normalize(away) === name;
    });
  }

  function uniqueCategories(){
    const values = new Set();
    [...(adminData.categories || []).map(c => c.name || c.label), ...(adminData.players || []).map(getPlayerCategories), ...(adminData.fixture || []).map(getMatchCategory)]
      .join(',').split(',').map(x => x.trim()).filter(Boolean).forEach(x => values.add(x));
    return [...values].sort((a,b)=>a.localeCompare(b));
  }

  function populateFilters(){
    const teamSelect = $('#adminTeamFilter');
    const catSelect = $('#adminCategoryFilter');
    if(teamSelect){
      const teams = [...(adminData.teams || [])].sort((a,b)=>getTeamName(a).localeCompare(getTeamName(b)));
      teamSelect.innerHTML = '<option value="">Todos los equipos</option>' + teams.map(t=>`<option value="${safe(getTeamId(t))}">${safe(getTeamName(t))}</option>`).join('');
    }
    if(catSelect){
      catSelect.innerHTML = '<option value="">Todas las categorías</option>' + uniqueCategories().map(c=>`<option value="${safe(c)}">${safe(c)}</option>`).join('');
    }
    ['playerTeamFilter','matchTeamFilter'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.innerHTML = teamSelect ? teamSelect.innerHTML : '<option value="">Todos los equipos</option>';
    });
    ['playerCategoryFilter','matchCategoryFilter'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.innerHTML = catSelect ? catSelect.innerHTML : '<option value="">Todas las categorías</option>';
    });
  }

  function syncInlineFilters(){
    const pairs = [['playerTeamFilter','adminTeamFilter'],['matchTeamFilter','adminTeamFilter'],['playerCategoryFilter','adminCategoryFilter'],['matchCategoryFilter','adminCategoryFilter']];
    pairs.forEach(([copy,mainId]) => {
      const el = document.getElementById(copy);
      const main = document.getElementById(mainId);
      if(el && main && el.value !== main.value) el.value = main.value;
    });
  }

  function renderSummary(){
    const data = filteredData();
    $('#adminSummary').innerHTML = `
      <div class="card admin-stat"><div class="stat-number">${data.teams.length}</div><div class="stat-label">Equipos</div></div>
      <div class="card admin-stat"><div class="stat-number">${data.players.length}</div><div class="stat-label">Jugadores</div></div>
      <div class="card admin-stat"><div class="stat-number">${data.fixture.length}</div><div class="stat-label">Partidos</div></div>
      <div class="card admin-stat"><div class="stat-number">${data.fixture.filter(m => normalize(getMatchStatus(m)) === 'en_juego').length}</div><div class="stat-label">En juego</div></div>`;
  }

  function renderTeams(){
    const data = filteredData();
    const grid = $('#adminTeamsGrid');
    if(!data.teams.length){ grid.innerHTML = emptyState('No se encontraron equipos con esos filtros.'); return; }
    grid.innerHTML = data.teams.map(team => {
      const teamName = getTeamName(team);
      const teamId = getTeamId(team);
      const trainer = trainerForTeam(teamId, teamName);
      const players = playersForTeam(teamId, teamName);
      const matches = matchesForTeam(teamName);
      const played = matches.filter(m => normalize(getMatchStatus(m)) === 'jugado').length;
      return `<article class="card admin-team-card">
        <div class="admin-team-head">
          <img src="${safe(teamLogoPath(teamName, teamId))}" alt="${safe(teamName)}" onerror="this.src='assets/img/logo-placeholder.svg'">
          <div><h3>${safe(teamName || 'Equipo sin nombre')}</h3><p>${safe(teamId || '')}</p></div>
        </div>
        <div class="admin-metrics">
          <span><strong>${players.length}</strong> jugadores</span>
          <span><strong>${matches.length}</strong> partidos</span>
          <span><strong>${played}</strong> jugados</span>
        </div>
        <p><strong>Responsable:</strong> ${safe(trainer.fullName || team.coachName || 'No registrado')}</p>
        <p><strong>Correo:</strong> ${safe(trainer.email || team.email || 'No registrado')}</p>
        <div class="admin-category-widgets"><strong>Categorías:</strong> ${categoryWidgets(team.categories || trainer.categories)}</div>
      </article>`;
    }).join('');
  }

  function renderPlayers(){
    const data = filteredData();
    const body = $('#adminPlayersBody');
    if(!data.players.length){ body.innerHTML = `<tr><td colspan="6">No se encontraron jugadores con esos filtros.</td></tr>`; return; }
    body.innerHTML = data.players.map(p => `<tr>
      <td><strong>${safe(getPlayerName(p))}</strong><br><span class="admin-muted">${safe(p.playerId || '')}</span></td>
      <td>${safe(p.dni || p.document || '')}</td>
      <td>${safe(getPlayerTeamName(p))}</td>
      <td>${categoryWidgets(getPlayerCategories(p))}</td>
      <td>${safe(p.birthDate || p.fechaNacimiento || '')}</td>
      <td><span class="badge badge-green">${safe(p.status || 'activo')}</span></td>
    </tr>`).join('');
  }

  function matchCard(match){
    const [home, away] = getMatchTeams(match);
    const status = normalize(getMatchStatus(match));
    const played = status === 'jugado' || status === 'finalizado';
    const live = status === 'en_juego';
    const score = (played || live) ? `${safe(match.homeScore ?? 0)} - ${safe(match.awayScore ?? 0)}` : 'vs';
    return `<article class="fixture-match-card admin-match-card ${played ? 'played' : ''}">
      <div class="match-meta">
        <span class="badge badge-green">${safe(roundText(match))}</span>
        <span class="badge badge-blue">${safe(getMatchCategory(match) || 'Categoría')}</span>
        <span class="badge badge-gold">${safe(formatTime12(match.time || match.hora || 'Por definir'))}</span>
      </div>
      <div class="match-teams">
        <span>${safe(home || 'Local')}</span>
        <span class="score-line">${score}</span>
        <span class="away">${safe(away || 'Visitante')}</span>
      </div>
      <p>${safe(match.field || match.cancha || 'Campo por definir')} · <span class="badge ${statusClass(getMatchStatus(match))}">${safe(formatStatus(getMatchStatus(match)))}</span></p>
      <div class="actions"><a class="btn btn-primary btn-small" href="arbitro.html?matchId=${encodeURIComponent(match.matchId || match.id || '')}">Iniciar arbitraje</a></div>
    </article>`;
  }

  function renderFixture(){
    const data = filteredData();
    const list = $('#adminFixtureList');
    if(!data.fixture.length){ list.innerHTML = emptyState('No se encontraron partidos con esos filtros.'); return; }
    list.innerHTML = data.fixture.map(matchCard).join('');
  }

  function renderTeamMatches(){
    const data = filteredData();
    const teams = ($('#adminTeamFilter')?.value) ? data.teams : data.teams.slice(0, 12);
    const box = $('#adminTeamMatches');
    if(!teams.length){ box.innerHTML = emptyState('Selecciona o busca un equipo para ver sus partidos.'); return; }
    box.innerHTML = teams.map(team => {
      const teamName = getTeamName(team);
      const matches = data.fixture.filter(m => {
        const [home, away] = getMatchTeams(m);
        return normalize(home) === normalize(teamName) || normalize(away) === normalize(teamName);
      });
      return `<div class="card admin-team-matches-card">
        <div class="section-head compact"><div><h3>${safe(teamName)}</h3><p class="section-subtitle">${matches.length} partido(s) encontrados</p></div></div>
        <div class="grid grid-2">${matches.length ? matches.map(matchCard).join('') : '<p>No tiene partidos con los filtros actuales.</p>'}</div>
      </div>`;
    }).join('');
  }

  function renderAccess(){
    const data = filteredData();
    const body = $('#accessBody');
    if(!data.users.length){ body.innerHTML = `<tr><td colspan="6">No se encontraron accesos con esos filtros.</td></tr>`; return; }
    body.innerHTML = data.users.map((u,index)=>{
      const pass = String(u.password || u.clave || '');
      return `<tr><td>${safe(u.fullName || u.nombre || '')}</td><td>${safe(u.role || u.rol || '')}</td><td>${safe(u.email || u.correo || '')}</td><td><span class="password-mask" data-pass-index="${index}" data-pass="${safe(pass)}">••••••••</span> <button type="button" class="link-button view-pass-btn" data-toggle-pass="${index}">Ver contraseña</button></td><td>${safe(u.teamName || u.equipo || '')}</td><td><span class="badge ${statusClass(u.status || u.estado)}">${safe(formatStatus(u.status || u.estado || 'activo'))}</span></td></tr>`;
    }).join('');
  }

  function emptyState(text){ return `<div class="card admin-empty"><p>${safe(text)}</p></div>`; }

  function renderAll(){
    syncInlineFilters();
    renderSummary(); renderTeams(); renderPlayers(); renderFixture(); renderTeamMatches(); renderAccess();
  }

  function bindTabs(){
    document.querySelectorAll('[data-admin-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        $(`#admin-tab-${btn.dataset.adminTab}`)?.classList.add('active');
      });
    });
  }

  function bindFilters(){
    ['adminSearch','adminTeamFilter','adminCategoryFilter'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.addEventListener(id === 'adminSearch' ? 'input' : 'change', renderAll);
    });
    [['playerTeamFilter','adminTeamFilter'],['matchTeamFilter','adminTeamFilter'],['playerCategoryFilter','adminCategoryFilter'],['matchCategoryFilter','adminCategoryFilter']].forEach(([source,target]) => {
      const el = document.getElementById(source);
      if(el) el.addEventListener('change', () => { const main = document.getElementById(target); if(main){ main.value = el.value; renderAll(); } });
    });
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    const user = Store.getUser();
    if(!user || lower(user.role) !== 'admin'){ location.href='login.html'; return; }
    bindTabs(); bindFilters();
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-toggle-pass]');
      if(!btn) return;
      const span = document.querySelector(`[data-pass-index="${btn.dataset.togglePass}"]`);
      if(!span) return;
      const visible = span.dataset.visible === 'true';
      span.textContent = visible ? '••••••••' : (span.dataset.pass || 'Sin clave');
      span.dataset.visible = visible ? 'false' : 'true';
      btn.textContent = visible ? 'Ver contraseña' : 'Ocultar';
    });
    $('#adminLogoutBtn')?.addEventListener('click', () => { Store.clearUser ? Store.clearUser() : localStorage.removeItem('mf_user'); location.href='index.html'; });
    try{
      const res = await API.getPublicData();
      if(!res || !res.ok){ toast(res?.message || 'No se pudo cargar la información del administrador.'); return; }
      adminData = {
        users: res.users || [],
        trainers: res.trainers || [],
        teams: res.teams || res.trainers || [],
        players: res.players || [],
        fixture: sortFixtureRows(res.fixture || []),
        categories: res.categories || [],
        referees: res.referees || [],
        matchReferees: res.matchReferees || [],
        matchEvents: res.matchEvents || []
      };
      populateFilters(); renderAll();
    }catch(err){
      toast(err.message || 'No se pudo conectar con la base de datos.');
      console.error(err);
    }
  });
})();
