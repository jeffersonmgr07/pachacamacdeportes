(() => {
  'use strict';

  const C = window.Clausura;
  const form = C.$('#statusForm');
  const result = C.$('#statusResult');
  if (!form) return;

  function setMessage(type, text) {
    C.$('#statusMessage').innerHTML = text
      ? `<div class="form-alert ${type}">${C.safe(text)}</div>`
      : '';
  }

  function statusClass(status) {
    const value = String(status || '').toUpperCase();
    if (value === 'ACTIVA' || value === 'PAGADO') return 'status-active';
    if (value.includes('INHABIL') || value === 'VENCIDO') return 'status-disabled';
    return 'status-pending';
  }

  function render(data) {
    const order = data.order || {};
    const registration = data.registration || {};
    const code = registration.registrationId || order.orderCode || '';
    const categories = (data.categories || [])
      .map(item => item.label || item.name || item.categoryId)
      .join(', ');
    const pending = !['ACTIVA', 'PAGADO'].includes(String(registration.status || order.status).toUpperCase());
    const online = pending
      ? `<a class="btn btn-primary" href="pago-online.html?codigo=${encodeURIComponent(code)}">Pagar online</a>`
      : '';

    result.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">${C.safe(registration.teamName)}</h2><p style="color:#687990">${C.safe(code)}</p></div>
        <span class="status-pill ${statusClass(registration.status)}">${C.safe(data.statusLabel || registration.status)}</span>
      </div>
      <div class="order-details">
        <div class="order-detail-row"><span>Representante</span><strong>${C.safe(registration.representativeName)}</strong></div>
        <div class="order-detail-row"><span>Categorías</span><strong>${C.safe(categories)}</strong></div>
        <div class="order-detail-row"><span>Código de inscripción</span><strong>${C.safe(code)}</strong></div>
        <div class="order-detail-row"><span>Monto</span><strong>${C.money(order.amount)}</strong></div>
        <div class="order-detail-row"><span>Fecha límite de pago</span><strong>${C.safe(C.dateTime(order.paymentDeadline))}</strong></div>
        <div class="order-detail-row"><span>Pago</span><strong>${C.safe(order.paymentMethodLabel || order.paymentMethod || 'Pendiente')}</strong></div>
      </div>
      <div class="order-actions">${online}<a class="btn btn-secondary" href="panel.html" style="background:#eef2f7;color:#142238;border-color:#d5dee9">Ir al panel del delegado</a></div>
      ${data.message ? `<div class="form-alert info">${C.safe(data.message)}</div>` : ''}`;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    setMessage('', '');
    const button = C.$('#statusSubmit');
    C.setBusy(button, true, 'Consultando…');
    try {
      const response = await C.request('getRegistrationStatus', {
        code: C.$('#statusCode').value.trim(),
        identity: C.$('#statusIdentity').value.trim()
      });
      if (!response?.ok) throw new Error(response?.message || 'No se encontró la inscripción.');
      render(response);
    } catch (error) {
      setMessage('error', error.message || String(error));
      result.innerHTML = '<h2>Información de la inscripción</h2><p style="color:#687990">No se pudo cargar la información.</p>';
    } finally {
      C.setBusy(button, false);
    }
  });

  const params = new URLSearchParams(location.search);
  const previous = (() => {
    try { return JSON.parse(localStorage.getItem('cl26_last_registration') || 'null'); }
    catch (_) { return null; }
  })();
  C.$('#statusCode').value = params.get('codigo') || previous?.registrationId || previous?.orderCode || '';
  C.$('#statusIdentity').value = previous?.email || previous?.documentNumber || '';
  if (C.$('#statusCode').value && C.$('#statusIdentity').value) form.requestSubmit();
})();
