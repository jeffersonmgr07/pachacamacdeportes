# Apps Script independiente - Campeonato Clausura de Menores 2026

Este proyecto debe vincularse a una **Google Sheet nueva** para mantener separados los datos del campeonato Apertura.

## Instalación

1. Crea una Google Sheet vacía con el nombre `Pacha Deportes - Clausura Menores 2026`.
2. Abre **Extensiones > Apps Script**.
3. Copia `Code.gs`, `Cashier.html` y `appsscript.json`.
4. Ejecuta `setupClausura2026()` una sola vez y concede permisos.
5. Revisa la pestaña `Config`, especialmente:
   - `ADMIN_EMAIL`
   - `CASHIER_EMAILS`
   - `PUBLIC_BASE_URL`
   - `ONLINE_PAYMENT_URL_TEMPLATE`
   - `ONLINE_PAYMENT_WEBHOOK_TOKEN`
6. Crea dos implementaciones:
   - **Pública:** ejecutar como propietario y acceso para cualquier usuario. Copia la URL en `campeonato-clausura-2026/assets/clausura-config.js`.
   - **Privada de caja:** ejecutar como usuario que accede y limitar a los usuarios autorizados. Abre `URL_PRIVADA/exec?view=cashier`.

## Pago online

El flujo, las órdenes y el endpoint de confirmación ya están preparados, pero el checkout depende del proveedor de pago elegido.

- Coloca en `ONLINE_PAYMENT_URL_TEMPLATE` la URL del checkout. Puede incluir `{orderCode}`, `{registrationId}` y `{amount}`.
- El proveedor o middleware debe llamar por POST a la aplicación pública con:

```json
{
  "action": "confirmOnlinePayment",
  "payload": {
    "token": "TOKEN_CONFIGURADO",
    "orderCode": "ORD-CL26-...",
    "amount": 50,
    "gatewayReference": "REFERENCIA_DEL_PROVEEDOR"
  }
}
```

No se debe activar un pago online solo por el retorno visual del navegador; debe confirmarse mediante webhook o verificación del proveedor.

## Reglas implementadas

- S/ 50.00 por categoría.
- Plazo principal de 3 días calendario y 2 días de gracia.
- Recordatorio diario alrededor de las 12:00 p. m.
- Cuenta creada inmediatamente, con registro de jugadores bloqueado hasta el pago.
- Categorías Sub 6, Sub 8, Sub 10 y Sub 12 según años de nacimiento.
- Máximo 12 jugadores por categoría.
- Mínimo configurado en 9. Las bases contienen la frase contradictoria `mínimo de ocho (09)` y debe confirmarse formalmente.
- Foto, copia del documento y autorización del padre/apoderado obligatorias.
- Bloqueo de un mismo documento en dos equipos de la misma categoría.

## Privacidad de archivos

Las autorizaciones y copias de documentos se guardan como archivos privados de Drive. La foto se configura con acceso mediante enlace para que pueda visualizarse en el panel estático. Si la Municipalidad requiere un tratamiento más restrictivo de las fotos de menores, conviene reemplazar esta visualización por un endpoint autenticado antes de producción.
