const Store = {
  getUser(){ try{return JSON.parse(localStorage.getItem('mf_user')||'null')}catch(e){return null} },
  setUser(u){ localStorage.setItem('mf_user', JSON.stringify(u)); },
  logout(){ localStorage.removeItem('mf_user'); location.href='index.html'; },
  get(k, fallback){ try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(fallback))}catch(e){return fallback} },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};

function toast(msg){
  let t = document.querySelector('.toast');
  if(!t){ t = document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2600);
}


function teamSlug(name){
  return String(name||'equipo')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}
function normalizeImagePath(path){
  if(!path) return '';
  const p = String(path).trim();
  if(/^https?:\/\//i.test(p)) return p;
  return p.replace(/^\/?/, '');
}
function teamLogoPath(teamName, teamId){
  const cachedTeams = Store.get('mf_teams', []);
  const db = window.APP_CONFIG?.DEMO_MODE ? mockDB() : {teams: cachedTeams};
  const name = String(teamName || '').trim().toUpperCase();
  const id = String(teamId || '').trim();
  const team = (db.teams||[]).find(t =>
    String(t.teamName || '').trim().toUpperCase() === name ||
    (id && String(t.teamId || '').trim().toUpperCase() === id.toUpperCase())
  );
  const direct = normalizeImagePath(team?.crestUrl || team?.crest || team?.logoUrl);
  if(direct) return direct;
  if(team?.teamId) return `assets/img/equipos/${String(team.teamId).trim()}.PNG`;
  if(id) return `assets/img/equipos/${id}.PNG`;
  return `assets/img/equipos/${teamSlug(teamName)}.png`;
}
function formatTime12(time){
  if(!time || String(time).toUpperCase().includes('POR')) return time || 'Por definir';
  const parts = String(time).split(':'); let h = Number(parts[0]); const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM'; let hh = h % 12; if(hh===0) hh=12;
  return `${String(hh).padStart(2,'0')}:${m} ${ampm}`;
}


function matchDateForSort(m){ return String(m.matchDate || m.date || m[3] || '9999-99-99'); }
function matchTimeForSort(m){
  const t = String(m.time || m[5] || '99:99');
  if(t.toUpperCase().includes('POR')) return '99:99';
  const [h='99', mm='00'] = t.split(':');
  return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}
function sortFixtureRows(rows){
  return [...(rows || [])].sort((a,b)=>
    matchDateForSort(a).localeCompare(matchDateForSort(b)) ||
    matchTimeForSort(a).localeCompare(matchTimeForSort(b)) ||
    String(a.matchId || a[0] || '').localeCompare(String(b.matchId || b[0] || ''))
  );
}

function normalizeMatch(m){
  if(!Array.isArray(m)) return m;
  return {
    matchId:m[0], round:m[1], dateLabel:m[2], date:m[3], field:m[4], time:m[5],
    home:m[6], away:m[7], category:m[8], status:m[9], homeScore:m[10] || '', awayScore:m[11] || '', resultType:m[12] || ''
  };
}
function mockDB(){
  const m = window.MINETTI_MOCK_DATA || {};
  return {
    users: Store.get('mf_users', m.users || []),
    trainers: Store.get('mf_trainers', m.trainers || []),
    categories: Store.get('mf_categories', m.categories || []),
    fixture: sortFixtureRows(Store.get('mf_fixture', (m.fixture || []).map(normalizeMatch)).map(normalizeMatch)),
    players: Store.get('mf_players', m.players || []),
    teams: Store.get('mf_teams', m.teams || []),
    descansos: Store.get('mf_descansos', m.descansos || []),
    convocatorias: Store.get('mf_convocatorias', [])
  }
}
function saveMockDB(db){
  if(db.users) Store.set('mf_users', db.users);
  if(db.trainers) Store.set('mf_trainers', db.trainers);
  if(db.categories) Store.set('mf_categories', db.categories);
  if(db.fixture) Store.set('mf_fixture', db.fixture);
  if(db.players) Store.set('mf_players', db.players);
  if(db.teams) Store.set('mf_teams', db.teams);
  if(db.descansos) Store.set('mf_descansos', db.descansos);
  if(db.convocatorias) Store.set('mf_convocatorias', db.convocatorias);
}

function jsonp(action, payload={}){
  return new Promise((resolve,reject)=>{
    if(!window.APP_CONFIG.API_URL){ reject(new Error('Falta configurar API_URL')); return; }
    const cb = 'cb_' + Math.random().toString(36).slice(2);
    window[cb] = (res)=>{ resolve(res); delete window[cb]; script.remove(); };
    const params = new URLSearchParams({action, callback:cb, payload:JSON.stringify(payload)});
    const script = document.createElement('script');
    script.src = `${window.APP_CONFIG.API_URL}?${params.toString()}`;
    script.onerror = () => { reject(new Error('No se pudo conectar con Apps Script')); delete window[cb]; script.remove(); };
    document.body.appendChild(script);
  });
}

const API = {
  async request(action, payload={}){
    if(!window.APP_CONFIG.DEMO_MODE){
      const res = await jsonp(action, payload);
      // Cache ligero para que helpers visuales, como teamLogoPath(), usen datos reales de Sheets.
      if(res && res.teams) Store.set('mf_teams', res.teams);
      if(res && res.categories) Store.set('mf_categories', res.categories);
      if(res && res.players && action === 'getPublicData') Store.set('mf_players', res.players);
      return res;
    }
    const db = mockDB();
    switch(action){
      case 'login': {
        const email = String(payload.email||'').toLowerCase().trim();
        const password = String(payload.password||'').trim();
        const user = db.users.find(u => String(u.email).toLowerCase() === email && String(u.password) === password && u.status !== 'inactivo');
        if(!user) return {ok:false, message:'Correo o clave incorrecta'};
        return {ok:true, user};
      }
      case 'getPublicData': return {ok:true, ...db, fixture: sortFixtureRows(db.fixture)};
      case 'getCoachDashboard': {
        const user = payload.user || Store.getUser();
        const teamId = user?.teamId;
        const team = db.trainers.find(t=>t.teamId===teamId) || user;
        return {ok:true, user, team, categories:db.categories, players:db.players.filter(p=>p.teamId===teamId), fixture: sortFixtureRows(db.fixture.filter(m=>m.home===team.teamName || m.away===team.teamName)), convocatorias: db.convocatorias.filter(c=>c.teamId===teamId)};
      }
      case 'saveTeamProfile': {
        const idx = db.trainers.findIndex(t=>t.teamId===payload.teamId);
        if(idx>=0) db.trainers[idx] = {...db.trainers[idx], ...payload};
        saveMockDB(db); return {ok:true, team: db.trainers[idx]};
      }
      case 'savePlayer': {
        const payloadCats = String(payload.categories||payload.category||'').split(',').map(x=>x.replace(/\s*\(.+?\)/g,'').trim().toUpperCase()).filter(Boolean);
        for(const c of payloadCats){
          const count = db.players.filter(p=>p.teamId===payload.teamId && String(p.categories||p.category||'').toUpperCase().includes(c)).length;
          if(count >= 15) return {ok:false, message:`Máximo 15 jugadores por categoría (${c.replace('SUB','Sub')})`};
        }
        const player = {...payload, playerId:'P'+Date.now()};
        db.players.push(player); saveMockDB(db); return {ok:true, player};
      }
      case 'updatePlayer': {
        const idx = db.players.findIndex(p=>p.playerId===payload.playerId);
        if(idx < 0) return {ok:false, message:'Jugador no encontrado'};
        db.players[idx] = {...db.players[idx], ...payload};
        saveMockDB(db); return {ok:true, player:db.players[idx]};
      }
      case 'deletePlayer': {
        const id = payload.playerId;
        db.players = db.players.filter(p=>p.playerId!==id);
        saveMockDB(db); return {ok:true};
      }
      case 'saveConvocatoria': {
        const existing = db.convocatorias.findIndex(c=>c.matchId===payload.matchId && c.teamId===payload.teamId);
        const item = {...payload, status:'convocado', savedAt:new Date().toISOString()};
        if(existing>=0) db.convocatorias[existing]=item; else db.convocatorias.push(item);
        saveMockDB(db); return {ok:true, convocatoria:item};
      }
      case 'saveResult': {
        const idx = db.fixture.findIndex(m=>m[0]===payload.matchId || m.matchId===payload.matchId);
        if(idx>=0) db.fixture[idx] = {...db.fixture[idx], ...payload, status:'jugado'};
        saveMockDB(db); return {ok:true};
      }
      default: return {ok:false, message:'Acción no implementada en demo'};
    }
  },
  login(email,password){ return this.request('login',{email,password}); },
  getPublicData(){ return this.request('getPublicData'); },
  getCoachDashboard(user){ return this.request('getCoachDashboard',{user}); },
  saveTeamProfile(profile){ return this.request('saveTeamProfile', profile); },
  savePlayer(player){ return this.request('savePlayer', player); },
  updatePlayer(player){ return this.request('updatePlayer', player); },
  deletePlayer(playerId){ return this.request('deletePlayer', {playerId}); },
  saveConvocatoria(data){ return this.request('saveConvocatoria', data); }
};

function openLoginModal(){
  const user = Store.getUser();
  if(user){
    location.href = user.role === 'admin' ? 'admin.html' : 'entrenador.html';
    return;
  }
  const modal = document.querySelector('#loginModal');
  if(modal) modal.classList.add('open');
  else location.href='login.html';
}
function closeModal(id){ document.getElementById(id)?.classList.remove('open'); }

document.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-open-login]');
  if(btn) openLoginModal();
  const closer = e.target.closest('[data-close-modal]');
  if(closer) closeModal(closer.dataset.closeModal);
});
