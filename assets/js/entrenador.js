let coachState = {user:null, team:null, categories:[], players:[], fixture:[], convocatorias:[], playerFilter:'TODOS'};

function categoryBaseName(value){
  return String(value || '').replace(/\s*\(.+?\)/g,'').trim().toUpperCase();
}
function categoryNumber(value){
  const m = String(value || '').match(/(\d+)/);
  return m ? Number(m[1]) : 999;
}
function sortCategories(arr){
  return [...arr].sort((a,b)=>categoryNumber(a)-categoryNumber(b) || String(a).localeCompare(String(b)));
}
function playerCategoriesArray(p){
  return String(p.categories || p.category || '').split(',').map(x=>categoryBaseName(x)).filter(Boolean);
}
function teamCategoriesArray(){
  const raw = coachState.team?.categories || 'SUB 6,SUB 8,SUB 10,SUB 12,SUB 13,SUB 15';
  return sortCategories(String(raw).split(',').map(x=>categoryBaseName(x)).filter(Boolean));
}
function categoryOptionsByBirthDate(birthDate){
  if(!birthDate) return coachState.categories;
  const y = new Date(birthDate).getFullYear();
  // Puede jugar en su categoría natural y en categorías superiores.
  return coachState.categories.filter(c => {
    const min = Number(c.minYear), max = Number(c.maxYear);
    return (y >= min && y <= max) || (y > max && y <= 2021);
  });
}
function simpleCategoryByDOB(birthDate){
  if(!birthDate) return '';
  const y = new Date(birthDate).getFullYear();
  const exact = coachState.categories.find(c=>y>=Number(c.minYear) && y<=Number(c.maxYear));
  return exact ? exact.name : '';
}
function shortCoachName(user){
  const source = user.shortName || user.fullName || 'Entrenador';
  const parts = String(source).trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0] || 'Entrenador';
}
function crestSrc(){
  const url = coachState.team?.crestUrl || coachState.team?.crest || coachState.team?.logoUrl;
  if(url) return String(url).replace(/^\/?/, '');
  return `assets/img/equipos/${String(coachState.team?.teamId || 'equipo').trim()}.PNG`;
}
function renderShell(){
  const user = coachState.user;
  document.querySelector('#coachName').textContent = shortCoachName(user);
  document.querySelector('#coachWelcome').textContent = `Bienvenido ${shortCoachName(user)}`;
  document.querySelector('#coachSubtitle').textContent = 'Gestiona tu perfil, jugadores, partidos y convocatorias del equipo.';
  const crest = document.querySelector('#teamCrestSidebar');
  if(crest){ crest.src = crestSrc(); }
  const teamLabel = document.querySelector('#sidebarTeamName');
  if(teamLabel){ teamLabel.textContent = coachState.team?.teamName || 'Equipo'; }

}
function setTab(tab){
  document.querySelectorAll('.side-menu button[data-tab]').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.tabs-content').forEach(s=>s.classList.toggle('active', s.id===`tab-${tab}`));
}
function renderCategoryBadges(){
  const cats = teamCategoriesArray();
  return cats.map(c=>`<span class="category-pill">${c.replace('SUB','Sub')}</span>`).join('') || '<span class="section-subtitle">Sin categorías habilitadas</span>';
}
function renderProfile(edit=false){
  const t = coachState.team || {};
  const view = document.querySelector('#profileBox');
  const teamCats = teamCategoriesArray();
  const cats = coachState.categories.map(c => `
    <label class="category-check"><input type="checkbox" value="${c.name}" ${teamCats.includes(categoryBaseName(c.name))?'checked':''}> ${c.label}</label>`).join('');
  view.innerHTML = edit ? `
    <div class="form-grid">
      <div><label>Nombre del equipo</label><input class="input" id="teamNameInput" value="${t.teamName||''}"></div>
      <div><label>Razón social</label><input class="input" id="legalNameInput" value="${t.legalName||''}"></div>
      <div><label>Dirección</label><input class="input" id="addressInput" value="${t.address||''}"></div>
      <div><label>Correo del equipo</label><input class="input" id="teamEmailInput" value="${t.email||''}"></div>
      <div><label>WhatsApp</label><input class="input" id="whatsappInput" value="${t.whatsapp||''}"></div>
      <div><label>Insignia del equipo</label><input class="input" id="crestInput" placeholder="URL pública o ruta: assets/img/equipos/escudo.png" value="${t.crestUrl||''}"><p class="field-help">En GitHub Pages puedes usar una ruta de imagen. Para subida real a Drive se requiere ampliar el Apps Script.</p></div>
    </div>
    <div style="margin-top:14px"><label>Categorías habilitadas</label><div class="category-checks">${cats}</div></div>
    <div class="actions"><button class="btn btn-primary" id="saveProfileBtn">Guardar perfil</button><button class="btn btn-secondary" id="cancelEditProfile">Cancelar</button></div>
  ` : `
    <div class="profile-summary">
      <img class="team-crest-large" src="${crestSrc()}" onerror="this.src='assets/img/logo-pacha-deportes.svg'" alt="Escudo del equipo">
      <div class="form-grid">
        <div><label>Nombre del equipo</label><div class="readonly-field">${t.teamName||'-'}</div></div>
        <div><label>Razón social</label><div class="readonly-field">${t.legalName||'Sin razón social registrada'}</div></div>
        <div><label>Dirección</label><div class="readonly-field">${t.address||'Pendiente'}</div></div>
        <div><label>Correo</label><div class="readonly-field">${t.email||'-'}</div></div>
        <div><label>WhatsApp</label><div class="readonly-field">${t.whatsapp||'Pendiente'}</div></div>
        <div><label>Categorías habilitadas</label><div class="category-list-readonly">${renderCategoryBadges()}</div></div>
      </div>
    </div>
    <div class="actions"><button class="btn btn-primary" id="editProfileBtn">Editar perfil</button></div>
  `;
  document.querySelector('#editProfileBtn')?.addEventListener('click',()=>renderProfile(true));
  document.querySelector('#cancelEditProfile')?.addEventListener('click',()=>renderProfile(false));
  document.querySelector('#saveProfileBtn')?.addEventListener('click',async()=>{
    const categories = [...view.querySelectorAll('.category-check input:checked')].map(i=>i.value).join(',');
    const payload = {
      teamId:t.teamId, teamName:document.querySelector('#teamNameInput').value, legalName:document.querySelector('#legalNameInput').value,
      address:document.querySelector('#addressInput').value, email:document.querySelector('#teamEmailInput').value, whatsapp:document.querySelector('#whatsappInput').value,
      crestUrl:document.querySelector('#crestInput').value, categories
    };
    const res = await API.saveTeamProfile(payload);
    if(res.ok){ coachState.team = {...coachState.team, ...payload}; toast('Perfil actualizado'); renderShell(); renderProfile(false); }
  });
}
function renderPlayerFilters(){
  const wrap = document.querySelector('#playerCategoryFilters');
  if(!wrap) return;
  const cats = teamCategoriesArray();
  const allBtn = `<button class="btn btn-secondary ${coachState.playerFilter==='TODOS'?'active':''}" data-player-filter="TODOS">Todos los jugadores</button>`;
  const catBtns = cats.map(c=>`<button class="btn btn-secondary ${coachState.playerFilter===c?'active':''}" data-player-filter="${c}">${c.replace('SUB','Sub')}</button>`).join('');
  wrap.innerHTML = allBtn + catBtns;
  wrap.querySelectorAll('[data-player-filter]').forEach(btn=>{
    btn.addEventListener('click',()=>{coachState.playerFilter = btn.dataset.playerFilter; renderPlayers();});
  });
}
function renderPlayers(){
  renderPlayerFilters();
  document.querySelectorAll('[data-player-filter]').forEach(b=>b.classList.toggle('active', b.dataset.playerFilter===coachState.playerFilter));
  const grid = document.querySelector('#playersGrid');
  const filtered = coachState.playerFilter==='TODOS' ? coachState.players : coachState.players.filter(p=>playerCategoriesArray(p).includes(coachState.playerFilter));
  const label = coachState.playerFilter==='TODOS' ? 'todos los jugadores' : `categoría ${coachState.playerFilter.replace('SUB','Sub')}`;
  document.querySelector('#playerCount').textContent = `${filtered.length} jugador(es) en ${label}.`;
  grid.innerHTML = filtered.map(p=>`
    <article class="card player-card">
      <img class="avatar" src="${p.photoUrl||`assets/img/jugadores/${p.dni}.png`}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'avatar-fallback',textContent:'${(p.fullName||p.firstName||'J').slice(0,2).toUpperCase()}'}))">
      <div><h3>${p.fullName || `${p.firstName||''} ${p.lastName||''}`}</h3><p>Documento: ${p.documentType || 'DNI'} ${p.dni}</p><p>Fecha de nacimiento: ${p.birthDate}</p><p>Categoría: ${p.categories||simpleCategoryByDOB(p.birthDate)}</p>
      <div class="player-card-actions"><button class="btn btn-small btn-secondary" data-edit-player="${p.playerId}">Editar</button><button class="btn btn-small btn-danger" data-delete-player="${p.playerId}">Eliminar</button></div></div>
    </article>`).join('') || `<div class="card">No hay jugadores en este filtro.</div>`;
  grid.querySelectorAll('[data-edit-player]').forEach(btn=>btn.addEventListener('click',()=>openEditPlayer(btn.dataset.editPlayer)));
  grid.querySelectorAll('[data-delete-player]').forEach(btn=>btn.addEventListener('click',()=>deletePlayer(btn.dataset.deletePlayer)));
}
function openEditPlayer(playerId){
  const player = coachState.players.find(p=>p.playerId===playerId);
  if(!player) return;
  const form = document.querySelector('#playerForm');
  document.querySelector('#playerModal .modal-header h3').textContent = 'Editar jugador';
  form.dataset.editingPlayerId = playerId;
  form.firstName.value = player.firstName || (player.fullName||'').split(' ')[0] || '';
  form.lastName.value = player.lastName || (player.fullName||'').split(' ').slice(1).join(' ') || '';
  form.documentType.value = player.documentType || 'DNI';
  form.dni.value = player.dni || '';
  form.birthDate.value = String(player.birthDate || '').slice(0,10);
  form.photoUrl.value = player.photoUrl || `assets/img/jugadores/${player.dni||''}.png`;
  form.querySelector('[name=birthDate]').dispatchEvent(new Event('change'));
  setTimeout(()=>{
    const cats = playerCategoriesArray(player);
    form.querySelectorAll('#playerCatChecks input').forEach(i=>{ i.checked = cats.includes(categoryBaseName(i.value)); });
  },0);
  document.querySelector('#playerModal').classList.add('open');
}
async function deletePlayer(playerId){
  const player = coachState.players.find(p=>p.playerId===playerId);
  if(!player) return;
  if(!confirm(`¿Eliminar a ${player.fullName || player.firstName || 'este jugador'}? Esta acción no se puede deshacer.`)) return;
  const res = await API.deletePlayer(playerId);
  if(res.ok){ coachState.players = coachState.players.filter(p=>p.playerId!==playerId); toast('Jugador eliminado'); renderPlayers(); }
  else toast(res.message || 'No se pudo eliminar');
}

