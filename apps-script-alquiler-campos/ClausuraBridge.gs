/**
 * Puente seguro entre la caja general de Pacha Deportes y el proyecto
 * independiente del Campeonato Clausura de Menores 2026.
 *
 * No escribas la URL ni el token directamente en este archivo si el repositorio
 * es público. Configúralos una sola vez con setupClausuraCashierBridge().
 */

function setupClausuraCashierBridge(apiUrl, bridgeToken) {
  const url = clean_(apiUrl);
  const token = clean_(bridgeToken);
  if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/.test(url)) {
    throw new Error('La URL debe ser la implementación pública /exec del Apps Script del Clausura 2026.');
  }
  if (token.length < 40) {
    throw new Error('El token del puente no es válido o es demasiado corto.');
  }
  PropertiesService.getScriptProperties().setProperties({
    CLAUSURA_2026_API_URL: url,
    CLAUSURA_2026_BRIDGE_TOKEN: token
  }, false);
  return {
    ok: true,
    message: 'La caja general quedó conectada con el Campeonato Clausura 2026.'
  };
}

function getClausuraCashierBridgeStatus() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('CLAUSURA_2026_API_URL') || '';
  const token = props.getProperty('CLAUSURA_2026_BRIDGE_TOKEN') || '';
  return {
    ok: true,
    configured: !!url && !!token,
    apiUrl: url ? url.replace(/(.{24}).+(.{10})$/, '$1…$2') : ''
  };
}

function cashierClausuraLookup(code) {
  const cashier = requireCashier_();
  return callClausuraBridge_('cashierBridgeLookup', {
    code: clean_(code),
    confirmedBy: cashier
  });
}

function cashierConfirmClausuraPayment(orderCode, receiptNumber) {
  const cashier = requireCashier_();
  return callClausuraBridge_('cashierBridgeConfirmPayment', {
    orderCode: clean_(orderCode),
    receiptNumber: clean_(receiptNumber),
    confirmedBy: cashier
  });
}

function callClausuraBridge_(action, payload) {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = clean_(props.getProperty('CLAUSURA_2026_API_URL'));
  const token = clean_(props.getProperty('CLAUSURA_2026_BRIDGE_TOKEN'));
  if (!apiUrl || !token) {
    throw new Error('La integración del Clausura 2026 todavía no está configurada en la caja general.');
  }

  const body = {
    action: action,
    payload: Object.assign({}, payload || {}, {bridgeToken: token})
  };

  let response;
  try {
    response = UrlFetchApp.fetch(apiUrl, {
      method: 'post',
      contentType: 'text/plain; charset=utf-8',
      payload: JSON.stringify(body),
      followRedirects: true,
      muteHttpExceptions: true
    });
  } catch (error) {
    throw new Error('No se pudo conectar con el sistema del Clausura 2026: ' + (error.message || error));
  }

  const status = response.getResponseCode();
  const content = response.getContentText();
  let data;
  try {
    data = JSON.parse(content);
  } catch (_) {
    throw new Error('El sistema del Clausura 2026 respondió con un formato no válido. Código HTTP: ' + status + '.');
  }

  if (status < 200 || status >= 300) {
    throw new Error(data.message || ('La conexión con el Clausura 2026 devolvió el código HTTP ' + status + '.'));
  }
  if (!data.ok) {
    return data;
  }
  return data;
}
