(function(){
  let adminData = { users:[], trainers:[], teams:[], players:[], fixture:[], categories:[] };

  const $ = (sel) => document.querySelector(sel);
  const safe = (value) => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const lower = (value) => String(value || '').toLowerCase().trim();
  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

  function getTeamName(team){ return team?.teamName || team?.name || team?.equipo || team?.club || ''; }
  function getTeamId(team){ return team?.teamId || team?.id || team?.equipoId || ''; }
  function getPlayerName(player){ return player?.fullName || [player?.firstName, player?.lastName].filter(Boolean).join(' ') || player?.nombre || ''; }
  function getPlayerTeamName(player){ return player?.teamName || player?.equipo || teamNameById(player?.teamId) || ''; }
  function getPlayerCategories(player){ return player?.categories || player?.category || player?.categoria || ''; }
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
    return new Date(y, m - 1, d).toLocaleDateString('es-PE', { day:'2-digit', month:'long', year:'numeric' });
  }

  function roundText(match){
    const round = String(getMatchRound(match) || '').trim();
    const date = formatDate(getMatchDate(match), getMatchDateLabel(match));
    if(round && date && !normalize(date).includes(normalize(round))) return `${round} - ${date}`;
    return round || date || 'Fecha por definir';
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
  }

  function renderSummary(){
    const data = filteredData();
    $('#adminSummary').innerHTML = `
      <div class="card admin-stat"><div class="stat-number">${data.teams.length}</div><div class="stat-label">Equipos</div></div>
      <div class="card admin-stat"><div class="stat-number">${data.players.length}</div><div class="stat-label">Jugadores</div></div>
      <div class="card admin-stat"><div class="stat-number">${data.fixture.length}</div><div class="stat-label">Partidos</div></div>`;
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
        <p><strong>Categorías:</strong> ${safe(team.categories || trainer.categories || 'No registrado')}</p>
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
      <td>${safe(getPlayerCategories(p))}</td>
      <td>${safe(p.birthDate || p.fechaNacimiento || '')}</td>
      <td><span class="badge badge-green">${safe(p.status || 'activo')}</span></td>
    </tr>`).join('');
  }

  function matchCard(match){
    const [home, away] = getMatchTeams(match);
    const status = normalize(getMatchStatus(match));
    const played = status === 'jugado';
    const score = played ? `${safe(match.homeScore ?? '')} - ${safe(match.awayScore ?? '')}` : 'vs';
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
      <p><strong>Campo:</strong> ${safe(match.field || match.cancha || 'Por definir')} · <strong>Estado:</strong> ${safe(getMatchStatus(match))}</p>
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
        <div class="grid">${matches.length ? matches.map(matchCard).join('') : '<p>No tiene partidos con los filtros actuales.</p>'}</div>
      </div>`;
    }).join('');
  }

  function renderAccess(){
    const data = filteredData();
    const body = $('#accessBody');
    if(!data.users.length){ body.innerHTML = `<tr><td colspan="6">No se encontraron accesos con esos filtros.</td></tr>`; return; }
    body.innerHTML = data.users.map(u=>`
      <tr><td>${safe(u.fullName || u.nombre || '')}</td><td>${safe(u.role || u.rol || '')}</td><td>${safe(u.email || u.correo || '')}</td><td>${safe(u.password || u.clave || '')}</td><td>${safe(u.teamName || u.equipo || '')}</td><td>${safe(u.status || u.estado || '')}</td></tr>`).join('');
  }

  function emptyState(text){ return `<div class="card admin-empty"><p>${safe(text)}</p></div>`; }

  function renderAll(){
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
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    const user = Store.getUser();
    if(!user || lower(user.role) !== 'admin'){ location.href='login.html'; return; }
    bindTabs(); bindFilters();
    try{
      const res = await API.getPublicData();
      if(!res || !res.ok){ toast(res?.message || 'No se pudo cargar la información del administrador.'); return; }
      adminData = {
        users: res.users || [],
        trainers: res.trainers || [],
        teams: res.teams || res.trainers || [],
        players: res.players || [],
        fixture: sortFixtureRows(res.fixture || []),
        categories: res.categories || []
      };
      populateFilters(); renderAll();
    }catch(err){
      toast(err.message || 'No se pudo conectar con la base de datos.');
      console.error(err);
    }
  });
})();
