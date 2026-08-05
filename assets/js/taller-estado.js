(() => {
  'use strict';

  const W = window.PachaWorkshops;
  const STORAGE_KEY = 'pachaWorkshopAccountCredentials';
  const DATA_KEY = 'pachaWorkshopAccountData';
  const state = { credentials: null, enrollments: [], hasCachedData: false };

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
      const enrollmentKey = enrollment.enrollmentId || enrollment.enrollmentCode;
      const invoices = enrollment.invoices || [];
      const pending = invoices.filter(item => !['PAGADO','ANULADO'].includes(W.normalize(item.status)));
      const rows = invoices.map(item => {
        const status = invoiceStatus(item);
        const disabled = W.normalize(item.status) === 'PAGADO' || W.normalize(enrollment.status).includes('BAJA');
        const checkbox = disabled ? '' : `<input type="checkbox" value="${W.safe(item.invoiceId)}" data-invoice-checkbox="${W.safe(enrollmentKey)}" aria-label="Seleccionar ${W.safe(item.label)}">`;
        return `<div class="invoice-row">
          ${checkbox}
          <div>
            <strong>${W.safe(item.label)}</strong>
            <small>${W.safe(item.periodText || 'Periodo mensual')}<br>Vence: ${W.safe(W.formatDate(item.dueDate))}${item.paidAt ? ` · Pagado: ${W.safe(W.formatDate(item.paidAt))}` : ''}${item.receiptNumber ? ` · Comprobante: ${W.safe(item.receiptNumber)}` : ''}</small>
          </div>
          <span class="invoice-amount">${W.formatMoney(item.amount)}</span>
          <span class="invoice-status ${status.className}">${status.text}</span>
        </div>`;
      }).join('');

      const actions = pending.length && !W.normalize(enrollment.status).includes('BAJA')
        ? `<div class="account-actions">
            <button class="btn btn-secondary btn-small" type="button" data-select-all-invoices="${W.safe(enrollmentKey)}">Seleccionar pendientes</button>
            <button class="btn btn-primary btn-small" type="button" data-create-payment-order="${W.safe(enrollmentKey)}">Generar orden de pago</button>
          </div>`
        : '';

      return `<article class="account-enrollment">
        <div class="account-enrollment-head">
          <div>
            <h3>${W.safe(enrollment.studentName)}</h3>
            <p>${W.safe(enrollment.workshopName)} · Matrícula ${W.safe(enrollment.enrollmentCode)}</p>
            <p class="account-fee-line">Pago mensual: <strong>${W.formatMoney(enrollment.monthlyFee)}</strong></p>
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

  function readStoredJson(key) {
    try {
      const value = sessionStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (_) {
      sessionStorage.removeItem(key);
      return null;
    }
  }

  async function loadAccount(options = {}) {
    const storedCredentials = readStoredJson(STORAGE_KEY);
    if (!storedCredentials) {
      W.$('#accountAccessMissing').hidden = false;
      W.$('#accountContent').hidden = true;
      return;
    }

    state.credentials = storedCredentials;
    W.$('#accountAccessMissing').hidden = true;
    W.$('#accountContent').hidden = false;

    const cached = readStoredJson(DATA_KEY);
    if (cached?.ok && !state.hasCachedData) {
      state.hasCachedData = true;
      renderAccount(cached);
      W.showMessage('#accountMessage', 'info', 'Mostrando la información guardada. Estamos verificando si hay cambios.');
    } else if (!cached && !options.silent) {
      W.showMessage('#accountMessage', 'info', 'Cargando matrículas, periodos y cuotas.');
    }

    try {
      const response = await W.request('lookupWorkshopAccount', state.credentials);
      if (!response?.ok) throw new Error(response?.message || 'No se pudo consultar la cuenta.');
      sessionStorage.setItem(DATA_KEY, JSON.stringify(response));
      state.hasCachedData = true;
      W.showMessage('#accountMessage', '', '');
      renderAccount(response);
    } catch (error) {
      if (state.hasCachedData) {
        W.showMessage('#accountMessage', 'info', 'Se muestra la última información disponible. No fue posible actualizarla ahora: ' + (error.message || String(error)));
      } else {
        W.showMessage('#accountMessage', 'error', error.message || String(error));
        W.$('#workshopAccountResults').innerHTML = '';
      }
    }
  }

  async function createPaymentOrder(enrollmentId, button) {
    const invoiceIds = W.$$('[data-invoice-checkbox]')
      .filter(box => box.dataset.invoiceCheckbox === enrollmentId && box.checked)
      .map(box => box.value);

    if (!invoiceIds.length) {
      W.showMessage('#accountMessage', 'error', 'Selecciona al menos una cuota pendiente.');
      return;
    }

    W.setButtonBusy(button, true, 'Generando…');
    try {
      const response = await W.request('createWorkshopPaymentOrder', {
        ...state.credentials,
        enrollmentId,
        invoiceIds
      });
      if (!response?.ok) throw new Error(response?.message || 'No se pudo generar la orden.');
      W.openOrderModal(response.order, {
        subtitle: 'Presenta el código o el QR en caja para pagar los periodos mensuales seleccionados.',
        accountHref: 'taller-estado.html'
      });
      W.showMessage('#accountMessage', response.warning ? 'info' : 'ok', response.warning || 'La orden de pago fue generada correctamente.');
      await loadAccount({ silent: true });
    } catch (error) {
      W.showMessage('#accountMessage', 'error', error.message || String(error));
    } finally {
      W.setButtonBusy(button, false);
    }
  }

  function clearAccess() {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(DATA_KEY);
    location.href = 'taller-consulta.html';
  }

  document.addEventListener('DOMContentLoaded', () => {
    W.$('#refreshAccountButton').addEventListener('click', () => loadAccount({ silent: false }));
    W.$('#changeAccountButton').addEventListener('click', clearAccess);
    W.bindModal();
    loadAccount();
  });
})();
