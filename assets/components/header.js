function getStoredUserForHeader(){
  try{return JSON.parse(localStorage.getItem('mf_user') || 'null')}catch(e){return null}
}
function firstName(name){
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts[0] || '';
}
function headerHTML(active = 'deportes', championship = false){
  const user = getStoredUserForHeader();
  const welcome = user ? `<span>Bienvenido ${firstName(user.shortName || user.fullName || user.nombre)} - Distrito Pachacamac</span>` : `<span>Distrito Pachacamac</span>`;
  const loginLabel = user ? (user.role === 'admin' ? 'Panel admin' : 'Panel entrenador') : 'Login';
  const logo = 'assets/img/logo-pacha-deportes.png';
  const fallback = 'assets/img/logo-pacha-deportes.svg';
  const navGeneral = `
    <a class="${active==='deportes'?'active':''}" href="index.html">Deportes</a>
    <a class="${active==='campeonatos'?'active':''}" href="campeonatos.html">Campeonatos</a>
    <a class="${active==='talleres'?'active':''}" href="talleres.html">Talleres</a>
    <a class="${active==='comunicados'?'active':''}" href="comunicados.html">Comunicados</a>
  `;
  const navChamp = `
    <a class="${active==='campeonato'?'active':''}" href="campeonato-futbol-menores-2026.html">Campeonato</a>
    <a class="${active==='fixture'?'active':''}" href="fixture.html">Fixture</a>
    <a class="${active==='resultados'?'active':''}" href="resultados.html">Resultados</a>
    <a class="${active==='tabla'?'active':''}" href="tabla-posiciones.html">Tabla</a>
    <a class="${active==='equipos'?'active':''}" href="equipos.html">Equipos</a>
    <button type="button" data-open-login>${loginLabel}</button>
  `;
  return `
  <div class="topbar">
    <div class="container topbar-inner">
      <span>Gestión Deportiva</span>
      ${welcome}
    </div>
  </div>
  <header class="header">
    <div class="container header-inner">
      <a href="index.html" class="brand brand-logo-only" aria-label="Ir al inicio">
        <img src="${logo}" onerror="this.src='${fallback}'" alt="Logo Pacha Deportes">
      </a>
      <nav class="nav">${championship ? navChamp : navGeneral}</nav>
      <button class="mobile-menu" onclick="document.body.classList.toggle('show-nav')">Menú</button>
    </div>
  </header>`;
}
document.addEventListener('DOMContentLoaded', () => {
  const target = document.querySelector('[data-header]');
  if(target) target.innerHTML = headerHTML(target.dataset.active || 'deportes', target.dataset.championship === 'true');
});
