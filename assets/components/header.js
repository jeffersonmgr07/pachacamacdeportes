(function () {
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const championshipPages = new Set([
    'campeonato-futbol-menores-2026.html',
    'fixture.html',
    'resultados.html',
    'tabla-posiciones.html',
    'equipos.html',
    'admin.html',
    'entrenador.html'
  ]);
  const isChampionship = championshipPages.has(current);
  const logoSrc = 'assets/img/logo-pacha-deportes.svg';

  const generalLinks = [
    ['index.html', 'Deportes'],
    ['campeonatos.html', 'Campeonatos'],
    ['talleres.html', 'Talleres'],
    ['comunicados.html', 'Comunicados']
  ];

  const tournamentLinks = [
    ['campeonato-futbol-menores-2026.html', 'Campeonato'],
    ['fixture.html', 'Fixture'],
    ['resultados.html', 'Resultados'],
    ['tabla-posiciones.html', 'Tabla'],
    ['equipos.html', 'Equipos'],
    ['#login', 'Login']
  ];

  const links = isChampionship ? tournamentLinks : generalLinks;
  const nav = links.map(([href, label]) => {
    const isLogin = href === '#login';
    const active = !isLogin && (current === href || (current === '' && href === 'index.html'));
    return `<a class="${active ? 'active' : ''}" href="${href}" ${isLogin ? 'data-open-login' : ''}>${label}</a>`;
  }).join('');

  document.write(`
    <header class="site-header">
      <div class="top-strip">
        <span>${isChampionship ? 'Torneo Municipal de Fútbol de Menores 2026' : 'Gestión Deportiva Municipal'}</span>
        <span>Distrito de Pachacamac</span>
      </div>
      <div class="nav-wrap">
        <a class="brand" href="index.html" aria-label="Pacha Deportes">
          <img class="brand-logo" src="${logoSrc}" alt="Pacha Deportes" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';" />
          <span class="brand-shield brand-fallback" style="display:none">PD</span>
        </a>
        <button class="menu-btn" id="menuBtn" aria-label="Abrir menú">☰</button>
        <nav class="main-nav" id="mainNav">${nav}</nav>
      </div>
    </header>
    <div class="login-modal" id="loginModal" aria-hidden="true">
      <div class="login-modal__backdrop" data-close-login></div>
      <section class="login-modal__panel" role="dialog" aria-modal="true" aria-label="Iniciar sesión">
        <button class="modal-close" data-close-login aria-label="Cerrar">×</button>
        <div class="modal-brand"><img src="${logoSrc}" alt="Pacha Deportes"></div>
        <div class="tabs login-tabs">
          <button class="tab-btn active" data-login-tab="login">Ingresar</button>
          <button class="tab-btn" data-login-tab="register">Registrarte</button>
        </div>
        <form id="modalLoginForm" class="modal-panel active" data-login-panel="login">
          <label>Usuario</label>
          <input id="modalUsername" autocomplete="username" placeholder="usuario" required>
          <label>Contraseña</label>
          <input id="modalPassword" type="password" autocomplete="current-password" placeholder="contraseña" required>
          <button class="btn btn-primary full" type="submit">Iniciar sesión</button>
          <p class="sub mini">Demo: admin/admin123 o guerreros/demo123.</p>
        </form>
        <form id="modalRegisterForm" class="modal-panel" data-login-panel="register">
          <div class="form-grid">
            <div><label>Nombre</label><input id="regFirstName" required></div>
            <div><label>Apellido</label><input id="regLastName" required></div>
          </div>
          <label>DNI</label><input id="regDni" placeholder="DNI del entrenador" required>
          <label>WhatsApp</label><input id="regWhatsapp" placeholder="+51 999 999 999">
          <label>Equipo</label><input id="regTeamName" placeholder="Nombre del equipo o academia" required>
          <button class="btn btn-primary full" type="submit">Solicitar registro</button>
          <p class="sub mini">La clave temporal sugerida será: DNI + inicial del primer nombre + 2026.</p>
        </form>
      </section>
    </div>
  `);

  window.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('loginModal');
    document.querySelectorAll('[data-open-login]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); });
    });
    document.querySelectorAll('[data-close-login]').forEach(el => {
      el.addEventListener('click', () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); });
    });
    document.querySelectorAll('[data-login-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-login-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('[data-login-panel]').forEach(panel => panel.classList.remove('active'));
        document.querySelector(`[data-login-panel="${btn.dataset.loginTab}"]`).classList.add('active');
      });
    });
    const modalLoginForm = document.getElementById('modalLoginForm');
    if (modalLoginForm) modalLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('modalUsername').value.trim();
      const password = document.getElementById('modalPassword').value.trim();
      const res = await MF.call('login', { username, password });
      if (!res.ok) return MF.toast(res.message || 'No se pudo ingresar.', 'error');
      MF.setSession(res.user);
      location.href = res.user.role === 'admin' ? 'admin.html' : 'entrenador.html';
    });
    const modalRegisterForm = document.getElementById('modalRegisterForm');
    if (modalRegisterForm) modalRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        firstName: document.getElementById('regFirstName').value.trim(),
        lastName: document.getElementById('regLastName').value.trim(),
        dni: document.getElementById('regDni').value.trim(),
        whatsapp: document.getElementById('regWhatsapp').value.trim(),
        teamName: document.getElementById('regTeamName').value.trim()
      };
      const res = await MF.call('registerCoachRequest', payload, 'POST');
      MF.toast(res.message || 'Solicitud registrada.');
      modalRegisterForm.reset();
    });
  });
})();
