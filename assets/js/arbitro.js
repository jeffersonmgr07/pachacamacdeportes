(function(){
  let state = { user:null, data:null, matches:[], currentMatch:null, currentEvents:[] };
  const $ = (sel) => document.querySelector(sel);
  const safe = (value) => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const roleOf = (u) => normalize(u?.role || u?.rol);
  const isAdmin = () => roleOf(state.user) === 'admin';
  const isReferee = () => ['arbitro','árbitro','referee'].includes(roleOf(state.user));

  function getMatchId(m){ return m?.matchId || m?.id || m?.codigo || ''; }
  function getTeams(m){ return [m?.home || m?.local || '', m?.away || m?.visitante || '']; }
  function getStatus(m){ return String(m?.status || m?.estado || 'programado').toLowerCase(); }
  function getCategory(m){ return m?.category || m?.categoria || ''; }
  function getDate(m){ return m?.date || m?.matchDate || m?.fecha || m?.dateLabel || m?.fechaTexto || ''; }
  function getScore(m, side){ return Number(side === 'home' ? (m?.homeScore ?? m?.golesLocal ?? 0) : (m?.awayScore ?? m?.golesVisitante ?? 0)) || 0; }
  function teamIdByName(name){
    const n = normalize(name);
    const team = (state.data?.teams || []).find(t => normalize(t.teamName || t.name || t.equipo || t.club) === n);
    return team?.teamId || team?.id || '';
  }
  function playersByTeamName(teamName){
    const id = teamIdByName(teamName);
    return (state.data?.players || []).filter(p => String(p.teamId || '') === String(id || '') || normalize(p.teamName || p.equipo) === normalize(teamName));
  }
  function fullName(p){ return p?.fullName || [p?.firstName, p?.lastName].filter(Boolean).join(' ') || p?.nombre || ''; }
  function matchEvents(matchId){ return (state.data?.matchEvents || []).filter(e => String(e.matchId) === String(matchId)); }
  function assignedToReferee(match){
    if(isAdmin()) return true;
    const uid = String(state.user?.userId || '').trim();
    const email = String(state.user?.email || '').trim().toLowerCase();
    const refId = String(state.user?.refereeId || state.user?.arbitroId || '').trim();
    const matchId = String(getMatchId(match));
    const direct = [match.refereeId, match.arbitroId, match.refereeEmail, match.arbitroEmail].map(x=>String(x||'').trim().toLowerCase()).filter(Boolean);
    if(direct.includes(uid.toLowerCase()) || direct.includes(email) || direct.includes(refId.toLowerCase())) return true;
    return (state.data?.matchReferees || []).some(r => String(r.matchId) === matchId && [r.userId, r.refereeId, r.email, r.correo].map(x=>String(x||'').trim().toLowerCase()).some(x => x && (x === uid.toLowerCase() || x === email || x === refId.toLowerCase())));
  }
  function filteredMatches(){
    const q = normalize($('#refereeSearch')?.value || '');
    const status = $('#refereeStatusFilter')?.value || '';
    return state.matches.filter(m => {
      const [home, away] = getTeams(m);
      const hay = normalize([getMatchId(m), home, away, getCategory(m), getDate(m), m.time || m.hora, getStatus(m)].join(' '));
      return (!q || hay.includes(q)) && (!status || normalize(getStatus(m)) === normalize(status));
    });
  }
  function statusBadge(status){
    const s = normalize(status || 'programado');
    if(s === 'jugado' || s === 'finalizado') return '<span class="badge badge-green">Finalizado</span>';
    if(s === 'en_juego') return '<span class="badge badge-gold">En juego</span>';
    return '<span class="badge badge-blue">Programado</span>';
  }
  function renderSummary(){
    const items = filteredMatches();
    const live = items.filter(m => normalize(getStatus(m)) === 'en_juego').length;
    const done = items.filter(m => ['jugado','finalizado'].includes(normalize(getStatus(m)))).length;
    $('#refereeSummary').innerHTML = `
      <div class="card admin-stat"><div class="stat-number">${items.length}</div><div class="stat-label">Partidos visibles</div></div>
      <div class="card admin-stat"><div class="stat-number">${live}</div><div class="stat-label">En juego</div></div>
      <div class="card admin-stat"><div class="stat-number">${done}</div><div class="stat-label">Finalizados</div></div>`;
  }
  function renderMatches(){
    renderSummary();
    const list = filteredMatches();
    const box = $('#refereeMatches');
    if(!list.length){ box.innerHTML = '<div class="card empty-state">No hay partidos para mostrar con esos filtros.</div>'; return; }
    box.innerHTML = list.map(m => {
      const [home, away] = getTeams(m);
      const score = ['jugado','finalizado','en_juego'].includes(normalize(getStatus(m))) ? `${getScore(m,'home')} - ${getScore(m,'away')}` : 'vs';
      return `<article class="fixture-match-card referee-match-card">
        <div class="match-meta">${statusBadge(getStatus(m))}<span class="badge badge-blue">${safe(getCategory(m) || 'Categoría')}</span><span class="badge badge-gold">${safe(formatTime12(m.time || m.hora || 'Por definir'))}</span></div>
        <div class="match-teams"><span>${safe(home || 'Local')}</span><span class="score-line">${score}</span><span class="away">${safe(away || 'Visitante')}</span></div>
        <p><strong>Fecha:</strong> ${safe(m.round || m.fecha || '')} ${safe(getDate(m))} · <strong>Campo:</strong> ${safe(m.field || m.cancha || 'Por definir')}</p>
        <div class="actions"><button class="btn btn-primary" data-open-control="${safe(getMatchId(m))}">${normalize(getStatus(m)) === 'en_juego' ? 'Continuar arbitraje' : 'Iniciar arbitraje'}</button></div>
      </article>`;
    }).join('');
  }
  function renderPlayerOptions(side){
    const [home, away] = getTeams(state.currentMatch || {});
    const teamName = side === 'away' ? away : home;
    const players = playersByTeamName(teamName);
    $('#eventPlayer').innerHTML = '<option value="">Sin jugador / no aplica</option>' + players.map(p => `<option value="${safe(p.playerId || p.dni || '')}">${safe(fullName(p))}${p.dni ? ' · DNI ' + safe(p.dni) : ''}</option>`).join('');
  }
  function renderEvents(){
    const list = $('#matchEventsList');
    const events = [...state.currentEvents].sort((a,b)=>(Number(a.minute)||0)-(Number(b.minute)||0));
    if(!events.length){ list.innerHTML = '<div class="empty-state small">Aún no hay eventos registrados.</div>'; return; }
    list.innerHTML = events.map(e => `<div class="event-row"><strong>${safe(e.minute || '—')}’ · ${safe(e.eventType || 'evento')}</strong><span>${safe(e.teamName || e.teamSide || '')}${e.playerName ? ' · ' + safe(e.playerName) : ''}</span>${e.notes ? `<small>${safe(e.notes)}</small>` : ''}</div>`).join('');
  }
  async function openControl(matchId){
    const match = state.matches.find(m => String(getMatchId(m)) === String(matchId));
    if(!match) return;
    state.currentMatch = match;
    state.currentEvents = matchEvents(matchId);
    const [home, away] = getTeams(match);
    $('#controlTitle').textContent = `${home || 'Local'} vs ${away || 'Visitante'}`;
    $('#controlSubtitle').textContent = `${getCategory(match) || ''} · ${getDate(match) || ''} · ${match.time || match.hora || ''}`;
    $('#homeTeamName').textContent = home || 'Local';
    $('#awayTeamName').textContent = away || 'Visitante';
    $('#homeScore').textContent = getScore(match,'home');
    $('#awayScore').textContent = getScore(match,'away');
    renderPlayerOptions($('#eventTeamSide').value || 'home');
    renderEvents();
    $('#matchControlModal').classList.add('open');
    if(normalize(getStatus(match)) !== 'en_juego'){
      const res = await API.startMatch({matchId, user:state.user});
      if(res?.ok) updateLocalMatch(res.match);
    }
  }
  function updateLocalMatch(match){
    if(!match) return;
    const id = getMatchId(match);
    state.matches = state.matches.map(m => String(getMatchId(m)) === String(id) ? {...m, ...match} : m);
    if(state.data?.fixture) state.data.fixture = state.matches;
    state.currentMatch = state.matches.find(m => String(getMatchId(m)) === String(id)) || match;
    $('#homeScore').textContent = getScore(state.currentMatch,'home');
    $('#awayScore').textContent = getScore(state.currentMatch,'away');
    renderMatches();
  }
  async function saveEvent(form, forcedType, forcedSide){
    if(!state.currentMatch) return;
    const fd = new FormData(form || $('#eventForm'));
    const side = forcedSide || fd.get('teamSide') || 'home';
    const [home, away] = getTeams(state.currentMatch);
    const playerId = fd.get('playerId') || '';
    const player = (state.data?.players || []).find(p => String(p.playerId || p.dni || '') === String(playerId));
    const payload = { matchId:getMatchId(state.currentMatch), minute:fd.get('minute') || '', teamSide:side, teamName:side === 'away' ? away : home, eventType:forcedType || fd.get('eventType') || 'observacion', playerId, playerName: player ? fullName(player) : '', notes:fd.get('notes') || '', user:state.user };
    const res = await API.saveMatchEvent(payload);
    if(!res?.ok){ toast(res?.message || 'No se pudo guardar el evento.'); return; }
    state.currentEvents = res.events || [...state.currentEvents, res.event];
    if(state.data){ state.data.matchEvents = (state.data.matchEvents || []).filter(e=>String(e.matchId)!==String(payload.matchId)).concat(state.currentEvents); }
    updateLocalMatch(res.match);
    renderEvents();
    $('#eventForm').reset();
    $('#eventTeamSide').value = side;
    renderPlayerOptions(side);
    toast('Evento guardado');
  }
  async function finishMatch(){
    if(!state.currentMatch) return;
    const ok = confirm('¿Finalizar el partido y guardar el resultado final?');
    if(!ok) return;
    const res = await API.finishMatch({matchId:getMatchId(state.currentMatch), homeScore:getScore(state.currentMatch,'home'), awayScore:getScore(state.currentMatch,'away'), resultType:'normal', user:state.user});
    if(!res?.ok){ toast(res?.message || 'No se pudo finalizar el partido.'); return; }
    updateLocalMatch(res.match);
    $('#matchControlModal').classList.remove('open');
    toast('Partido finalizado y resultado guardado');
  }

  async function softRefresh(){
    if(document.hidden) return;
    const res = await API.getPublicData();
    if(!res?.ok) return;
    state.data = res;
    const all = sortFixtureRows(res.fixture || []);
    const assigned = all.filter(assignedToReferee);
    state.matches = (isAdmin() || assigned.length ? assigned : all);
    if(state.currentMatch){
      const id = getMatchId(state.currentMatch);
      state.currentMatch = state.matches.find(m => String(getMatchId(m)) === String(id)) || state.currentMatch;
      state.currentEvents = matchEvents(id);
      $('#homeScore').textContent = getScore(state.currentMatch,'home');
      $('#awayScore').textContent = getScore(state.currentMatch,'away');
      renderEvents();
    }
    renderMatches();
  }

  async function load(){
    state.user = Store.getUser();
    if(!state.user || (!isAdmin() && !isReferee())){ location.href='login.html'; return; }
    $('#refereeWelcome').textContent = isAdmin() ? 'Arbitraje desde administración' : 'Mis partidos asignados';
    $('#refereeSubtitle').textContent = isAdmin() ? 'Puedes iniciar y controlar cualquier partido desde mesa.' : 'Verás tus partidos asignados. Si aún no hay asignaciones, se mostrarán los partidos disponibles.';
    const res = await API.getPublicData();
    if(!res?.ok){ toast(res?.message || 'No se pudo cargar el panel de árbitro.'); return; }
    state.data = res;
    const all = sortFixtureRows(res.fixture || []);
    const assigned = all.filter(assignedToReferee);
    state.matches = (isAdmin() || assigned.length ? assigned : all);
    renderMatches();
    const pre = new URLSearchParams(location.search).get('matchId');
    if(pre) setTimeout(()=>openControl(pre), 100);
  }
  document.addEventListener('DOMContentLoaded', () => {
    $('#refereeSearch')?.addEventListener('input', renderMatches);
    $('#refereeStatusFilter')?.addEventListener('change', renderMatches);
    $('#logoutBtn')?.addEventListener('click', () => { Store.clearUser(); location.href='login.html'; });
    document.addEventListener('click', e => { const btn = e.target.closest('[data-open-control]'); if(btn) openControl(btn.dataset.openControl); });
    $('#eventTeamSide')?.addEventListener('change', e => renderPlayerOptions(e.target.value));
    $('#eventForm')?.addEventListener('submit', e => { e.preventDefault(); saveEvent(e.currentTarget); });
    document.querySelectorAll('[data-quick-goal]').forEach(btn => btn.addEventListener('click', () => saveEvent($('#eventForm'), 'gol', btn.dataset.quickGoal)));
    $('#finishMatchBtn')?.addEventListener('click', finishMatch);
    $('#refreshMatchBtn')?.addEventListener('click', () => load());
    load().catch(err => { console.error(err); toast(err.message || 'Error al cargar arbitraje.'); });
    setInterval(() => softRefresh().catch(()=>{}), 15000);
  });
})();
