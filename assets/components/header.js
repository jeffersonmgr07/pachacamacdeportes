function getStoredUserForHeader(){
  try{return JSON.parse(localStorage.getItem('mf_user') || 'null')}catch(e){return null}
}
function firstName(name){
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts[0] || '';
}
function rolePanelHref(role){
  const r = String(role || '').toLowerCase();
  if(r === 'admin') return 'admin.html';
  if(['arbitro','árbitro','referee'].includes(r)) return 'arbitro.html';
  return 'entrenador.html';
}
function headerHTML(active = 'deportes', championship = false){
  const user = getStoredUserForHeader();
  const welcome = user ? `<span>Bienvenido ${firstName(user.shortName || user.fullName || user.nombre || user.email)} - Distrito Pachacamac</span>` : `<span>Distrito Pachacamac</span>`;
  const loginLabel = user ? (String(user.role).toLowerCase() === 'admin' ? 'Panel admin' : (['arbitro','árbitro','referee'].includes(String(user.role).toLowerCase()) ? 'Panel árbitro' : 'Panel entrenador')) : 'Iniciar sesión';
  const logo = 'assets/img/logo-pacha-deportes.png';
  const fallback = 'assets/img/logo-pacha-deportes.svg';
  const loginButton = user
    ? `<a class="nav-login-btn" href="${rolePanelHref(user.role)}">${loginLabel}</a>`
    : `<button type="button" class="nav-login-btn" data-open-login>${loginLabel}</button>`;
  const navGeneral = `
    <a class="${active==='deportes'?'active':''}" href="index.html">Deportes</a>
    <a class="${active==='campeonatos'?'active':''}" href="campeonatos.html">Campeonatos</a>
    <a class="${active==='talleres'?'active':''}" href="talleres.html">Talleres</a>
    <a class="${active==='comunicados'?'active':''}" href="comunicados.html">Comunicados</a>
    ${loginButton}
  `;
  const navChamp = `
    <a class="${active==='campeonato'?'active':''}" href="campeonato-futbol-menores-2026.html">Campeonato</a>
    <a class="${active==='fixture'?'active':''}" href="fixture.html">Fixture</a>
    <a class="${active==='resultados'?'active':''}" href="resultados.html">Resultados</a>
    <a class="${active==='tabla'?'active':''}" href="tabla-posiciones.html">Tabla</a>
    <a class="${active==='equipos'?'active':''}" href="equipos.html">Equipos</a>
    ${loginButton}
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
      <nav class="nav" id="mainNav" aria-label="Navegación principal">${championship ? navChamp : navGeneral}</nav>
      <button class="mobile-menu" type="button" data-mobile-menu aria-controls="mainNav" aria-expanded="false" aria-label="Abrir menú">
        <span class="mobile-menu-bars" aria-hidden="true"></span>
        <span class="mobile-menu-text">Menú</span>
      </button>
    </div>
  </header>`;
}

function ensureLoginModal(){
  if(document.querySelector('#loginModal')) return;
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'loginModal';
  modal.innerHTML = `
    <div class="modal-dialog" style="width:min(520px,100%)">
      <div class="modal-header">
        <h3>Iniciar sesión</h3>
        <button class="modal-close" data-close-modal="loginModal">×</button>
      </div>
      <div class="modal-body">
        <form data-login-form>
          <div style="margin-bottom:14px"><label>Correo, usuario o DNI</label><input class="input" name="email" type="text" autocomplete="username" required placeholder="correo@ejemplo.com"></div>
          <div style="margin-bottom:14px"><label>Contraseña</label><input class="input" name="password" type="password" autocomplete="current-password" required placeholder="Ingresa tu contraseña"></div>
          <button class="btn btn-primary" style="width:100%">Iniciar sesión</button>
        </form>
        <p style="color:#9fb1ca;margin-top:16px">Regístrate como delegado o entrenador si tienes algún equipo a tu cargo.</p>
        <a class="btn btn-secondary" style="width:100%" href="registro.html">Registrarte</a>
      </div>
    </div>`;
  document.body.appendChild(modal);
}
function closeMobileNav(){
  document.body.classList.remove('show-nav');
  const btn = document.querySelector('[data-mobile-menu]');
  if(btn){
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-label','Abrir menú');
  }
}
function toggleMobileNav(){
  const btn = document.querySelector('[data-mobile-menu]');
  const open = !document.body.classList.contains('show-nav');
  document.body.classList.toggle('show-nav', open);
  if(btn){
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
}
function initHeaderInteractions(){
  const btn = document.querySelector('[data-mobile-menu]');
  const nav = document.querySelector('#mainNav');
  btn?.addEventListener('click', (e)=>{
    e.stopPropagation();
    toggleMobileNav();
  });
  nav?.addEventListener('click', (e)=>{
    if(e.target.closest('a') || e.target.closest('button')) closeMobileNav();
  });
  document.addEventListener('click', (e)=>{
    if(!document.body.classList.contains('show-nav')) return;
    if(e.target.closest('.header')) return;
    closeMobileNav();
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') closeMobileNav();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const target = document.querySelector('[data-header]');
  if(target) target.innerHTML = headerHTML(target.dataset.active || 'deportes', target.dataset.championship === 'true');
  ensureLoginModal();
  initHeaderInteractions();
});
