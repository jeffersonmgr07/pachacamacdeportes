const MF = (() => {
  const cfg = window.MF_CONFIG || {};
  const mock = window.MF_MOCK_DATA || {};

  function qs(params) {
    return new URLSearchParams(params).toString();
  }

  async function call(action, payload = {}, method = 'GET') {
    if (cfg.DEMO_MODE || !cfg.API_URL) {
      return fake(action, payload);
    }

    if (method === 'GET') {
      const url = `${cfg.API_URL}?${qs({ action, ...payload })}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json();
    }

    const res = await fetch(cfg.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload })
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  }

  async function fake(action, payload) {
    await new Promise(r => setTimeout(r, 180));
    const data = JSON.parse(JSON.stringify(mock));

    if (action === 'login') {
      const loginValue = String(payload.username || payload.email || '').toLowerCase().trim();
      const user = data.users.find(u => 
        (String(u.username || '').toLowerCase().trim() === loginValue || String(u.email || '').toLowerCase().trim() === loginValue) &&
        String(u.password) === String(payload.password) &&
        String(u.status || 'activo').toLowerCase() === 'activo'
      );
      if (!user) return { ok: false, message: 'Usuario o contraseña incorrectos.' };
      return { ok: true, user: { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name, teamId: user.teamId, teamName: user.teamName } };
    }

    if (action === 'registerCoachRequest') {
      const initial = String(payload.firstName || '').trim().charAt(0).toUpperCase();
      const tempPassword = `${String(payload.dni || '').replace(/\D/g,'')}${initial}2026`;
      return { ok: true, message: `Solicitud registrada en modo demo. Clave temporal sugerida: ${tempPassword}`, tempPassword };
    }

    if (action === 'getPublicData') return { ok: true, data };
    if (action === 'getFixture') return { ok: true, fixture: data.fixture, categories: data.rules.categories };
    if (action === 'getTeams') return { ok: true, teams: data.teams, categories: data.rules.categories };
    if (action === 'getPlayers') {
      const players = data.players.filter(p => !payload.teamId || p.teamId === payload.teamId);
      return { ok: true, players };
    }
    if (action === 'getCoachDashboard') {
      const team = data.teams.find(t => t.id === payload.teamId) || data.teams.find(t => t.name === 'GUERREROS DE MANCHAY');
      team.businessName = team.businessName || 'Academia Deportiva Guerreros de Manchay';
      team.address = team.address || 'Distrito de Pachacamac';
      team.whatsapp = team.whatsapp || '+51 900 000 000';
      team.email = team.email || (data.users.find(u => u.teamId === team.id)?.email || 'sin-correo@demo.local');
      team.badgeFileName = team.badgeFileName || 'logo-placeholder.svg';
      team.enabledCategories = team.enabledCategories || ['SUB6','SUB8','SUB10','SUB12'];
      const players = data.players.filter(p => p.teamId === team.id);
      const matches = data.fixture.filter(m => [m.home, m.away].includes(team.name)).map(m => ({...m, isOpen: Number(m.round) === 3, isFuture: Number(m.round) > 3}));
      return { ok: true, team, players, matches, categories: data.rules.categories, championships: data.championships || [] };
    }
    if (action === 'saveTeamProfile') return { ok: true, message: 'Perfil guardado en modo demo.' };
    if (action === 'savePlayer') return { ok: true, message: 'Jugador registrado en modo demo.' };
    if (action === 'saveConvocation') return { ok: true, message: 'Convocatoria enviada en modo demo.', id: `CONV-${Date.now()}`, status: 'convocado' };
    if (action === 'getAdminDashboard') {
      return { ok: true, ...data, users: data.users };
    }
    if (action === 'saveResult') return { ok: true, message: 'Resultado guardado en modo demo.' };

    return { ok: true, data };
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(cfg.STORAGE_KEYS.session) || 'null'); }
    catch { return null; }
  }

  function setSession(user) {
    localStorage.setItem(cfg.STORAGE_KEYS.session, JSON.stringify(user));
  }

  function logout() {
    localStorage.removeItem(cfg.STORAGE_KEYS.session);
    location.href = 'login.html';
  }

  function requireRole(roles) {
    const session = getSession();
    if (!session || !roles.includes(session.role)) {
      location.href = 'login.html';
      return null;
    }
    return session;
  }

  function categoryLabel(id) {
    return (mock.rules?.categories || []).find(c => c.id === id)?.label || id;
  }

  function normalize(str) {
    return String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function calculateStandings(fixture) {
    const table = {};
    (fixture || []).forEach(m => {
      if (!table[`${m.category}|${m.group}|${m.home}`]) table[`${m.category}|${m.group}|${m.home}`] = initTeam(m.home, m.category, m.group);
      if (!table[`${m.category}|${m.group}|${m.away}`]) table[`${m.category}|${m.group}|${m.away}`] = initTeam(m.away, m.category, m.group);
      if (m.status !== 'jugado' || m.homeScore === undefined || m.awayScore === undefined || m.homeScore === null || m.awayScore === null) return;
      const h = table[`${m.category}|${m.group}|${m.home}`], a = table[`${m.category}|${m.group}|${m.away}`];
      h.pj++; a.pj++;
      h.gf += Number(m.homeScore); h.gc += Number(m.awayScore);
      a.gf += Number(m.awayScore); a.gc += Number(m.homeScore);
      if (Number(m.homeScore) > Number(m.awayScore)) { h.pg++; a.pp++; h.pts += 3; }
      else if (Number(m.homeScore) < Number(m.awayScore)) { a.pg++; h.pp++; a.pts += 3; }
      else { h.pe++; a.pe++; h.pts += 1; a.pts += 1; }
      h.dg = h.gf - h.gc; a.dg = a.gf - a.gc;
    });
    return Object.values(table).sort((a,b) => 
      a.category.localeCompare(b.category) || String(a.group).localeCompare(String(b.group)) || 
      b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.team.localeCompare(b.team)
    );
  }
  function initTeam(team, category, group) { return { team, category, group, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, dg:0, pts:0 }; }

  function toast(message, type = 'ok') {
    const box = document.createElement('div');
    box.className = `toast ${type}`;
    box.textContent = message;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3000);
  }

  function imgForPlayer(player) {
    const file = player.photoFileName || `${player.dni}.png`;
    return `${cfg.PHOTO_BASE_PATH}${file}`;
  }



  function eligibleCategoriesForBirthDate(birthDate) {
    const year = new Date(birthDate).getFullYear();
    if (!year || Number.isNaN(year)) return [];
    const cats = mock.rules?.categories || [];
    return cats.filter(c => {
      const years = String(c.birthYears || '').match(/\d{4}/g) || [];
      if (!years.length) return false;
      const nums = years.map(Number);
      return year >= Math.min(...nums);
    });
  }

  function generateTempPassword(dni, firstName) {
    return `${String(dni || '').replace(/\D/g,'')}${String(firstName || '').trim().charAt(0).toUpperCase()}2026`;
  }

  return { call, getSession, setSession, logout, requireRole, categoryLabel, normalize, calculateStandings, toast, imgForPlayer, eligibleCategoriesForBirthDate, generateTempPassword };
})();

window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('menuBtn');
  const nav = document.getElementById('mainNav');
  if (btn && nav) btn.addEventListener('click', () => nav.classList.toggle('open'));
  document.querySelectorAll('[data-logout]').forEach(el => el.addEventListener('click', MF.logout));
});
