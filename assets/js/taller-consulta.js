(() => {
  'use strict';

  const W = window.PachaWorkshops;
  const STORAGE_KEY = 'pachaWorkshopAccountCredentials';
  const DATA_KEY = 'pachaWorkshopAccountData';

  async function submitLookup(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = W.$('#accountSubmit');
    if (!form.reportValidity()) return;

    const values = Object.fromEntries(new FormData(form).entries());
    values.guardianDni = W.digits(values.guardianDni);
    if (values.guardianDni.length !== 8) {
      W.showMessage('#accountMessage', 'error', 'El DNI del apoderado debe tener 8 dígitos.');
      return;
    }

    W.setButtonBusy(button, true, 'Consultando…');
    W.showMessage('#accountMessage', 'info', 'Validando los datos del apoderado.');
    try {
      const response = await W.request('lookupWorkshopAccount', values);
      if (!response?.ok) throw new Error(response?.message || 'No se pudo consultar la cuenta.');
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      sessionStorage.setItem(DATA_KEY, JSON.stringify(response));
      location.href = 'taller-estado.html';
    } catch (error) {
      W.showMessage('#accountMessage', 'error', error.message || String(error));
    } finally {
      W.setButtonBusy(button, false);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = W.$('#workshopAccountForm');
    form.addEventListener('submit', submitLookup);
    W.$('#accountGuardianDni').addEventListener('input', event => {
      event.target.value = W.digits(event.target.value).slice(0, 8);
    });
  });
})();
