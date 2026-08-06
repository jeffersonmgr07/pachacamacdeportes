(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const config = () => window.CLAUSURA_CONFIG || {};
  const safe = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
  const digits = value => String(value || '').replace(/\D/g, '');
  const money = value => new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: 'PEN'
  }).format(Number(value || 0));
  const date = value => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('es-PE', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };
  const dateTime = value => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleString('es-PE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Lima'
    });
  };

  function toast(message, type = 'info') {
    let node = $('#clausuraToast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'clausuraToast';
      node.className = 'toast clausura-toast';
      document.body.appendChild(node);
    }
    node.className = `toast clausura-toast show ${type}`;
    node.textContent = message;
    setTimeout(() => node.classList.remove('show'), 3500);
  }

  function setBusy(button, busy, label = 'Procesando…') {
    if (!button) return;
    if (busy) {
      button.dataset.label = button.textContent;
      button.disabled = true;
      button.textContent = label;
    } else {
      button.disabled = false;
      button.textContent = button.dataset.label || button.textContent;
    }
  }

  function request(action, payload = {}) {
    return new Promise((resolve, reject) => {
      const url = config().API_URL;
      if (!url) {
        reject(new Error('Falta configurar API_URL en campeonato-clausura-2026/assets/clausura-config.js.'));
        return;
      }
      const callback = `cl26_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      const timer = setTimeout(
        () => cleanup(new Error('El servidor tardó demasiado en responder. Revisa la conexión e intenta nuevamente.')),
        Number(config().REQUEST_TIMEOUT_MS || 60000)
      );
      function cleanup(error) {
        clearTimeout(timer);
        script.remove();
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
      script.onerror = () => cleanup(new Error('No se pudo conectar con el sistema del campeonato.'));
      document.body.appendChild(script);
    });
  }

  async function post(action, payload = {}) {
    const url = config().API_URL;
    if (!url) throw new Error('Falta configurar API_URL.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(config().UPLOAD_TIMEOUT_MS || 180000));
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify({action, payload}),
        signal: controller.signal,
        redirect: 'follow'
      });
      const text = await response.text();
      try { return JSON.parse(text); } catch (_) {
        throw new Error('El servidor respondió con un formato no válido.');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('La carga tardó demasiado. Intenta nuevamente.');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  function session() {
    try { return JSON.parse(localStorage.getItem('cl26_session') || 'null'); }
    catch (_) { return null; }
  }
  function setSession(value) { localStorage.setItem('cl26_session', JSON.stringify(value)); }
  function clearSession() { localStorage.removeItem('cl26_session'); }

  function paymentPageUrl(code) {
    const url = new URL('pago-online.html', location.href);
    url.searchParams.set('codigo', code || '');
    return url.href;
  }

  function statusPageUrl(code) {
    const url = new URL('estado.html', location.href);
    url.searchParams.set('codigo', code || '');
    return url.href;
  }

  function onlineAmounts(order = {}) {
    const baseAmount = Number(order.baseAmount ?? order.amount ?? order.total ?? 0);
    const onlineFee = Number(order.onlineFee ?? config().ONLINE_PAYMENT_FEE ?? 4.90);
    const onlineTotal = Number(order.onlineTotal ?? (baseAmount + onlineFee));
    return {baseAmount, onlineFee, onlineTotal};
  }

  function manualHelpUrl(code) {
    const phone = String(config().CONTACT_WHATSAPP || `51${digits(config().CONTACT_PHONE || '992211457')}`);
    const text = `Hola, necesito ayuda con el pago de la inscripción ${code || ''} al Campeonato Clausura 2026.`;
    return `https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(text)}`;
  }

  function qrUrl(order) {
    const code = order.registrationId || order.orderCode || '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&ecc=H&color=741B14&bgcolor=FFFFFF&data=${encodeURIComponent(statusPageUrl(code))}`;
  }

  function onlineInstructions(code) {
    return `<ol>
      <li>Copia tu código de inscripción: <b>${safe(code)}</b>.</li>
      <li>Haz clic en <b>Pagar online</b> y busca la orden con ese código.</li>
      <li>Revisa el monto de inscripción, la comisión online y el total.</li>
      <li>Selecciona <b>Continuar al pago</b> y elige un medio habilitado en Mercado Pago, como Yape, tarjeta de débito o tarjeta de crédito.</li>
      <li>Al finalizar, espera el correo de confirmación y habilitación del registro de jugadores.</li>
    </ol>`;
  }

  function orderHtml(order, options = {}) {
    const code = order.registrationId || order.orderCode || '';
    const categories = (order.categories || [])
      .map(category => typeof category === 'string' ? category : (category.label || category.name || category.categoryId))
      .join(', ');
    const onlineUrl = paymentPageUrl(code);
    const amounts = onlineAmounts(order);
    const supportUrl = manualHelpUrl(code);

    return `<section class="order-confirmation">
      <div class="order-success-icon" aria-hidden="true">✓</div>
      <span class="order-success-badge">Registro completado</span>
      <h2>${safe(options.title || 'Equipo registrado correctamente')}</h2>
      <p class="order-subtitle">${safe(options.subtitle || 'La cuenta fue creada. El registro de jugadores se habilitará al confirmar el pago.')}</p>

      <div class="order-deadline">
        <span>Fecha límite de pago</span>
        <strong>${safe(dateTime(order.paymentDeadline))}</strong>
        <small>Completa el pago antes de la fecha y hora indicadas para mantener activa la inscripción.</small>
      </div>

      <div class="cl-order-code">
        <div class="order-code-copy">
          <span>Código de inscripción</span>
          <strong>${safe(code)}</strong>
          <button class="order-copy-button" type="button" data-copy-code="${safe(code)}">Copiar código</button>
          <small>Utiliza este código para consultar la inscripción y realizar el pago online.</small>
        </div>
        <img src="${qrUrl(order)}" alt="Código QR para consultar la inscripción ${safe(code)}">
      </div>

      <div class="order-details">
        <div class="order-detail-row"><span>Equipo</span><strong>${safe(order.teamName)}</strong></div>
        <div class="order-detail-row"><span>Categorías</span><strong>${safe(categories)}</strong></div>
        <div class="order-detail-row"><span>Inscripción</span><strong>${money(amounts.baseAmount)}</strong></div>
        <div class="order-detail-row"><span>Comisión por pago online</span><strong>${money(amounts.onlineFee)}</strong></div>
        <div class="order-detail-row order-detail-total"><span>Total online</span><strong>${money(amounts.onlineTotal)}</strong></div>
        <div class="order-detail-row"><span>Estado</span><strong>${safe(order.statusLabel || order.status || 'Pendiente de pago')}</strong></div>
      </div>

      <div class="payment-method-grid payment-method-grid-single">
        <article class="payment-method-card payment-method-card-online">
          <span class="payment-method-number">1</span>
          <h3>Pago online con Mercado Pago</h3>
          ${onlineInstructions(code)}
          <a class="btn btn-primary payment-online-button" href="${safe(onlineUrl)}">Pagar online</a>
        </article>
        <article class="manual-payment-help">
          <h3>¿Tienes problemas con el pago?</h3>
          <p>Si prefieres coordinar el pago de forma manual, comunícate con el encargado de deportes al <strong>992 211 457</strong>.</p>
          <a class="btn btn-whatsapp" href="${safe(supportUrl)}" target="_blank" rel="noopener">Coordinar por WhatsApp</a>
        </article>
      </div>

      <div class="order-actions">
        <a class="btn btn-secondary" href="estado.html?codigo=${encodeURIComponent(code)}">Consultar estado</a>
        <a class="btn btn-secondary" href="panel.html">Ir al panel</a>
      </div>
    </section>`;
  }


  async function copyText(value) {
    const text = String(value || '');
    if (!text) return false;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const input = document.createElement('textarea');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    return copied;
  }

  window.Clausura = {
    $, $$, safe, digits, money, date, dateTime, toast, setBusy, request, post,
    session, setSession, clearSession, orderHtml, paymentPageUrl, statusPageUrl,
    onlineInstructions, onlineAmounts, manualHelpUrl, copyText
  };
})();
