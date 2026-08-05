(() => {
  'use strict';

  const W = window.PachaWorkshops;
  const STORAGE_KEY = 'pachaWorkshopAccountCredentials';
  const state = { credentials: null, enrollments: [] };

  function accountStatusClass(status) {
    const normalized = W.normalize(status);
    if (normalized === 'ACTIVO') return 'active';
    if (normalized.includes('PENDIENTE')) return 'pending';
    return 'cancelled';
  }

  function invoiceStatus(invoice) {
    if (W.normalize(invoice.status) === 'PAGADO') return { className: 'paid', text: 'Pagado' };
    if (invoice.overdue) return { className: 'overdue', text: 'Vencido' };
    return { className: '', text: 'Pendiente' };
  }

  function renderAccount(data) {
    const root = W.$('#workshopAccountResults');
    const enrollments = data.enrollments || [];
    state.enrollments = enrollments;

    if (!enrollments.length) {
      root.innerHTML = '<div class="empty-account">No se encontraron matrículas vigentes o históricas con esos datos.</div>';
      return;
    }

    root.innerHTML = enrollments.map(enrollment => {
      const invoices = enrollment.invoices || [];
      const pending = invoices.filter(item => !['PAGADO','ANULADO'].includes(W.normalize(item.status)));
      const rows = invoices.map(item => {
        const status = invoiceStatus(item);
        const disabled = W.normalize(item.status) === 'PAGADO' || W.normalize(enrollment.status).includes('BAJA');
        const checkbox = disabled ? '' : `<input type="checkbox" value="${W.safe(item.invoiceId)}" data-invoice-checkbox="${W.safe(enrollment.enrollmentCode)}" aria-label="Seleccionar ${W.safe(item.label)}">`;
        return `<div class="invoice-row">
          ${checkbox}
          <div>
            <strong>${W.safe(item.label)}</strong>
            <small>Vence: ${W.safe(W.formatDate(item.dueDate))}${item.paidAt ? ` · Pagado: ${W.safe(W.formatDate(item.paidAt))}` : ''}${item.receiptNumber ? ` · Comprobante: ${W.safe(item.receiptNumber)}` : ''}</small>
          </div>
          <span class="invoice-amount">${W.formatMoney(item.amount)}</span>
          <span class="invoice-status ${status.className}">${status.text}</span>
        </div>`;
      }).join('');

      const actions = pending.length && !W.normalize(enrollment.status).includes('BAJA')
        ? `<div class="account-actions">
            <button class="btn btn-secondary btn-small" type="button" data-select-all-invoices="${W.safe(enrollment.enrollmentCode)}">Seleccionar pendientes</button>
            <button class="btn btn-primary btn-small" type="button" data-create-payment-order="${W.safe(enrollment.enrollmentCode)}">Generar orden de pago</button>
          </div>`
        : '';

      return `<article class="account-enrollment">
        <div class="account-enrollment-head">
          <div>
            <h3>${W.safe(enrollment.studentName)}</h3>
            <p>${W.safe(enrollment.workshopName)} · Matrícula ${W.safe(enrollment.enrollmentCode)}</p>
            <p class="account-fee-line">Cuota mensual: <strong>${W.formatMoney(enrollment.monthlyFee)}</strong></p>
          </div>
          <span class="status-chip ${accountStatusClass(enrollment.status)}">${W.safe(enrollment.statusLabel || enrollment.status)}</span>
        </div>
        <div class="invoice-list">${rows || '<div class="empty-account">No hay cuotas registradas.</div>'}</div>
        ${actions}
      </article>`;
    }).join('');

    W.$$('[data-select-all-invoices]', root).forEach(button => {
      button.addEventListener('click', () => {
        W.$$('[data-invoice-checkbox]', root)
          .filter(box => box.dataset.invoiceCheckbox === button.dataset.selectAllInvoices)
          .forEach(box => { box.checked = true; });
      });
    });

    W.$$('[data-create-payment-order]', root).forEach(button => {
      button.addEventListener('click', () => createPaymentOrder(button.dataset.createPaymentOrder, button));
    });
  }

  async function loadAccount() {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      W.$('#accountAccessMissing').hidden = false;
      W.$('#accountContent').hidden = true;
      return;
    }

    try {
      state.credentials = JSON.parse(stored);
    } catch (_) {
      sessionStorage.removeItem(STORAGE_KEY);
      W.$('#accountAccessMissing').hidden = false;
      W.$('#accountContent').hidden = true;
      return;
    }

    W.$('#accountAccessMissing').hidden = true;
    W.$('#accountContent').hidden = false;
    W.showMessage('#accountMessage', 'info', 'Cargando matrículas y cuotas.');
    try {
      const response = await W.request('lookupWorkshopAccount', state.credentials);
      if (!response?.ok) throw new Error(response?.message || 'No se pudo consultar la cuenta.');
      W.showMessage('#accountMessage', '', '');
      renderAccount(response);
    } catch (error) {
      W.showMessage('#accountMessage', 'error', error.message || String(error));
      W.$('#workshopAccountResults').innerHTML = '';
    }
  }

  async function createPaymentOrder(enrollmentCode, button) {
    const invoiceIds = W.$$('[data-invoice-checkbox]')
      .filter(box => box.dataset.invoiceCheckbox === enrollmentCode && box.checked)
      .map(box => box.value);

    if (!invoiceIds.length) {
      W.showMessage('#accountMessage', 'error', 'Selecciona al menos una cuota pendiente.');
      return;
    }

    W.setButtonBusy(button, true, 'Generando…');
    try {
      const response = await W.request('createWorkshopPaymentOrder', {
        ...state.credentials,
        enrollmentCode,
        invoiceIds
      });
      if (!response?.ok) throw new Error(response?.message || 'No se pudo generar la orden.');
      W.openOrderModal(response.order, {
        subtitle: 'Presenta el código o el QR en caja para pagar las cuotas seleccionadas.',
        accountHref: 'taller-estado.html'
      });
      W.showMessage('#accountMessage', response.warning ? 'info' : 'ok', response.warning || 'La orden de pago fue generada correctamente.');
    } catch (error) {
      W.showMessage('#accountMessage', 'error', error.message || String(error));
    } finally {
      W.setButtonBusy(button, false);
    }
  }

  function clearAccess() {
    sessionStorage.removeItem(STORAGE_KEY);
    location.href = 'taller-consulta.html';
  }

  document.addEventListener('DOMContentLoaded', () => {
    W.$('#refreshAccountButton').addEventListener('click', loadAccount);
    W.$('#changeAccountButton').addEventListener('click', clearAccess);
    W.bindModal();
    loadAccount();
  });
})();
