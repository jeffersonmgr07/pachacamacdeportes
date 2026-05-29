let coachState = {user:null, team:null, categories:[], players:[], fixture:[], convocatorias:[]};

function categoryOptionsByBirthDate(birthDate){
  if(!birthDate) return [];
  const y = new Date(birthDate).getFullYear();
  // En menores puede jugar en su categoría o categorías superiores.
  return coachState.categories.filter(c => y >= Number(c.minYear) && y <= 2021 && Number(c.minYear) <= y || (y >= Number(c.minYear) && y <= Number(c.maxYear)))
    .concat(coachState.categories.filter(c => {
      const min = Number(c.minYear), max=Number(c.maxYear);
      return y > max && y <= 2021; // nacido más joven puede subir
    }))
    .filter((v,i,a)=>a.findIndex(x=>x.categoryId===v.categoryId)===i);
}
function simpleCategoryByDOB(birthDate){
  if(!birthDate) return '';
  const y = new Date(birthDate).getFullYear();
  const exact = coachState.categories.find(c=>y>=Number(c.minYear) && y<=Number(c.maxYear));
  return exact ? exact.name : '';
}

function renderShell(){
  const user = coachState.user;
  document.querySelector('#coachName').textContent = user.shortName || user.fullName;
  document.querySelector('#coachWelcome').textContent = `Bienvenido ${user.shortName || user.fullName}`;
  document.querySelector('#coachSubtitle').textContent = 'Gestiona tu perfil, jugadores, partidos y convocatorias del equipo.';
}
function setTab(tab){
  document.querySelectorAll('.side-menu button[data-tab]').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.tabs-content').forEach(s=>s.classList.toggle('active', s.id===`tab-${tab}`));
}
function renderProfile(edit=false){
  const t = coachState.team || {};
  const view = document.querySelector('#profileBox');
  const cats = coachState.categories.map(c => `
    <label class="category-check"><input type="checkbox" value="${c.name}" ${(t.categories||'SUB 6,SUB 8,SUB 10,SUB 12').includes(c.name)?'checked':''} ${edit?'':'disabled'}> ${c.label}</label>`).join('');
  view.innerHTML = edit ? `
    <div class="form-grid">
      <div><label>Nombre del equipo</label><input class="input" id="teamNameInput" value="${t.teamName||''}"></div>
      <div><label>Razón social</label><input class="input" id="legalNameInput" value="${t.legalName||''}"></div>
      <div><label>Dirección</label><input class="input" id="addressInput" value="${t.address||''}"></div>
      <div><label>Correo del equipo</label><input class="input" id="teamEmailInput" value="${t.email||''}"></div>
      <div><label>WhatsApp</label><input class="input" id="whatsappInput" value="${t.whatsapp||''}"></div>
      <div><label>Insignia del equipo</label><input class="input" id="crestInput" placeholder="URL o ruta de imagen" value="${t.crestUrl||''}"></div>
    </div>
    <div style="margin-top:14px"><label>Categorías habilitadas</label><div class="category-checks">${cats}</div></div>
    <div class="actions"><button class="btn btn-primary" id="saveProfileBtn">Guardar perfil</button><button class="btn btn-secondary" id="cancelEditProfile">Cancelar</button></div>
  ` : `
    <div class="form-grid">
      <div><label>Nombre del equipo</label><div class="readonly-field">${t.teamName||'-'}</div></div>
      <div><label>Razón social</label><div class="readonly-field">${t.legalName||'Sin razón social registrada'}</div></div>
      <div><label>Dirección</label><div class="readonly-field">${t.address||'Pendiente'}</div></div>
      <div><label>Correo</label><div class="readonly-field">${t.email||'-'}</div></div>
      <div><label>WhatsApp</label><div class="readonly-field">${t.whatsapp||'Pendiente'}</div></div>
      <div><label>Insignia del equipo</label><div class="readonly-field">${t.crestUrl ? 'Insignia cargada' : 'Pendiente'}</div></div>
    </div>
    <div style="margin-top:14px"><label>Categorías habilitadas</label><div class="category-checks">${cats}</div></div>
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
    if(res.ok){ coachState.team = {...coachState.team, ...payload}; toast('Perfil actualizado'); renderProfile(false); }
  });
}
function renderPlayers(){
  const grid = document.querySelector('#playersGrid');
  document.querySelector('#playerCount').textContent = `${coachState.players.length} jugadores`;
  grid.innerHTML = coachState.players.map(p=>`
    <article class="card player-card">
      <img class="avatar" src="${p.photoUrl||`assets/IMG/jugadores/${p.dni}.png`}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'avatar-fallback',textContent:'${(p.fullName||'J').slice(0,2).toUpperCase()}'}))">
      <div><h3>${p.fullName}</h3><p>DNI: ${p.dni}</p><p>Fecha de nacimiento: ${p.birthDate}</p><p>Categoría: ${p.categories||simpleCategoryByDOB(p.birthDate)}</p></div>
    </article>`).join('') || `<div class="card">Aún no hay jugadores registrados.</div>`;
}
function renderPlayerForm(){
  const form = document.querySelector('#playerForm');
  const birth = form.querySelector('[name=birthDate]');
  const catBox = form.querySelector('#playerCatChecks');
  function refreshCats(){
    const y = birth.value ? new Date(birth.value).getFullYear() : null;
    const eligible = coachState.categories.filter(c=>{
      if(!y) return true;
      const min=Number(c.minYear), max=Number(c.maxYear);
      return (y>=min && y<=max) || (y>max && y<=2021); // puede subir
    });
    catBox.innerHTML = eligible.map(c=>`<label class="category-check"><input type="checkbox" value="${c.name}"> ${c.label}</label>`).join('') || '<p>No aplica a ninguna categoría registrada.</p>';
  }
  birth.addEventListener('change',refreshCats); refreshCats();
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    if(coachState.players.length >= 15){ toast('Máximo 15 jugadores por equipo'); return; }
    const fd = new FormData(form);
    const cats = [...catBox.querySelectorAll('input:checked')].map(i=>i.value).join(', ');
    if(!cats){ toast('Selecciona al menos una categoría válida'); return; }
    const player = {teamId:coachState.team.teamId, teamName:coachState.team.teamName, fullName:fd.get('fullName'), dni:fd.get('dni'), birthDate:fd.get('birthDate'), categories:cats, photoUrl:fd.get('photoUrl') || `assets/IMG/jugadores/${fd.get('dni')}.png`};
    const res = await API.savePlayer(player);
    if(res.ok){ coachState.players.push(res.player); toast('Jugador registrado'); form.reset(); refreshCats(); renderPlayers(); }
    else toast(res.message||'No se pudo registrar');
  });
}
function renderMatches(){
  const box = document.querySelector('#coachMatches');
  const current = Number(window.APP_CONFIG.CURRENT_ROUND || 3);
  box.innerHTML = coachState.fixture.map(m=>{
    const round = Number(m.round);
    const isOpen = round === current;
    const conv = coachState.convocatorias.find(c=>c.matchId===m.matchId);
    return `<article class="card match-card ${conv?'convocado':''} ${!isOpen?'locked':''}">
      <div class="match-meta"><span class="badge badge-green">Fecha ${m.round}</span><span class="badge badge-blue">${m.dateLabel}</span><span class="badge badge-gold">${m.field} · ${m.time}</span></div>
      <div class="match-teams"><span>${m.home}</span><span>VS</span><span class="away">${m.away}</span></div>
      <p>${m.category}</p>
      <div class="actions">
        ${isOpen ? `<button class="btn btn-primary" data-open-roster="${m.matchId}">${conv?'Editar convocatoria':'Abrir convocatoria'}</button>` : `<button class="btn btn-secondary btn-disabled">Convocatoria bloqueada</button>`}
        ${conv ? `<span class="badge badge-green">Convocado</span>`:''}
      </div>
    </article>`;
  }).join('') || `<div class="card">No hay partidos programados para tu equipo.</div>`;
  document.querySelectorAll('[data-open-roster]').forEach(btn=>btn.addEventListener('click',()=>openRoster(btn.dataset.openRoster)));
}
function openRoster(matchId){
  const match = coachState.fixture.find(m=>m.matchId===matchId);
  const existing = coachState.convocatorias.find(c=>c.matchId===matchId) || {starters:[], substitutes:[]};
  const modal = document.querySelector('#rosterModal');
  modal.classList.add('open');
  document.querySelector('#rosterTitle').textContent = `${match.home} vs ${match.away}`;
  document.querySelector('#rosterSubtitle').textContent = `${match.dateLabel} · ${match.field} · ${match.time} · ${match.category}`;
  let starters = [...existing.starters], substitutes = [...existing.substitutes];
  function draw(){
    const selected = new Set([...starters, ...substitutes]);
    const available = coachState.players.filter(p=>!selected.has(p.playerId));
    document.querySelector('#availablePlayers').innerHTML = available.map(p=>`
      <div class="roster-item"><span>${p.fullName}</span><div><button class="btn btn-small btn-primary" data-add-starter="${p.playerId}">Titular</button> <button class="btn btn-small btn-secondary" data-add-sub="${p.playerId}">Suplente</button></div></div>`).join('') || '<p>No quedan jugadores disponibles.</p>';
    const printList = ids => ids.map(id=>coachState.players.find(p=>p.playerId===id)).filter(Boolean).map(p=>`<div class="roster-item"><span>${p.fullName}</span><button class="btn btn-small btn-danger" data-remove="${p.playerId}">Quitar</button></div>`).join('') || '<p>Sin jugadores.</p>';
    document.querySelector('#startersList').innerHTML = printList(starters);
    document.querySelector('#subsList').innerHTML = printList(substitutes);
    document.querySelectorAll('[data-add-starter]').forEach(b=>b.onclick=()=>{starters.push(b.dataset.addStarter);draw()});
    document.querySelectorAll('[data-add-sub]').forEach(b=>b.onclick=()=>{substitutes.push(b.dataset.addSub);draw()});
    document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{starters=starters.filter(x=>x!==b.dataset.remove);substitutes=substitutes.filter(x=>x!==b.dataset.remove);draw()});
  }
  draw();
  document.querySelector('#saveRosterBtn').onclick = async ()=>{
    const res = await API.saveConvocatoria({matchId, teamId:coachState.team.teamId, teamName:coachState.team.teamName, starters, substitutes});
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
