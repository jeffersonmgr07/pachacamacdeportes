(() => {
  'use strict';

  const C = window.Clausura;
  const form = C.$('#clausuraRegistrationForm');
  if (!form) return;

  const businessCheck = C.$('#hasBusinessData');
  const categoryInputs = C.$$('[name="categories"]');
  const modal = C.$('#registrationOrderModal');
  const passwordInput = C.$('#password');
  const confirmPasswordInput = C.$('#confirmPassword');
  const passwordMatchHint = C.$('#passwordMatchHint');

  function message(type, text) {
    C.$('#registrationMessage').innerHTML = text
      ? `<div class="form-alert ${type}">${C.safe(text)}</div>`
      : '';
  }

  function selectedCategories() {
    return categoryInputs.filter(input => input.checked).map(input => input.value);
  }

  function updateTotal() {
    const count = selectedCategories().length;
    C.$('#selectedCategoryCount').textContent = `${count} ${count === 1 ? 'categoría' : 'categorías'}`;
    C.$('#registrationTotal').textContent = C.money(
      count * Number(window.CLAUSURA_CONFIG.FEE_PER_CATEGORY || 50)
    );
  }

  function toggleBusiness() {
    const enabled = businessCheck.checked;
    C.$$('[data-business-field]').forEach(box => {
      box.hidden = !enabled;
    });
    C.$('#legalName').required = enabled;
    C.$('#ruc').required = enabled;
    if (!enabled) {
      C.$('#legalName').value = '';
      C.$('#ruc').value = '';
    }
  }

  function getPasswordRules(value) {
    const password = String(value || '');
    return {
      length: password.length >= 8,
      uppercase: /[A-ZÁÉÍÓÚÑ]/.test(password),
      number: /[0-9]/.test(password)
    };
  }

  function updatePasswordRuleUI() {
    const value = passwordInput.value;
    const rules = getPasswordRules(value);
    const hasStarted = value.length > 0;

    Object.entries(rules).forEach(([rule, isValid]) => {
      const item = C.$(`[data-password-rule="${rule}"]`);
      if (!item) return;
      item.classList.remove('is-valid', 'is-invalid');
      if (hasStarted) item.classList.add(isValid ? 'is-valid' : 'is-invalid');
    });

    let validityMessage = '';
    if (hasStarted && !rules.length) validityMessage = 'La contraseña debe tener al menos 8 caracteres.';
    else if (hasStarted && !rules.uppercase) validityMessage = 'La contraseña debe incluir al menos una letra mayúscula.';
    else if (hasStarted && !rules.number) validityMessage = 'La contraseña debe incluir al menos un número.';

    passwordInput.setCustomValidity(validityMessage);
    updatePasswordMatchUI();
    return rules;
  }

  function updatePasswordMatchUI() {
    const password = passwordInput.value;
    const confirmation = confirmPasswordInput.value;
    const hasConfirmation = confirmation.length > 0;
    const matches = hasConfirmation && password === confirmation;

    passwordMatchHint.classList.remove('is-valid', 'is-invalid');
    if (!hasConfirmation) {
      passwordMatchHint.textContent = 'Vuelve a escribir la contraseña.';
      confirmPasswordInput.setCustomValidity('');
      return;
    }

    if (matches) {
      passwordMatchHint.textContent = 'Las contraseñas coinciden.';
      passwordMatchHint.classList.add('is-valid');
      confirmPasswordInput.setCustomValidity('');
    } else {
      passwordMatchHint.textContent = 'Las contraseñas no coinciden.';
      passwordMatchHint.classList.add('is-invalid');
      confirmPasswordInput.setCustomValidity('Las contraseñas no coinciden.');
    }
  }

  function setupPasswordToggles() {
    C.$$('[data-password-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        const input = C.$(`#${button.dataset.passwordToggle}`);
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        button.classList.toggle('is-visible', show);
        button.setAttribute('aria-pressed', String(show));
        button.setAttribute(
          'aria-label',
          show ? 'Ocultar contraseña' : 'Mostrar contraseña'
        );
        input.focus({ preventScroll: true });
      });
    });
  }

  function resetPasswordUI() {
    C.$$('[data-password-rule]').forEach(item => {
      item.classList.remove('is-valid', 'is-invalid');
    });
    passwordInput.setCustomValidity('');
    confirmPasswordInput.setCustomValidity('');
    passwordMatchHint.classList.remove('is-valid', 'is-invalid');
    passwordMatchHint.textContent = 'Vuelve a escribir la contraseña.';
    C.$$('[data-password-toggle]').forEach(button => {
      const input = C.$(`#${button.dataset.passwordToggle}`);
      if (input) input.type = 'password';
      button.classList.remove('is-visible');
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', 'Mostrar contraseña');
    });
  }

  function validate(payload) {
    if (!payload.representativeRole) return 'Selecciona el rol del representante.';
    if (!payload.firstName || !payload.lastName) return 'Completa los nombres y apellidos del representante.';
    if (!payload.documentNumber) return 'Ingresa el documento del representante.';
    if (C.digits(payload.whatsapp).length < 9) return 'Ingresa un número de WhatsApp válido.';
    if (!/^\S+@\S+\.\S+$/.test(payload.email)) return 'Ingresa un correo electrónico válido.';
    if (!payload.teamName) return 'Ingresa el nombre del equipo, club o escuela.';
    if (payload.hasBusinessData && C.digits(payload.ruc).length !== 11) return 'El RUC debe tener 11 dígitos.';
    if (!payload.categories.length) return 'Selecciona al menos una categoría.';

    const passwordRules = getPasswordRules(payload.password);
    if (!passwordRules.length) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!passwordRules.uppercase) return 'La contraseña debe incluir al menos una letra mayúscula.';
    if (!passwordRules.number) return 'La contraseña debe incluir al menos un número.';
    if (payload.password !== payload.confirmPassword) return 'Las contraseñas no coinciden.';

    if (!C.$('#authorizedDeclaration').checked || !C.$('#rulesDeclaration').checked) {
      return 'Debes aceptar las declaraciones para continuar.';
    }
    return '';
  }

  businessCheck.addEventListener('change', toggleBusiness);
  categoryInputs.forEach(input => input.addEventListener('change', updateTotal));
  passwordInput.addEventListener('input', updatePasswordRuleUI);
  confirmPasswordInput.addEventListener('input', updatePasswordMatchUI);

  C.$$('[data-close-order]').forEach(button => button.addEventListener('click', () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }));

  modal.addEventListener('click', event => {
    if (event.target === modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    message('', '');
    updatePasswordRuleUI();
    updatePasswordMatchUI();

    const raw = Object.fromEntries(new FormData(form).entries());
    const payload = {
      representativeRole: raw.representativeRole,
      firstName: String(raw.firstName || '').trim(),
      lastName: String(raw.lastName || '').trim(),
      documentType: raw.documentType,
      documentNumber: String(raw.documentNumber || '').trim(),
      whatsapp: C.digits(raw.whatsapp),
      email: String(raw.email || '').trim().toLowerCase(),
      teamName: String(raw.teamName || '').trim(),
      hasBusinessData: businessCheck.checked,
      legalName: String(raw.legalName || '').trim(),
      ruc: C.digits(raw.ruc),
      categories: selectedCategories(),
      password: raw.password || '',
      confirmPassword: raw.confirmPassword || '',
      authorizedDeclaration: true,
      rulesDeclaration: true
    };

    const error = validate(payload);
    if (error) {
      message('error', error);
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid) firstInvalid.focus({ preventScroll: false });
      return;
    }

    const button = C.$('#registrationSubmit');
    C.setBusy(button, true, 'Registrando y generando orden…');
    message('info', 'Estamos registrando el equipo y generando la orden de pago. No cierres esta página.');

    try {
      const response = await C.request('registerTeam', payload);
      if (!response?.ok) throw new Error(response?.message || 'No se pudo registrar el equipo.');

      localStorage.setItem('cl26_last_registration', JSON.stringify({
        registrationId: response.order.registrationId,
        orderCode: response.order.registrationId,
        email: payload.email,
        documentNumber: payload.documentNumber
      }));

      C.$('#registrationOrderContent').innerHTML = C.orderHtml(response.order, {
        title: 'Equipo registrado correctamente',
        subtitle: 'La cuenta fue creada; sin embargo, el registro de jugadores se habilitará después de confirmar el pago.'
      });
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');

      C.$$('[data-copy-code]', modal).forEach(copyButton => {
        copyButton.addEventListener('click', async () => {
          try {
            await C.copyText(copyButton.dataset.copyCode);
            const previous = copyButton.textContent;
            copyButton.textContent = 'Código copiado';
            copyButton.classList.add('copied');
            setTimeout(() => {
              copyButton.textContent = previous;
              copyButton.classList.remove('copied');
            }, 1800);
          } catch (_) {
            C.toast('No se pudo copiar el código. Selecciónalo manualmente.', 'error');
          }
        });
      });

      form.reset();
      toggleBusiness();
      updateTotal();
      resetPasswordUI();
      message('ok', 'La inscripción fue registrada. Conserva tu código de inscripción para pagar y consultar el estado.');
    } catch (error) {
      message('error', error.message || String(error));
    } finally {
      C.setBusy(button, false);
    }
  });

  setupPasswordToggles();
  toggleBusiness();
  updateTotal();
  resetPasswordUI();
})();
