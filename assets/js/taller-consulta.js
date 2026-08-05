(() => {
  'use strict';

  const W = window.PachaWorkshops;
  const STORAGE_KEY = 'pachaWorkshopAccountCredentials';
  const DATA_KEY = 'pachaWorkshopAccountData';

  function normalizeEnrollmentCode(value) {
    let code = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code && !code.startsWith('PE')) code = `PE${code}`;
    return code.slice(0, 24);
  }

  async function submitLookup(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = W.$('#accountSubmit');
    if (!form.reportValidity()) return;

    const values = Object.fromEntries(new FormData(form).entries());
    values.enrollmentCode = normalizeEnrollmentCode(values.enrollmentCode);
    values.studentSurname = String(values.studentSurname || '').trim();
    if (values.enrollmentCode.length < 6) {
      W.showMessage('#accountMessage', 'error', 'Ingresa un código de matrícula válido, por ejemplo PE41097621.');
      return;
    }
    if (values.studentSurname.length < 2) {
      W.showMessage('#accountMessage', 'error', 'Ingresa el primer apellido del menor.');
      return;
    }

    W.setButtonBusy(button, true, 'Consultando…');
    W.showMessage('#accountMessage', 'info', 'Validando el código de matrícula y el apellido del menor.');
    try {
      const response = await W.request('lookupWorkshopAccount', values);
      if (!response?.ok) throw new Error(response?.message || 'No se pudo consultar la matrícula.');
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      sessionStorage.setItem(DATA_KEY, JSON.stringify(response));
      location.href = 'taller-estado.html';
    } catch (error) {
      W.showMessage('#accountMessage', 'error', error.message || String(error));
    } finally { W.setButtonBusy(button, false); }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = W.$('#workshopAccountForm');
    form.addEventListener('submit', submitLookup);
    W.$('#accountEnrollmentCode').addEventListener('input', event => { event.target.value = normalizeEnrollmentCode(event.target.value); });
  });
})();
