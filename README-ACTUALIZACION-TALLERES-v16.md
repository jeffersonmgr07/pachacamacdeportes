# Pacha Deportes — actualización de talleres v16

Esta versión reemplaza la corrección v15. No es necesario instalar v15 primero.

## Correcciones incluidas

1. Se corrige la pantalla `taller-estado.html` que mostraba simultáneamente “Primero debes identificarte” y el bloque de matrículas.
2. La consulta del apoderado reutiliza inmediatamente la respuesta validada en `taller-consulta.html`, evitando una segunda espera innecesaria al abrir el estado.
3. La consulta de Apps Script fue optimizada: ya no ejecuta sincronizaciones ni barridos de vencimientos en cada lectura y carga las cuotas en una sola lectura.
4. Tiempo máximo de consultas: 60 segundos. Operaciones de escritura: 120 segundos.
5. El código público de matrícula ahora es `PE` + DNI del menor. Ejemplo: `PE41097621`.
6. Se agregó un identificador interno para permitir que el mismo menor pueda aparecer en más de un taller sin alterar el código público `PE + DNI`.
7. Cada cuota muestra:
   - Tipo: Pago mensual.
   - Inicio y fin del periodo.
   - Fecha de vencimiento.
8. Los periodos se calculan desde la fecha de inscripción. Ejemplo: inscripción el 05-Ago-2026 → periodo del 05-Ago-2026 hasta el 05-Set-2026.
9. Cada cuota vence tres días hábiles después del inicio de su periodo, respetando el horario de caja. El último periodo se recorta al 30-Nov-2026.
10. Los correos de inscripción, orden de pago y confirmación muestran los periodos mensuales y sus vencimientos.
11. `setupRentalSystem()` migra las matrículas de prueba existentes al formato `PE + DNI` y completa los nuevos campos sin borrar pagos ni matrículas.

## Archivos web para GitHub

Reemplazar o agregar conservando estas rutas:

- `talleres.html`
- `taller-inscripcion.html`
- `taller-consulta.html`
- `taller-estado.html`
- `assets/css/talleres.css`
- `assets/js/config.js`
- `assets/js/workshops-common.js`
- `assets/js/taller-consulta.js`
- `assets/js/taller-estado.js`

Las URLs pública y privada ya están configuradas en `assets/js/config.js`.

## Archivos de Google Apps Script

En el mismo proyecto actual de Apps Script:

1. Reemplazar todo el contenido de `Code.gs`.
2. Reemplazar todo el contenido de `Cashier.html`.
3. Reemplazar todo el contenido de `Workshops.gs`.
4. Guardar.
5. Ejecutar una vez `setupRentalSystem()` y aceptar permisos.
6. Actualizar la implementación pública existente a una nueva versión.
7. Actualizar la implementación privada existente a una nueva versión.

No crear otro proyecto ni otras URL.

## Prueba recomendada

1. Ejecutar `setupRentalSystem()`.
2. Abrir una ventana de incógnito.
3. Recargar con `Cmd + Shift + R` o `Ctrl + Shift + R`.
4. Registrar una prueba.
5. Verificar que la matrícula sea `PE` + DNI del menor.
6. Consultar con DNI y apellido del apoderado.
7. Verificar que cada recibo muestre periodo mensual y vencimiento.
