# Actualización v8 — Alquiler de campos

Cambios principales:

- El badge del correo de confirmación ahora dice `PAGADO`.
- El correo confirma que el pago se realizó exitosamente y que todos los horarios quedaron confirmados.
- El correo de pago confirmado incluye el QR de la reserva.
- Las fechas de las tarjetas de horarios se mantienen en minúsculas naturales en español.
- En Cashier, el botón de confirmar pago se bloquea y muestra un indicador mientras se procesa.
- Al finalizar aparece un modal `Pago registrado`; al aceptar se limpia el formulario.
- En el calendario público aparece una tarjeta animada mientras se consulta la disponibilidad.

## Publicación

1. Sustituir en GitHub:
   - `assets/js/campos-deportivos.js`
   - `assets/css/campos-deportivos.css`
2. Sustituir en Apps Script:
   - `apps-script-alquiler-campos/Code.gs`
   - `apps-script-alquiler-campos/Cashier.html`
3. Crear una nueva versión tanto de la implementación pública como de la implementación privada de caja.
