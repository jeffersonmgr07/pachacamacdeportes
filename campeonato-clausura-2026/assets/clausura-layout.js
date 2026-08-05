(() => {
  'use strict';
  const root = '../';
  function header(active){
    return `<div class="topbar"><div class="container topbar-inner"><span>Gestión Deportiva</span><span>Municipalidad Distrital de Pachacámac</span></div></div>
    <header class="header"><div class="container header-inner">
      <a class="brand brand-logo-only" href="${root}index.html" aria-label="Ir al portal deportivo"><img src="${root}assets/img/logo-pacha-deportes.png" alt="Pacha Deportes"></a>
      <nav class="nav clausura-nav" id="clausuraNav" aria-label="Campeonato Clausura 2026">
        <a class="${active==='inicio'?'active':''}" href="index.html">Información</a>
        <a class="${active==='inscripcion'?'active':''}" href="inscripcion.html">Inscribir equipo</a>
        <a class="${active==='estado'?'active':''}" href="estado.html">Estado y pago</a>
        <a class="${active==='panel'?'active':''}" href="panel.html">Panel del delegado</a>
        <a href="${root}campeonatos.html">Otros campeonatos</a>
      </nav>
      <button class="mobile-menu" type="button" data-clausura-menu aria-controls="clausuraNav" aria-expanded="false"><span class="mobile-menu-bars" aria-hidden="true"></span><span class="mobile-menu-text">Menú</span></button>
    </div></header>`;
  }
  function footer(){
    return `<footer class="footer"><div class="container"><div class="footer-grid"><div><img class="footer-logo" src="${root}assets/img/logo-pacha-deportes.png" alt="Pacha Deportes"><p>Campeonato Municipal Clausura de Fútbol de Menores 2026.</p></div><div><strong>Enlaces</strong><div class="footer-links"><a href="index.html">Información</a><a href="inscripcion.html">Inscripción</a><a href="panel.html">Panel del delegado</a></div></div><div><strong>Informes</strong><p>WhatsApp: 992 211 457</p><p>Estadio del Sector B - Huertos de Manchay</p></div></div><div class="footer-bottom"><span>Municipalidad Distrital de Pachacámac</span><span>Clausura 2026</span></div></div></footer>`;
  }
  document.addEventListener('DOMContentLoaded', () => {
    const h = document.querySelector('[data-clausura-header]');
    if(h) h.innerHTML = header(h.dataset.active || 'inicio');
    const f = document.querySelector('[data-clausura-footer]');
    if(f) f.innerHTML = footer();
    const button = document.querySelector('[data-clausura-menu]');
    button?.addEventListener('click', () => {
      const open = document.body.classList.toggle('show-nav');
      button.setAttribute('aria-expanded', String(open));
    });
    document.querySelector('#clausuraNav')?.addEventListener('click', () => document.body.classList.remove('show-nav'));
  });
})();
