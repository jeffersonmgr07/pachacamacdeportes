# Clausura 2026 — mejora de confirmación, plazo hábil y pago online

Este paquete actualiza el sistema existente sin crear otra Google Sheet. Conserva:

- La Google Sheet **Pacha Deportes Clausura Menores 2026**.
- El Apps Script independiente del campeonato.
- La caja general antigua de Pacha Deportes.
- La URL pública actual del Apps Script del Clausura.

## Cambios incluidos

- Recuadro de confirmación de inscripción rediseñado.
- Un solo código visible: `CL26-1234`.
- Un solo campo: **Fecha límite de pago**.
- Eliminación visual y funcional del periodo de gracia.
- Cálculo de 3 días hábiles de atención de caja.
- Cierre a las 5:00 p. m. de lunes a viernes y a las 12:00 p. m. los sábados.
- Exclusión de domingos, feriados nacionales y días no laborables configurados para el sector público.
- QR real de alta corrección para consultar la inscripción.
- Botón **Pagar online** en la confirmación y en el correo.
- Nueva página `pago-online.html`, con búsqueda del recibo y resumen tipo carrito.
- Integración de Mercado Pago mediante Checkout Pro.
- Verificación del pago contra la API de Mercado Pago antes de activar la cuenta.
- Plantilla de correo rediseñada con logo, datos separados, instrucciones de caja y pago online.
- Caja general adaptada para buscar únicamente por el código de inscripción.

## Ejemplo de fecha límite

Para una inscripción creada el miércoles 5 de agosto de 2026:

1. Jueves 6 de agosto: feriado, no cuenta.
2. Viernes 7 de agosto: primer día hábil.
3. Sábado 8 de agosto: segundo día hábil.
4. Lunes 10 de agosto: tercer día hábil.

La fecha límite resultante es el **lunes 10 de agosto de 2026 a las 5:00 p. m.**

## 1. Archivos para GitHub

Sube o reemplaza, respetando exactamente las rutas:

```text
campeonato-clausura-2026/
├── inscripcion.html
├── estado.html
├── panel.html
├── pago-online.html                 ← archivo nuevo
└── assets/
    ├── clausura-config.js
    ├── clausura-api.js
    ├── clausura-layout.js
    ├── clausura.css
    ├── inscripcion.js
    ├── estado.js
    ├── panel.js
    └── pago-online.js               ← archivo nuevo
```

`clausura-config.js` ya contiene la URL actual:

```text
https://script.google.com/macros/s/AKfycbwrZSScOlLVBkYBKZats35ZX_oGY--1Yt7HNoed34OsS4psmZfV5OeO5Jm3sTNuo33hTA/exec
```

## 2. Apps Script del Clausura

En el proyecto vinculado a la Google Sheet del Clausura:

1. Reemplaza todo `Code.gs` por:

```text
apps-script-campeonato-clausura-2026/Code.gs
```

2. Revisa o reemplaza `appsscript.json` con el archivo del paquete. Incluye el permiso `script.external_request`, necesario para comunicarse con Mercado Pago.
3. Guarda el proyecto.
4. Ejecuta **una sola vez**:

```javascript
migrateClausuraV4()
```

No ejecutes nuevamente `setupClausura2026()` sobre la hoja que ya está funcionando. La migración actualiza la configuración y conserva los registros.

5. En **Implementar → Administrar implementaciones**, edita la implementación web existente y publica una versión nueva. Esto conserva la misma URL `/exec`.

### Registros existentes

- Las inscripciones nuevas utilizarán un único código corto `CL26-####`.
- Los registros de prueba creados antes de esta actualización conservarán su identificador interno anterior, pero la interfaz mostrará solamente el código de inscripción.
- La migración recalcula las fechas límite de inscripciones pendientes con la regla de 3 días hábiles y elimina el periodo de gracia.
- Los pagos ya confirmados no se modifican.

## 3. Configurar Mercado Pago

El Access Token es privado y **no debe colocarse en GitHub, HTML, JavaScript ni en la hoja Config**.

1. Obtén el Access Token de producción de tu aplicación de Mercado Pago.
2. En Apps Script, abre **Configuración del proyecto → Propiedades del script**.
3. Crea esta propiedad:

```text
Propiedad: MERCADO_PAGO_ACCESS_TOKEN
Valor: APP_USR-...tu_access_token...
```

4. Ejecuta:

```javascript
testMercadoPagoConfiguration()
```

La primera ejecución pedirá autorización para conectarse a un servicio externo.

5. Vuelve a actualizar la implementación web existente después de guardar todos los cambios.

Mientras no se configure esta propiedad, el formulario y el botón aparecerán, pero al continuar se mostrará que el pago online todavía no está habilitado. El pago por caja seguirá funcionando normalmente.

### Confirmación segura

El retorno del navegador no activa por sí solo la inscripción. El Apps Script consulta el pago directamente en Mercado Pago, verifica:

- Que el estado sea aprobado.
- Que el código externo corresponda a la inscripción.
- Que el monto sea exactamente igual al recibo pendiente.

La notificación webhook y la verificación al volver de Mercado Pago utilizan la misma validación.

## 4. Caja general antigua

En el Apps Script antiguo donde ya funcionan campos deportivos y talleres:

1. Reemplaza solamente:

```text
apps-script-alquiler-campos/Cashier.html
```

2. `ClausuraBridge.gs` se incluye como referencia completa. Si ya instalaste el puente y funciona, no es obligatorio reemplazarlo.
3. Actualiza la implementación privada existente de la caja para conservar su misma URL.

La caja buscará únicamente por el código visible `CL26-####`.

## 5. Prueba recomendada

1. Realiza una inscripción nueva con un correo de prueba.
2. Verifica que aparezca un único código corto.
3. Comprueba la fecha límite calculada.
4. Abre el QR con otro teléfono.
5. Revisa el correo recibido.
6. Busca el código desde la caja general.
7. Antes de cobrar realmente, usa credenciales de prueba de Mercado Pago.
8. Confirma que, después de un pago aprobado, la inscripción cambie a `ACTIVA` y el panel permita registrar jugadores.

## Nota sobre Yape

Checkout Pro muestra los medios que Mercado Pago tenga habilitados para la cuenta y la operación. El sistema solicita el cobro en soles y deriva al entorno de Mercado Pago; la disponibilidad final de Yape, débito o crédito depende de la configuración y elegibilidad de la cuenta del comercio.