function renderPlayerForm(){
  const form = document.querySelector('#playerForm');
  const birth = form.querySelector('[name=birthDate]');
  const catBox = form.querySelector('#playerCatChecks');
  function refreshCats(){
    const eligible = categoryOptionsByBirthDate(birth.value).filter(c=>teamCategoriesArray().includes(categoryBaseName(c.name)));
    catBox.innerHTML = eligible.map(c=>`<label class="category-check"><input type="checkbox" value="${c.name}"> ${c.label}</label>`).join('') || '<p>No aplica a ninguna categoría habilitada para este equipo.</p>';
  }
  birth.addEventListener('change',refreshCats); refreshCats();
  document.querySelector('#openPlayerModalBtn')?.addEventListener('click',()=>{
    form.reset(); delete form.dataset.editingPlayerId; document.querySelector('#playerModal .modal-header h3').textContent='Registrar jugador'; refreshCats(); document.querySelector('#playerModal').classList.add('open');
  });
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const fd = new FormData(form);
    const cats = [...catBox.querySelectorAll('input:checked')].map(i=>i.value).join(', ');
    if(!cats){ toast('Selecciona al menos una categoría válida'); return; }
    const selectedCats = cats.split(',').map(c=>categoryBaseName(c));
    for(const c of selectedCats){
      const count = coachState.players.filter(p=>p.playerId!==form.dataset.editingPlayerId && playerCategoriesArray(p).includes(c)).length;
      if(count >= 15){ toast(`Máximo 15 jugadores en ${c.replace('SUB','Sub')}`); return; }
    }
    const firstName = fd.get('firstName'), lastName = fd.get('lastName');
    const player = {playerId:form.dataset.editingPlayerId || '', teamId:coachState.team.teamId, teamName:coachState.team.teamName, firstName, lastName, fullName:`${firstName} ${lastName}`.trim(), documentType:fd.get('documentType'), dni:fd.get('dni'), birthDate:fd.get('birthDate'), categories:cats, photoUrl:fd.get('photoUrl') || `assets/img/jugadores/${fd.get('dni')}.png`};
    const res = form.dataset.editingPlayerId ? await API.updatePlayer(player) : await API.savePlayer(player);
    if(res.ok){
      if(form.dataset.editingPlayerId){
        const idx = coachState.players.findIndex(p=>p.playerId===form.dataset.editingPlayerId); if(idx>=0) coachState.players[idx]=res.player || player;
        toast('Jugador actualizado');
      } else { coachState.players.push(res.player); toast('Jugador registrado'); }
      form.reset(); delete form.dataset.editingPlayerId; refreshCats(); document.querySelector('#playerModal').classList.remove('open'); renderPlayers();
    }
    else toast(res.message||'No se pudo registrar');
  });
}
function matchRoundGroups(){
  return coachState.fixture.reduce((acc,m)=>{(acc[m.round] ||= []).push(m); return acc;},{});
}
function renderCalendar(){
  const box = document.querySelector('#coachCalendar');
  if(!box) return;
  const groups = matchRoundGroups();
  box.innerHTML = Object.keys(groups).sort((a,b)=>Number(a)-Number(b)).map(round=>`
    <div class="card round-card">
      <div class="section-head" style="margin-bottom:12px"><div><h3>Fecha ${round}</h3><p>${groups[round][0]?.dateLabel || ''}</p></div><span class="badge badge-blue">${groups[round].length} partido(s)</span></div>
      <div class="grid grid-2">${groups[round].map(m=>renderMatchCard(m,false)).join('')}</div>
    </div>`).join('') || '<div class="card">No hay partidos programados.</div>';
}
function matchStartDate(m){
  const rawDate = m.matchDate || m.date || '';
  const rawTime = m.time || '00:00';
  if(rawDate){
    const d = new Date(`${String(rawDate).slice(0,10)}T${rawTime}`);
    if(!isNaN(d.getTime())) return d;
  }
  return null;
}
function canEditRoster(m){
  const current = Number(window.APP_CONFIG.CURRENT_ROUND || 3);
  if(Number(m.round) !== current) return false;
  const start = matchStartDate(m);
  if(!start) return true;
  return new Date().getTime() < (start.getTime() - 5*60*1000);
}
function renderMatchCard(m, showAction=true){
  const isOpen = canEditRoster(m);
  const conv = coachState.convocatorias.find(c=>c.matchId===m.matchId);
  return `<article class="card match-card match-card-visual ${conv?'convocado':''} ${!isOpen?'locked':''}">
    <div class="match-meta"><span class="badge badge-green">Fecha ${m.round}</span><span class="badge badge-green">${m.dateLabel}</span><span class="badge badge-green">${m.field} · ${formatTime12(m.time)}</span></div>
    <div class="match-vs-logos">
      <div class="team-side"><img src="${teamLogoPath(m.home)}" onerror="this.src='assets/img/logo-pacha-deportes.svg'"><span>${m.home}</span></div>
      <b>VS</b>
      <div class="team-side right"><img src="${teamLogoPath(m.away)}" onerror="this.src='assets/img/logo-pacha-deportes.svg'"><span>${m.away}</span></div>
    </div>
    <p class="match-category">${m.category}</p>
    ${showAction ? `<div class="actions">
      ${isOpen ? `<button class="btn btn-primary" data-open-roster="${m.matchId}">${conv?'Editar convocatoria':'Abrir convocatoria'}</button>` : `<button class="btn btn-secondary btn-disabled">Convocatoria bloqueada</button>`}
      ${conv ? `<span class="status-badge status-ready">Convocatoria lista</span>`:`<span class="status-badge status-pending">Convocatoria pendiente</span>`}
    </div>` : ''}
  </article>`;
}
function renderMatches(){
  const box = document.querySelector('#coachConvocatorias');
  const current = Number(window.APP_CONFIG.CURRENT_ROUND || 3);
  const candidates = coachState.fixture.filter(m=>Number(m.round) >= current);
  box.innerHTML = candidates.map(m=>renderMatchCard(m,true)).join('') || `<div class="card">No hay convocatorias disponibles para tu equipo.</div>`;
  document.querySelectorAll('[data-open-roster]').forEach(btn=>btn.addEventListener('click',()=>openRoster(btn.dataset.openRoster)));
  renderCalendar();
}
function openRoster(matchId){
  const match = coachState.fixture.find(m=>m.matchId===matchId);
  const existing = coachState.convocatorias.find(c=>c.matchId===matchId) || {starters:[], substitutes:[]};
  const modal = document.querySelector('#rosterModal');
  modal.classList.add('open');
  document.querySelector('#rosterTitle').textContent = `${match.home} vs ${match.away}`;
  document.querySelector('#rosterSubtitle').textContent = `${match.dateLabel} · ${match.field} · ${formatTime12(match.time)} · ${match.category}`;
  let starters = Array.isArray(existing.starters) ? [...existing.starters] : JSON.parse(existing.starters || '[]');
  let substitutes = Array.isArray(existing.substitutes) ? [...existing.substitutes] : JSON.parse(existing.substitutes || '[]');
  function draw(){
    const selected = new Set([...starters, ...substitutes]);
    const matchCat = categoryBaseName(match.category);
    const available = coachState.players.filter(p=>!selected.has(p.playerId) && playerCategoriesArray(p).includes(matchCat));
    document.querySelector('#availablePlayers').innerHTML = available.map(p=>`
      <div class="roster-item"><span>${p.fullName}</span><div><button class="btn btn-small btn-primary" data-add-starter="${p.playerId}">Titular</button> <button class="btn btn-small btn-secondary" data-add-sub="${p.playerId}">Suplente</button></div></div>`).join('') || '<p>No quedan jugadores disponibles para esta categoría.</p>';
    const printList = ids => ids.map(id=>coachState.players.find(p=>p.playerId===id)).filter(Boolean).map(p=>`<div class="roster-item"><span>${p.fullName}</span><button class="btn btn-small btn-danger" data-remove="${p.playerId}">Quitar</button></div>`).join('') || '<p>Sin jugadores.</p>';
    document.querySelector('#startersList').innerHTML = printList(starters);
    document.querySelector('#subsList').innerHTML = printList(substitutes);
    document.querySelectorAll('[data-add-starter]').forEach(b=>b.onclick=()=>{starters.push(b.dataset.addStarter);draw()});
    document.querySelectorAll('[data-add-sub]').forEach(b=>b.onclick=()=>{substitutes.push(b.dataset.addSub);draw()});
    document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{starters=starters.filter(x=>x!==b.dataset.remove);substitutes=substitutes.filter(x=>x!==b.dataset.remove);draw()});
  }
  draw();
  document.querySelector('#saveRosterBtn').onclick = async ()=>{
    const res = await API.saveConvocatoria({matchId, teamId:coachState.team.teamId, teamName:coachState.team.teamName, coachEmail:coachState.user.email, coachName:shortCoachName(coachState.user), match, starters, substitutes});
    if(res.ok){
      const idx = coachState.convocatorias.findIndex(c=>c.matchId===matchId);
      if(idx>=0) coachState.convocatorias[idx]=res.convocatoria; else coachState.convocatorias.push(res.convocatoria);
      toast('Convocatoria guardada'); modal.classList.remove('open'); renderMatches();
    }
  };
}
document.addEventListener('DOMContentLoaded', async ()=>{
  const user = Store.getUser();
  if(!user || user.role!=='entrenador'){ location.href='login.html'; return; }
  coachState.user = user;
  const res = await API.getCoachDashboard(user);
  Object.assign(coachState, res);
  renderShell(); renderProfile(false); renderPlayers(); renderPlayerForm(); renderMatches();
  document.querySelectorAll('.side-menu button[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
  document.querySelector('#logoutBtn').addEventListener('click',()=>Store.logout());
});
