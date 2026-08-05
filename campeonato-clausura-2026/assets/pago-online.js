(() => {
  'use strict';

  const C = window.Clausura;
  const form = C.$('#onlinePaymentSearchForm');
  const codeInput = C.$('#onlinePaymentCode');
  const messageNode = C.$('#onlinePaymentMessage');
  const cart = C.$('#onlinePaymentCart');
  const returnNode = C.$('#paymentReturnMessage');
  let currentOrder = null;

  if (!form) return;

  function message(type, text) {
    messageNode.innerHTML = text ? `<div class="form-alert ${type}">${C.safe(text)}</div>` : '';
  }

  function statusClass(status) {
    const value = String(status || '').toUpperCase();
    if (value === 'PAGADO' || value === 'ACTIVA') return 'status-active';
    if (value === 'VENCIDO' || value.includes('INHABIL')) return 'status-disabled';
    return 'status-pending';
  }

  function renderOrder(response) {
    const registration = response.registration || {};
    const order = response.order || {};
    const code = registration.registrationId || order.orderCode || '';
    const categories = (response.categories || [])
      .map(item => item.label || item.name || item.categoryId)
      .join(', ');
    const paid = ['PAGADO', 'ACTIVA'].includes(String(order.status || registration.status).toUpperCase());
    const expired = ['VENCIDO', 'INHABILITADA'].includes(String(order.status || registration.status).toUpperCase());

    currentOrder = {code, order, registration};

    let action = '';
    if (paid) {
      action = `<div class="form-alert ok">Este recibo ya fue pagado. La cuenta del delegado está habilitada.</div>
        <a class="btn btn-primary" href="panel.html" style="width:100%;justify-content:center">Ir al panel del delegado</a>`;
    } else if (expired) {
      action = '<div class="form-alert error">La fecha límite de pago venció. Debes realizar una nueva inscripción.</div>';
    } else {
      action = `<button class="btn btn-primary" id="continueMercadoPago" type="button" style="width:100%;justify-content:center">Continuar al pago</button>
        <div class="cl-mercado-note">El pago se completa en el entorno seguro de Mercado Pago. Los medios disponibles pueden incluir Yape, tarjeta de débito y tarjeta de crédito.</div>`;
    }

    cart.innerHTML = `<h2>2. Resumen de pago</h2>
      <div class="cl-payment-cart">
        <div class="cl-payment-cart-head">
          <div><small>Código de inscripción</small><br><strong>${C.safe(code)}</strong></div>
          <span class="status-pill ${statusClass(order.status || registration.status)}">${C.safe(response.statusLabel || order.status || registration.status)}</span>
        </div>
        <div class="order-detail-row"><span>Equipo</span><strong>${C.safe(registration.teamName)}</strong></div>
        <div class="order-detail-row"><span>Categorías</span><strong>${C.safe(categories)}</strong></div>
        <div class="order-detail-row"><span>Fecha límite</span><strong>${C.safe(C.dateTime(order.paymentDeadline))}</strong></div>
        <div class="cl-payment-cart-total"><span>Total a pagar</span><strong>${C.money(order.amount)}</strong></div>
      </div>
      <div style="margin-top:16px">${action}</div>`;

    C.$('#continueMercadoPago')?.addEventListener('click', startPayment);
  }

  async function lookup(code, silent = false) {
    if (!code) return;
    const button = C.$('#onlinePaymentSearchButton');
    if (!silent) C.setBusy(button, true, 'Buscando…');
    message('', '');
    try {
      const response = await C.request('lookupOnlinePayment', {code});
      if (!response?.ok) throw new Error(response?.message || 'No se encontró la orden.');
      renderOrder(response);
    } catch (error) {
      currentOrder = null;
      message('error', error.message || String(error));
      cart.innerHTML = '<h2>2. Resumen de pago</h2><div class="cl-payment-empty">No se pudo cargar la orden.</div>';
    } finally {
      if (!silent) C.setBusy(button, false);
    }
  }

  async function startPayment() {
    if (!currentOrder?.code) return;
    const button = C.$('#continueMercadoPago');
    C.setBusy(button, true, 'Creando pago seguro…');
    try {
      const response = await C.request('createMercadoPagoPreference', {code: currentOrder.code});
      if (!response?.ok) throw new Error(response?.message || 'No se pudo iniciar el pago.');
      if (!response.initPoint) throw new Error('Mercado Pago no devolvió el enlace de pago.');
      location.href = response.initPoint;
    } catch (error) {
      C.setBusy(button, false);
      message('error', error.message || String(error));
    }
  }

  async function processReturn(params) {
    const result = params.get('resultado');
    const paymentId = params.get('payment_id') || params.get('collection_id');
    const code = params.get('codigo') || params.get('external_reference') || '';
    if (!result && !paymentId) return;

    if (result === 'failure') {
      returnNode.innerHTML = '<div class="cl-payment-result-banner failure"><strong>El pago no se completó.</strong><br>Puedes intentarlo nuevamente o pagar en la caja municipal.</div>';
      return;
    }

    if (result === 'pending' && !paymentId) {
      returnNode.innerHTML = '<div class="cl-payment-result-banner pending"><strong>El pago está pendiente.</strong><br>Actualizaremos la inscripción cuando Mercado Pago confirme la operación.</div>';
      return;
    }

    if (paymentId) {
      returnNode.innerHTML = '<div class="cl-payment-result-banner pending"><strong>Verificando el pago…</strong><br>No cierres esta página.</div>';
      try {
        const response = await C.request('syncMercadoPagoPayment', {paymentId, code});
        if (!response?.ok) throw new Error(response?.message || 'No se pudo verificar el pago.');
        if (response.activated || response.status === 'approved') {
          returnNode.innerHTML = '<div class="cl-payment-result-banner success"><strong>Pago confirmado.</strong><br>La cuenta del delegado quedó habilitada y enviamos el correo de confirmación.</div>';
        } else {
          returnNode.innerHTML = `<div class="cl-payment-result-banner pending"><strong>Pago ${C.safe(response.statusLabel || response.status || 'pendiente')}.</strong><br>El sistema actualizará la inscripción cuando Mercado Pago confirme la operación.</div>`;
        }
      } catch (error) {
        returnNode.innerHTML = `<div class="cl-payment-result-banner failure"><strong>No pudimos verificar el pago todavía.</strong><br>${C.safe(error.message || String(error))}</div>`;
      }
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    lookup(codeInput.value.trim());
  });

  const params = new URLSearchParams(location.search);
  const initialCode = params.get('codigo') || params.get('external_reference') || '';
  codeInput.value = initialCode;
  processReturn(params).finally(() => {
    if (initialCode) lookup(initialCode, true);
  });
})();
