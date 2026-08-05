(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function apiUrl() {
    return window.APP_CONFIG?.WORKSHOPS_API_URL || window.APP_CONFIG?.RENTALS_API_URL || '';
  }

  function request(action, payload = {}) {
    return new Promise((resolve, reject) => {
      const url = apiUrl();
      if (!url) {
        reject(new Error('Falta configurar WORKSHOPS_API_URL en assets/js/config.js.'));
        return;
      }

      const callback = 'workshop_cb_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      const writeActions = new Set(['createWorkshopEnrollment', 'createWorkshopPaymentOrder']);
      const timeoutMs = writeActions.has(action)
        ? Number(window.APP_CONFIG?.WORKSHOPS_WRITE_TIMEOUT_MS || 120000)
        : Number(window.APP_CONFIG?.WORKSHOPS_READ_TIMEOUT_MS || 60000);
      const timeout = setTimeout(() => {
        const error = new Error(writeActions.has(action)
          ? 'La operación está tardando más de lo habitual. No vuelvas a enviarla todavía: espera unos segundos y consulta el estado de la matrícula para evitar duplicados.'
          : 'No se recibió respuesta del servidor. Pulsa Actualizar una vez; la consulta está optimizada para reintentarse sin duplicar información.');
        error.code = 'WORKSHOP_TIMEOUT';
        cleanup(error);
      }, timeoutMs);

      function cleanup(error) {
        clearTimeout(timeout);
        if (script.parentNode) script.parentNode.removeChild(script);
        try { delete window[callback]; } catch (_) { window[callback] = undefined; }
        if (error) reject(error);
      }

      window[callback] = response => {
        cleanup();
        resolve(response);
      };

      const params = new URLSearchParams({
        action,
        callback,
        payload: JSON.stringify(payload),
        _ts: String(Date.now())
      });
      script.src = `${url}?${params.toString()}`;
      script.async = true;
      script.onerror = () => cleanup(new Error('No se pudo conectar con el sistema de talleres.'));
      document.body.appendChild(script);
    });
  }

  function safe(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  function digits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(Number(value || 0));
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function showMessage(target, type, text) {
    const element = typeof target === 'string' ? $(target) : target;
    if (!element) return;
    element.innerHTML = text
      ? `<div class="form-alert ${safe(type)}">${safe(text)}</div>`
      : '';
  }

  function setButtonBusy(button, busy, label) {
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = label || 'Procesando…';
      return;
    }
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
  }

  function qrUrl(order) {
    const data = JSON.stringify({
      tipo: 'TALLER',
      codigo: order.orderCode,
      matricula: order.enrollmentCode,
      total: Number(order.total)
    });
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(data)}`;
  }

  function renderOrder(order, options = {}) {
    const invoiceText = (order.invoices || [])
      .map(item => item.label || formatDate(item.dueDate))
      .join(', ');
    const accountHref = options.accountHref || 'taller-consulta.html';

    return `<div class="order-success-icon">✓</div>
      <h2 id="orderModalTitle" class="order-title">${safe(options.title || 'Orden de pago generada')}</h2>
      <p class="order-subtitle">${safe(options.subtitle || 'Presenta el código o el QR en la caja de la Municipalidad de Pachacámac.')}</p>
      <div class="order-deadline">Válida hasta ${safe(formatDateTime(order.paymentDeadline))}</div>
      <div class="order-code-box">
        <div>
          <small>Código de pago</small>
          <strong>${safe(order.orderCode)}</strong>
          <small style="margin-top:13px">Código de matrícula</small>
          <strong style="font-size:18px">${safe(order.enrollmentCode)}</strong>
        </div>
        <img src="${qrUrl(order)}" alt="Código QR de la orden de pago">
      </div>
      <div class="order-details">
        <div class="order-detail-row"><span>Alumno(a)</span><strong>${safe(order.studentName)}</strong></div>
        <div class="order-detail-row"><span>Taller</span><strong>${safe(order.workshopName)}</strong></div>
        <div class="order-detail-row"><span>Cuota(s)</span><strong>${safe(invoiceText || 'Matrícula inicial')}</strong></div>
        <div class="order-detail-row"><span>Total</span><strong>${formatMoney(order.total)}</strong></div>
      </div>
      <div class="order-note">La orden de pago no confirma la matrícula. La inscripción se activa cuando la cajera registra el pago. Conserva ambos códigos.</div>
      <div class="order-actions">
        <button class="btn btn-primary" type="button" data-close-workshop-modal>Aceptar</button>
        <a class="btn btn-secondary" href="${safe(accountHref)}">Consultar matrícula y pagos</a>
      </div>`;
  }

  function closeOrderModal() {
    const modal = $('#workshopOrderModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function openOrderModal(order, options = {}) {
    const content = $('#workshopOrderContent');
    const modal = $('#workshopOrderModal');
    if (!content || !modal) return;
    content.innerHTML = renderOrder(order, options);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    $$('[data-close-workshop-modal]', modal).forEach(element => {
      element.addEventListener('click', closeOrderModal);
    });
  }

  function bindModal() {
    const modal = $('#workshopOrderModal');
    if (modal) {
      modal.addEventListener('click', event => {
        if (event.target === modal) closeOrderModal();
      });
    }
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeOrderModal();
    });
  }

  window.PachaWorkshops = {
    $,
    $$,
    request,
    safe,
    normalize,
    digits,
    formatMoney,
    formatDate,
    formatDateTime,
    showMessage,
    setButtonBusy,
    openOrderModal,
    closeOrderModal,
    bindModal
  };
})();
