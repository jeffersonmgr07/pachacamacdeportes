(function () {
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const links = [
    ['index.html', 'Inicio'],
    ['fixture.html', 'Fixture'],
    ['resultados.html', 'Resultados'],
    ['tabla-posiciones.html', 'Tabla'],
    ['equipos.html', 'Equipos'],
    ['login.html', 'Acceso']
  ];
  const nav = links.map(([href, label]) => {
    const active = current === href || (current === '' && href === 'index.html');
    return `<a class="${active ? 'active' : ''}" href="${href}">${label}</a>`;
  }).join('');

  document.write(`
    <header class="site-header">
      <div class="top-strip">
        <span>Torneo Municipal de Fútbol de Menores 2026</span>
        <span>Estadio Sector B · Pachacamac</span>
      </div>
      <div class="nav-wrap">
        <a class="brand" href="index.html" aria-label="Minetti Fútbol">
          <span class="brand-shield">MF</span>
          <span>
            <strong>Minetti Fútbol</strong>
            <small>Gestión Deportiva</small>
          </span>
        </a>
        <button class="menu-btn" id="menuBtn" aria-label="Abrir menú">☰</button>
        <nav class="main-nav" id="mainNav">${nav}</nav>
      </div>
    </header>
  `);
})();
