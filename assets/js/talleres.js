(() => {
  'use strict';

  const W = window.PachaWorkshops;
  const SPORT_ICONS = { VOLEY: '🏐', FUTBOL: '⚽', BASQUET: '🏀' };

  function renderCatalog(workshops) {
    const root = W.$('#workshopCatalog');
    if (!root) return;
    if (!workshops.length) {
      root.innerHTML = '<article class="workshop-card workshop-card-loading">No hay talleres habilitados en este momento.</article>';
      return;
    }

    root.innerHTML = workshops.map(workshop => {
      const icon = SPORT_ICONS[W.normalize(workshop.sportCode)] || '🏅';
      const registrationUrl = `taller-inscripcion.html?taller=${encodeURIComponent(workshop.workshopId)}`;
      return `<article class="workshop-card">
        <div class="workshop-sport-icon" aria-hidden="true">${icon}</div>
        <span class="badge badge-green">Inscripciones abiertas</span>
        <h3>${W.safe(workshop.name)}</h3>
        <p>${W.safe(workshop.description || 'Taller deportivo municipal para niñas, niños y adolescentes.')}</p>
        <div class="workshop-meta">
          <div class="workshop-meta-row"><span>🗓️</span><span>${W.safe(workshop.scheduleText)}</span></div>
          <div class="workshop-meta-row"><span>📍</span><span>${W.safe(workshop.location)}</span></div>
          <div class="workshop-meta-row"><span>🎂</span><span>De ${Number(workshop.minAge || 6)} a ${Number(workshop.maxAge || 17)} años</span></div>
          <div class="workshop-meta-row"><span>🏁</span><span>Hasta ${W.safe(W.formatDate(workshop.endDate))}</span></div>
        </div>
        <div class="workshop-price-row">
          <div><small>Desde</small><strong>${W.formatMoney(workshop.localFee)}</strong></div>
          <small>Pago mensual</small>
        </div>
        <a class="btn btn-primary" href="${registrationUrl}">Iniciar inscripción</a>
      </article>`;
    }).join('');
  }

  async function loadCatalog() {
    const root = W.$('#workshopCatalog');
    try {
      const response = await W.request('getWorkshopCatalog');
      if (!response?.ok) throw new Error(response?.message || 'No se pudo cargar el catálogo.');
      renderCatalog(response.workshops || []);
    } catch (error) {
      if (root) {
        root.innerHTML = `<article class="workshop-card workshop-card-loading">${W.safe(error.message || String(error))}</article>`;
      }
    }
  }

  document.addEventListener('DOMContentLoaded', loadCatalog);
})();
