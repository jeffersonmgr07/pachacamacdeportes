(function(){
  let state = { user:null, data:null, matches:[], currentMatch:null, currentEvents:[], timer:null, clock:null };
  const DEMO_ID = 'DEMO-ADMIN-ARBITRAJE';
  const $ = (sel) => document.querySelector(sel);
  const safe = (value) => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const roleOf = (u) => normalize(u?.role || u?.rol);
  const isAdmin = () => roleOf(state.user) === 'admin';
  const isReferee = () => ['arbitro','referee'].includes(roleOf(state.user));
  const isDemo = (m) => String(getMatchId(m || state.currentMatch || '')) === DEMO_ID;
  const now = () => new Date();

  function getMatchId(m){ return m?.matchId || m?.id || m?.codigo || ''; }
  function getTeams(m){ return [m?.home || m?.local || '', m?.away || m?.visitante || '']; }
  function getStatus(m){ return String(m?.status || m?.estado || 'programado').toLowerCase(); }
  function getCategory(m){ return m?.category || m?.categoria || ''; }
  function getDate(m){ return m?.date || m?.matchDate || m?.fecha || m?.dateLabel || m?.fechaTexto || ''; }
  function getRawDate(m){ return m?.matchDate || m?.date || (/^\d{4}-\d{2}-\d{2}/.test(String(m?.fecha || '')) ? m.fecha : ''); }
  function getTime(m){ return m?.time || m?.hora || ''; }
  function getScore(m, side){ return Number(side === 'home' ? (m?.homeScore ?? m?.golesLocal ?? 0) : (m?.awayScore ?? m?.golesVisitante ?? 0)) || 0; }
  function setScore(m, side, value){ if(side === 'home'){ m.homeScore = Math.max(0, Number(value)||0); m.golesLocal = m.homeScore; } else { m.awayScore = Math.max(0, Number(value)||0); m.golesVisitante = m.awayScore; } }

  function formatDatePE(value){
    const raw = String(value || '').trim();
    if(!raw) return 'Fecha por definir';
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
    const dmy = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if(dmy) return `${dmy[1].padStart(2,'0')}.${dmy[2].padStart(2,'0')}.${dmy[3]}`;
    return raw;
  }
  function roundLabel(value){
    const v = String(value || '').trim();
    return /^\d+$/.test(v) ? 'Fecha ' + v : (v || 'Fecha');
  }
  function formatStatus(status){
    const s = normalize(status || 'programado');
    if(s === 'en_juego') return 'En juego';
    if(s === 'jugado') return 'Jugado';
    if(s === 'finalizado') return 'Finalizado';
    if(['wo','w.o','walkover','bwo'].includes(s)) return 'Walkover';
    return String(status || 'Programado').replace(/_/g,' ').replace(/^./, c => c.toUpperCase());
  }
  function statusBadge(status){
    const s = normalize(status || 'programado');
    if(s === 'jugado' || s === 'finalizado') return '<span class="badge badge-green">Finalizado</span>';
    if(s === 'en_juego') return '<span class="badge badge-gold">En juego</span>';
    if(['wo','walkover','bwo'].includes(s)) return '<span class="badge badge-red">Walkover</span>';
    return '<span class="badge badge-blue">Programado</span>';
  }
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
  function demoMatch(){
    const saved = Store.get('mf_demo_admin_match', null);
    return saved || { matchId:DEMO_ID, round:'Demo', date:new Date().toISOString().slice(0,10), field:'Mesa de prueba', time:'00:00', home:'Equipo local', away:'Equipo visitante', category:'Demo', status:'programado', homeScore:0, awayScore:0, demo:true };
  }
  function saveDemo(){
    if(isDemo(state.currentMatch)) Store.set('mf_demo_admin_match', state.currentMatch);
    Store.set('mf_demo_admin_events', (state.data?.matchEvents || []).filter(e=>String(e.matchId)===DEMO_ID));
  }
  function filteredMatches(){
    const q = normalize($('#refereeSearch')?.value || '');
    const status = $('#refereeStatusFilter')?.value || '';
    return state.matches.filter(m => {
      const [home, away] = getTeams(m);
      const hay = normalize([getMatchId(m), home, away, getCategory(m), getDate(m), getTime(m), getStatus(m)].join(' '));
      return (!q || hay.includes(q)) && (!status || normalize(getStatus(m)) === normalize(status));
    });
  }
  function renderSummary(){
    const items = filteredMatches();
    const live = items.filter(m => normalize(getStatus(m)) === 'en_juego').length;
    const done = items.filter(m => ['jugado','finalizado'].includes(normalize(getStatus(m)))).length;
    $('#refereeSummary').innerHTML = `
      <div class="card admin-stat referee-stat"><div class="stat-number">${items.length}</div><div class="stat-label">Partidos visibles</div></div>
      <div class="card admin-stat referee-stat"><div class="stat-number">${live}</div><div class="stat-label">En juego</div></div>
      <div class="card admin-stat referee-stat"><div class="stat-number">${done}</div><div class="stat-label">Finalizados</div></div>`;
  }
  function canRefereeStart(match){
    if(isAdmin() || isDemo(match)) return {ok:true};
    const status = normalize(getStatus(match));
    if(status === 'en_juego' || status === 'jugado' || status === 'finalizado') return {ok:true};
    const date = getRawDate(match);
    const time = getTime(match);
    const parts = String(time || '').match(/^(\d{1,2}):(\d{2})/);
    if(!date || !parts) return {ok:false, message:'Este partido aún no tiene fecha y hora válidas para iniciar arbitraje.'};
    const start = new Date(`${String(date).slice(0,10)}T${parts[1].padStart(2,'0')}:${parts[2]}:00`);
    if(Number.isNaN(start.getTime())) return {ok:false, message:'No se pudo validar la hora de inicio del partido.'};
    const allowFrom = new Date(start.getTime() - 5*60*1000);
    if(now() < allowFrom) return {ok:false, message:`Este partido se habilita 5 minutos antes de la hora programada (${formatTime12(time)}).`};
    return {ok:true};
  }
  function renderMatches(){
    renderSummary();
    const list = filteredMatches();
    const box = $('#refereeMatches');
    if(!list.length){ box.innerHTML = '<div class="card empty-state">No hay partidos para mostrar con esos filtros.</div>'; return; }
    box.innerHTML = list.map(m => {
      const [home, away] = getTeams(m);
      const score = ['jugado','finalizado','en_juego'].includes(normalize(getStatus(m))) ? `${getScore(m,'home')} - ${getScore(m,'away')}` : 'vs';
      const can = canRefereeStart(m);
      const label = normalize(getStatus(m)) === 'en_juego' ? 'Continuar arbitraje' : (isDemo(m) ? 'Abrir demo' : 'Iniciar arbitraje');
      return `<article class="fixture-match-card referee-match-card ${isDemo(m) ? 'demo-match-card' : ''}">
        <div class="match-meta">${statusBadge(getStatus(m))}<span class="badge badge-blue">${safe(getCategory(m) || 'Categoría')}</span><span class="badge badge-gold">${safe(formatTime12(getTime(m) || 'Por definir'))}</span></div>
        <div class="match-teams"><span>${safe(home || 'Local')}</span><span class="score-line">${score}</span><span class="away">${safe(away || 'Visitante')}</span></div>
        <p class="match-card-info">${safe(roundLabel(m.round || m.fecha))} · ${safe(formatDatePE(getDate(m)))} · ${safe(m.field || m.cancha || 'Campo por definir')}</p>
        <div class="actions"><button class="btn btn-primary" data-open-control="${safe(getMatchId(m))}" ${can.ok ? '' : 'disabled'}>${label}</button></div>
        ${can.ok ? '' : `<small class="admin-muted">${safe(can.message)}</small>`}
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
    list.innerHTML = events.map(e => `<div class="event-row">
      <div class="event-row-main"><strong>${safe(e.minute || '—')}’ · ${safe(formatStatus(e.eventType || 'evento'))}</strong><button class="btn btn-secondary btn-small" data-delete-event="${safe(e.eventId || '')}">Eliminar</button></div>
      <span>${safe(e.teamName || e.teamSide || '')}${e.playerName ? ' · ' + safe(e.playerName) : ''}</span>${e.notes ? `<small>${safe(e.notes)}</small>` : ''}
    </div>`).join('');
  }
  function categoryMinutes(match){
    const n = Number((String(getCategory(match) || '').match(/\d+/) || [0])[0]);
    if(n <= 6) return 10;
    if(n <= 8) return 15;
    if(n <= 12) return 20;
    return 25;
  }
  function timerKey(matchId){ return 'mf_match_timer_' + matchId; }
  function getTimer(matchId){
    return Store.get(timerKey(matchId), {phase:1, status:'running', startedAt:Date.now(), elapsedBefore:0, extraMinutes:0});
  }
  function setTimer(matchId, timer){ Store.set(timerKey(matchId), timer); state.timer = timer; }
  function currentElapsedSeconds(timer){
    const base = Number(timer.elapsedBefore || 0);
    return timer.status === 'running' ? base + Math.floor((Date.now() - Number(timer.startedAt || Date.now()))/1000) : base;
  }
  function formatClock(sec){ const m = Math.floor(sec/60), s = Math.max(0, sec%60); return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
  function updateClock(){
    if(!state.currentMatch || !state.timer) return;
    const clock = $('#matchClock'); if(!clock) return;
    const limit = (categoryMinutes(state.currentMatch) + Number(state.timer.extraMinutes || 0)) * 60;
    const elapsed = currentElapsedSeconds(state.timer);
    clock.textContent = `T${state.timer.phase} · ${formatClock(elapsed)}`;
    clock.classList.toggle('over-time', elapsed > limit);
    const phaseBtn = $('#phaseBtn');
    if(phaseBtn){
      if(state.timer.phase === 1 && state.timer.status === 'running') phaseBtn.textContent = 'Finalizar primer tiempo';
      if(state.timer.phase === 1 && state.timer.status === 'paused') phaseBtn.textContent = 'Continuar al segundo tiempo';
      if(state.timer.phase === 2) phaseBtn.textContent = 'Finalizar segundo tiempo';
      phaseBtn.disabled = !isAdmin() && state.timer.status === 'running' && elapsed < limit;
    }
  }
  function startClock(matchId){
    clearInterval(state.clock);
    state.timer = getTimer(matchId);
    if(!state.timer.startedAt) state.timer.startedAt = Date.now();
    updateClock();
    state.clock = setInterval(updateClock, 1000);
  }
  async function openControl(matchId){
    const match = state.matches.find(m => String(getMatchId(m)) === String(matchId));
    if(!match) return;
    const can = canRefereeStart(match);
    if(!can.ok){ toast(can.message); return; }
    state.currentMatch = match;
    state.currentEvents = matchEvents(matchId);
    const [home, away] = getTeams(match);
    $('#controlTitle').textContent = `${home || 'Local'} vs ${away || 'Visitante'}`;
    $('#controlSubtitle').textContent = `${getCategory(match) || ''} · ${formatDatePE(getDate(match))} · ${getTime(match) || ''}`;
    $('#homeTeamName').textContent = home || 'Local';
    $('#awayTeamName').textContent = away || 'Visitante';
    $('#homeScore').textContent = getScore(match,'home');
    $('#awayScore').textContent = getScore(match,'away');
    renderPlayerOptions($('#eventTeamSide').value || 'home');
    renderEvents();
    $('#matchControlModal').classList.add('open');
    if(normalize(getStatus(match)) !== 'en_juego'){
      if(isDemo(match)){
        match.status = 'en_juego'; match.startedAt = new Date().toISOString(); updateLocalMatch(match); saveDemo();
      }else{
        const res = await API.startMatch({matchId, user:state.user});
        if(res?.ok) updateLocalMatch(res.match); else toast(res?.message || 'No se pudo iniciar el partido.');
      }
    }
    startClock(matchId);
  }
  function updateLocalMatch(match){
    if(!match) return;
    const id = getMatchId(match);
    state.matches = state.matches.map(m => String(getMatchId(m)) === String(id) ? {...m, ...match} : m);
    if(state.data?.fixture) state.data.fixture = state.matches.filter(m => !isDemo(m));
    state.currentMatch = state.matches.find(m => String(getMatchId(m)) === String(id)) || match;
    $('#homeScore').textContent = getScore(state.currentMatch,'home');
    $('#awayScore').textContent = getScore(state.currentMatch,'away');
    renderMatches();
  }
  function addEventLocal(payload){
    const match = {...state.currentMatch};
    const side = payload.teamSide;
    if(payload.eventType === 'gol') setScore(match, side, getScore(match,side)+1);
    if(payload.eventType === 'anulacion_gol') setScore(match, side, getScore(match,side)-1);
    match.status = 'en_juego'; match.updatedAt = new Date().toISOString();
    const event = {...payload, eventId:'DEMO-EVT-' + Date.now(), createdAt:new Date().toISOString(), createdBy: state.user?.userId || state.user?.email || ''};
    state.currentEvents = [...state.currentEvents, event];
    state.data.matchEvents = (state.data.matchEvents || []).filter(e=>String(e.matchId)!==DEMO_ID).concat(state.currentEvents);
    updateLocalMatch(match); renderEvents(); saveDemo();
    return {ok:true};
  }
  async function saveEvent(form, forcedType, forcedSide){
    if(!state.currentMatch) return;
    const fd = new FormData(form || $('#eventForm'));
    const side = forcedSide || fd.get('teamSide') || 'home';
    const [home, away] = getTeams(state.currentMatch);
    const playerId = fd.get('playerId') || '';
    const player = (state.data?.players || []).find(p => String(p.playerId || p.dni || '') === String(playerId));
    const payload = { matchId:getMatchId(state.currentMatch), minute:fd.get('minute') || Math.floor(currentElapsedSeconds(state.timer || {})/60) || '', teamSide:side, teamName:side === 'away' ? away : home, eventType:forcedType || fd.get('eventType') || 'observacion', playerId, playerName: player ? fullName(player) : '', notes:fd.get('notes') || '', user:state.user };
    let res;
    if(isDemo(state.currentMatch)) res = addEventLocal(payload); else res = await API.saveMatchEvent(payload);
    if(!res?.ok){ toast(res?.message || 'No se pudo guardar el evento.'); return; }
    if(!isDemo(state.currentMatch)){
      state.currentEvents = res.events || [...state.currentEvents, res.event];
      if(state.data){ state.data.matchEvents = (state.data.matchEvents || []).filter(e=>String(e.matchId)!==String(payload.matchId)).concat(state.currentEvents); }
      updateLocalMatch(res.match);
      renderEvents();
    }
    $('#eventForm').reset();
    $('#eventTeamSide').value = side;
    renderPlayerOptions(side);
    toast(payload.eventType === 'anulacion_gol' ? 'Gol anulado' : 'Evento guardado');
  }
  async function deleteEvent(eventId){
    if(!state.currentMatch || !eventId) return;
    const ok = confirm('¿Eliminar este evento? Si es gol o anulación, el marcador se ajustará automáticamente.');
    if(!ok) return;
    const event = state.currentEvents.find(e=>String(e.eventId)===String(eventId));
    if(isDemo(state.currentMatch)){
      const match = {...state.currentMatch};
      if(event?.eventType === 'gol') setScore(match, event.teamSide, getScore(match,event.teamSide)-1);
      if(event?.eventType === 'anulacion_gol') setScore(match, event.teamSide, getScore(match,event.teamSide)+1);
      state.currentEvents = state.currentEvents.filter(e=>String(e.eventId)!==String(eventId));
      state.data.matchEvents = (state.data.matchEvents || []).filter(e=>String(e.eventId)!==String(eventId));
      updateLocalMatch(match); renderEvents(); saveDemo(); toast('Evento eliminado'); return;
    }
    const res = await API.deleteMatchEvent({matchId:getMatchId(state.currentMatch), eventId, user:state.user});
    if(!res?.ok){ toast(res?.message || 'No se pudo eliminar el evento.'); return; }
    state.currentEvents = res.events || state.currentEvents.filter(e=>String(e.eventId)!==String(eventId));
    if(state.data){ state.data.matchEvents = (state.data.matchEvents || []).filter(e=>String(e.matchId)!==String(getMatchId(state.currentMatch))).concat(state.currentEvents); }
    updateLocalMatch(res.match); renderEvents(); toast('Evento eliminado');
  }
  function phaseAction(){
    if(!state.currentMatch || !state.timer) return;
    const id = getMatchId(state.currentMatch);
    const elapsed = currentElapsedSeconds(state.timer);
    const limit = (categoryMinutes(state.currentMatch) + Number(state.timer.extraMinutes || 0)) * 60;
    if(!isAdmin() && state.timer.status === 'running' && elapsed < limit){ toast('Solo podrás finalizar este tiempo cuando se cumpla el tiempo reglamentario.'); return; }
    if(state.timer.phase === 1 && state.timer.status === 'running') setTimer(id, {...state.timer, status:'paused', elapsedBefore:elapsed});
    else if(state.timer.phase === 1 && state.timer.status === 'paused') setTimer(id, {phase:2, status:'running', startedAt:Date.now(), elapsedBefore:0, extraMinutes:0});
    else if(state.timer.phase === 2) setTimer(id, {...state.timer, status:'paused', elapsedBefore:elapsed});
    updateClock();
  }
  function addExtraMinute(){
    if(!state.currentMatch || !state.timer) return;
    setTimer(getMatchId(state.currentMatch), {...state.timer, extraMinutes:Number(state.timer.extraMinutes || 0)+1});
    updateClock(); toast('Se agregó 1 minuto adicional');
  }
  async function finishMatch(){
    if(!state.currentMatch) return;
    const ok = confirm('¿Finalizar el partido y guardar el resultado final?');
    if(!ok) return;
    if(isDemo(state.currentMatch)){
      const match = {...state.currentMatch, status:'jugado', finishedAt:new Date().toISOString()};
      updateLocalMatch(match); saveDemo(); $('#matchControlModal').classList.remove('open'); toast('Demo finalizada'); return;
    }
    const res = await API.finishMatch({matchId:getMatchId(state.currentMatch), homeScore:getScore(state.currentMatch,'home'), awayScore:getScore(state.currentMatch,'away'), resultType:'normal', user:state.user});
    if(!res?.ok){ toast(res?.message || 'No se pudo finalizar el partido.'); return; }
    updateLocalMatch(res.match);
    $('#matchControlModal').classList.remove('open');
    toast('Partido finalizado y resultado guardado');
  }
  async function softRefresh(){
    if(document.hidden || (state.currentMatch && isDemo(state.currentMatch))) return;
    const res = await API.getPublicData();
    if(!res?.ok) return;
    state.data = res;
    const all = sortFixtureRows(res.fixture || []);
    const assigned = all.filter(assignedToReferee);
    state.matches = (isAdmin() ? [demoMatch(), ...all] : (assigned.length ? assigned : all));
    if(isAdmin()) state.data.matchEvents = [...(Store.get('mf_demo_admin_events', [])), ...(state.data.matchEvents || [])];
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
    $('#backAdminBtn').style.display = isAdmin() ? 'inline-flex' : 'none';
    $('#refereeWelcome').textContent = isAdmin() ? 'Arbitraje desde administración' : 'Mis partidos asignados';
    $('#refereeSubtitle').textContent = isAdmin() ? 'Puedes iniciar y controlar cualquier partido desde mesa. La primera tarjeta es una demo que no altera el fixture real.' : 'Verás tus partidos asignados. El inicio se habilita 5 minutos antes de la hora programada.';
    const res = await API.getPublicData();
    if(!res?.ok){ toast(res?.message || 'No se pudo cargar el panel de árbitro.'); return; }
    state.data = res;
    if(isAdmin()) state.data.matchEvents = [...(Store.get('mf_demo_admin_events', [])), ...(state.data.matchEvents || [])];
    const all = sortFixtureRows(res.fixture || []);
    const assigned = all.filter(assignedToReferee);
    state.matches = isAdmin() ? [demoMatch(), ...all] : (assigned.length ? assigned : all);
    renderMatches();
    const pre = new URLSearchParams(location.search).get('matchId');
    if(pre) setTimeout(()=>openControl(pre), 100);
  }
  document.addEventListener('DOMContentLoaded', () => {
    $('#refereeSearch')?.addEventListener('input', renderMatches);
    $('#refereeStatusFilter')?.addEventListener('change', renderMatches);
    $('#logoutBtn')?.addEventListener('click', () => { Store.clearUser ? Store.clearUser() : localStorage.removeItem('mf_user'); location.href='login.html'; });
    document.addEventListener('click', e => { const btn = e.target.closest('[data-open-control]'); if(btn && !btn.disabled) openControl(btn.dataset.openControl); const del = e.target.closest('[data-delete-event]'); if(del) deleteEvent(del.dataset.deleteEvent); });
    $('#eventTeamSide')?.addEventListener('change', e => renderPlayerOptions(e.target.value));
    $('#eventForm')?.addEventListener('submit', e => { e.preventDefault(); saveEvent(e.currentTarget); });
    document.querySelectorAll('[data-quick-goal]').forEach(btn => btn.addEventListener('click', () => saveEvent($('#eventForm'), 'gol', btn.dataset.quickGoal)));
    $('#finishMatchBtn')?.addEventListener('click', finishMatch);
    $('#phaseBtn')?.addEventListener('click', phaseAction);
    $('#addExtraMinuteBtn')?.addEventListener('click', addExtraMinute);
    $('#refreshMatchBtn')?.addEventListener('click', () => load());
    load().catch(err => { console.error(err); toast(err.message || 'Error al cargar arbitraje.'); });
    setInterval(() => softRefresh().catch(()=>{}), 15000);
  });
})();
