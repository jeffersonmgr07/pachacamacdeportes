function footerHTML(){
  return `
  <footer class="footer">
    <div class="container footer-grid">
      <div>
        <strong>Portal de deportes Pachacamac</strong>
        <div>Plataforma para organizar campeonatos, talleres y actividades deportivas del distrito.</div>
      </div>
      <div>© 2026 Gestión Deportiva Municipal</div>
    </div>
  </footer>`;
}
document.addEventListener('DOMContentLoaded', () => {
  const target = document.querySelector('[data-footer]');
  if(target) target.innerHTML = footerHTML();
});
