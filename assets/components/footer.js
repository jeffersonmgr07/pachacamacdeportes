function footerHTML(){
  return `
  <footer class="footer">
    <div class="container footer-grid">
      <div>
        <img class="footer-logo" src="assets/img/logo-pacha-deportes.png" onerror="this.src='assets/img/logo-pacha-deportes.svg'" alt="Logo Pacha Deportes"><div class="footer-title">Portal de deportes Pachacamac</div>
        <p style="margin:10px 0 0;line-height:1.6">Plataforma para consultar campeonatos, talleres, resultados, tablas y actividades deportivas del distrito.</p>
      </div>
      <div>
        <strong>Secciones</strong>
        <div class="footer-links" style="margin-top:12px">
          <a href="campeonatos.html">Campeonatos</a>
          <a href="talleres.html">Talleres deportivos</a>
          <a href="comunicados.html">Comunicados</a>
          <a href="login.html">Iniciar sesión</a>
        </div>
      </div>
      <div>
        <strong>Campeonato activo</strong>
        <div class="footer-links" style="margin-top:12px">
          <a href="campeonato-futbol-menores-2026.html">Fútbol de Menores 2026</a>
          <a href="fixture.html">Fixture</a>
          <a href="resultados.html">Resultados</a>
          <a href="tabla-posiciones.html">Tabla de posiciones</a>
        </div>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© 2026 Gestión Deportiva - App</span>
      <span>Distrito Pachacamac</span>
    </div>
  </footer>`;
}
document.addEventListener('DOMContentLoaded', () => {
  const target = document.querySelector('[data-footer]');
  if(target) target.innerHTML = footerHTML();
});
