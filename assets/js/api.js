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

function mockDB(){
  const m = window.MINETTI_MOCK_DATA || {};
  return {
    users: Store.get('mf_users', m.users || []),
    trainers: Store.get('mf_trainers', m.trainers || []),
    categories: Store.get('mf_categories', m.categories || []),
    fixture: Store.get('mf_fixture', m.fixture || []),
    players: Store.get('mf_players', m.players || []),
    convocatorias: Store.get('mf_convocatorias', [])
  }
}
function saveMockDB(db){
  if(db.users) Store.set('mf_users', db.users);
  if(db.trainers) Store.set('mf_trainers', db.trainers);
  if(db.categories) Store.set('mf_categories', db.categories);
  if(db.fixture) Store.set('mf_fixture', db.fixture);
  if(db.players) Store.set('mf_players', db.players);
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
    if(!window.APP_CONFIG.DEMO_MODE) return jsonp(action, payload);
    const db = mockDB();
    switch(action){
      case 'login': {
        const email = String(payload.email||'').toLowerCase().trim();
        const password = String(payload.password||'').trim();
        const user = db.users.find(u => String(u.email).toLowerCase() === email && String(u.password) === password && u.status !== 'inactivo');
        if(!user) return {ok:false, message:'Correo o clave incorrecta'};
        return {ok:true, user};
      }
      case 'getPublicData': return {ok:true, ...db};
      case 'getCoachDashboard': {
        const user = payload.user || Store.getUser();
        const teamId = user?.teamId;
        const team = db.trainers.find(t=>t.teamId===teamId) || user;
        return {ok:true, user, team, categories:db.categories, players:db.players.filter(p=>p.teamId===teamId), fixture: db.fixture.filter(m=>m.home===team.teamName || m.away===team.teamName), convocatorias: db.convocatorias.filter(c=>c.teamId===teamId)};
      }
      case 'saveTeamProfile': {
        const idx = db.trainers.findIndex(t=>t.teamId===payload.teamId);
        if(idx>=0) db.trainers[idx] = {...db.trainers[idx], ...payload};
        saveMockDB(db); return {ok:true, team: db.trainers[idx]};
      }
      case 'savePlayer': {
        const teamPlayers = db.players.filter(p=>p.teamId===payload.teamId);
        if(teamPlayers.length >= 15) return {ok:false, message:'Máximo 15 jugadores por equipo'};
        const player = {...payload, playerId:'P'+Date.now()};
        db.players.push(player); saveMockDB(db); return {ok:true, player};
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
  saveConvocatoria(data){ return this.request('saveConvocatoria', data); }
};

function openLoginModal(){
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
