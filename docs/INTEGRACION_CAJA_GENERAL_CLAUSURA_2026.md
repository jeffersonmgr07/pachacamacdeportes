# Integración del Campeonato Clausura 2026 con la caja general

## Resultado final

Se conservan separados:

- La nueva Google Sheet **Pacha Deportes Clausura Menores 2026**.
- El nuevo Apps Script del Clausura para equipos, delegados, órdenes, recordatorios, jugadores y documentos.
- La Google Sheet antigua de campos deportivos y talleres.

La caja antigua seguirá siendo el único panel de cobro. En ese panel aparecerá una nueva pestaña llamada **Clausura 2026**.

El cajero buscará el código de pago o de inscripción, registrará el comprobante y confirmará el pago. La caja antigua no copiará filas ni modificará directamente la nueva Google Sheet. En su lugar, enviará una solicitud segura al Apps Script del Clausura. El Apps Script del Clausura realizará toda la activación en su propia hoja y enviará el correo al delegado.

## Flujo

1. El delegado registra el equipo en la web.
2. El Apps Script del Clausura guarda la inscripción y genera la orden por S/ 50 por categoría.
3. El delegado presenta el código en la caja municipal.
4. El cajero abre la misma caja que usa para campos y talleres.
5. En la pestaña **Clausura 2026**, busca la orden y confirma el pago.
6. El Apps Script del Clausura actualiza:
   - `Ordenes_Pago`: PAGADO.
   - `Pagos`: crea el registro del pago.
   - `Inscripciones`: ACTIVA.
   - `Usuarios`: ACTIVO.
   - `Equipos`: ACTIVO.
   - `Inscripcion_Categorias`: ACTIVA.
7. Se habilita el registro de jugadores y se envía el correo de confirmación.

## Archivos del proyecto del Clausura

En el Apps Script vinculado a la nueva Google Sheet:

1. Reemplaza `Code.gs` por:
   - `apps-script-campeonato-clausura-2026/Code.gs`
2. No necesitas publicar ni utilizar un panel de caja propio del Clausura.
3. Ejecuta `setupClausura2026()` si todavía no has creado la estructura.
4. Ejecuta `generateCashierBridgeToken()`.
5. Abre el registro de ejecución y copia el valor que aparece como:

   `CASHIER_BRIDGE_TOKEN=...`

6. Implementa o actualiza el Apps Script como aplicación web:
   - Ejecutar como: tu cuenta administradora.
   - Acceso: cualquier persona, porque la inscripción pública necesita consultar la API.
7. Copia la URL final terminada en `/exec`.
8. Verifica que esa URL esté colocada en `campeonato-clausura-2026/assets/clausura-config.js` como `API_URL`.

## Archivos de la caja antigua

En el Apps Script que actualmente atiende campos deportivos y talleres:

1. Agrega un archivo nuevo llamado `ClausuraBridge.gs` y pega el contenido de:
   - `apps-script-alquiler-campos/ClausuraBridge.gs`
2. Reemplaza únicamente `Cashier.html` por:
   - `apps-script-alquiler-campos/Cashier.html`
3. Mantén tu `Code.gs` y `Workshops.gs` actuales. No los reemplaces.
4. En **Configuración del proyecto > Propiedades del script**, agrega:

   - Propiedad: `CLAUSURA_2026_API_URL`
     - Valor: URL `/exec` del nuevo Apps Script del Clausura.
   - Propiedad: `CLAUSURA_2026_BRIDGE_TOKEN`
     - Valor: token generado con `generateCashierBridgeToken()`.

5. Guarda y actualiza la implementación privada de la caja. Al editar la implementación existente, la URL privada puede mantenerse.

La URL privada que estabas utilizando era:

`https://script.google.com/macros/s/AKfycbweuAw40WtHmKZQqUBRyCazJGq3Emi9oWv5eGOcNMxzMmzzXd3zr3Rz_3VTJTSDmgw2/exec`

## Prueba recomendada

1. Registra un equipo de prueba con una sola categoría.
2. Confirma que se genere una orden por S/ 50.
3. Abre la caja antigua.
4. Entra en **Clausura 2026**.
5. Busca el código de pago.
6. Confirma el pago con un comprobante de prueba.
7. Comprueba en la nueva Google Sheet que la inscripción quede ACTIVA.
8. Ingresa al panel del delegado y verifica que permita registrar jugadores.
9. Comprueba que llegue el correo de pago confirmado.

## Seguridad

- El token nunca debe publicarse en GitHub ni colocarse en archivos HTML o JavaScript del sitio.
- El token queda guardado solamente en las propiedades privadas de ambos Apps Script.
- La caja llama al Apps Script del Clausura de servidor a servidor mediante `UrlFetchApp`; el navegador del cajero nunca recibe el token.
- El Apps Script del Clausura bloquea las funciones del puente cuando se intentan ejecutar por URL GET.

## Qué no debes hacer

- No crear otra caja para el Clausura.
- No copiar las inscripciones del Clausura a la Google Sheet antigua.
- No permitir que la caja antigua cambie directamente las filas de la nueva Google Sheet.
- No colocar el token secreto en `clausura-config.js` ni en GitHub.
