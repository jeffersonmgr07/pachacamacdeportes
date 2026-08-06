# Clausura 2026 – cobro online con Mercado Pago (v5)

Esta actualización mantiene la Google Sheet y el Apps Script actuales del Campeonato Clausura 2026, pero cambia el flujo público para que la orden se pague online con Checkout Pro de Mercado Pago.

## Resultado del flujo

1. El delegado registra el equipo.
2. Se genera un único código `CL26-####` y una orden pendiente.
3. El modal y el correo muestran solamente el pago online.
4. El usuario abre `pago-online.html`, busca la orden y revisa el detalle.
5. El total online se calcula así:
   - Inscripción: S/ 50.00 por categoría.
   - Comisión online: S/ 4.90 por operación.
   - Ejemplo con una categoría: S/ 50.00 + S/ 4.90 = S/ 54.90.
   - Ejemplo con dos categorías: S/ 100.00 + S/ 4.90 = S/ 104.90.
6. Mercado Pago recibe dos conceptos: inscripción y comisión online.
7. Al aprobarse el pago, el Apps Script consulta la operación directamente en Mercado Pago, valida la orden y habilita el registro de jugadores.
8. Si el usuario tiene problemas o prefiere coordinar manualmente, se muestra el WhatsApp 992 211 457. No se muestran instrucciones de caja municipal.

## Archivos de GitHub

Reemplaza estos archivos respetando las rutas:

```text
campeonato-clausura-2026/
├── inscripcion.html
├── estado.html
├── panel.html
├── pago-online.html
└── assets/
    ├── clausura-config.js
    ├── clausura-api.js
    ├── clausura.css
    ├── estado.js
    └── pago-online.js
```

La URL actual del Apps Script ya está configurada en `assets/clausura-config.js`.

## Archivos del Apps Script del Clausura

Reemplaza en el proyecto asociado a la Google Sheet del Clausura:

```text
apps-script-campeonato-clausura-2026/
├── Code.gs
└── appsscript.json
```

No ejecutes nuevamente `setupClausura2026()`, porque esa función es para una hoja nueva.

Después de reemplazar los archivos, ejecuta una sola vez:

```javascript
migrateClausuraV5()
```

La migración agrega las columnas de comisión, total online, preferencia y estado del gateway sin borrar inscripciones, equipos ni jugadores.

## Dónde colocar la credencial de Mercado Pago

En el Apps Script entra a:

```text
Configuración del proyecto → Propiedades del script
```

Agrega:

```text
Propiedad: MERCADO_PAGO_ACCESS_TOKEN
Valor:     APP_USR-...tu Access Token...
```

Usa el **Access Token**, no la Public Key. Para Checkout Pro, la preferencia se crea desde el servidor y la Public Key no necesita colocarse en GitHub.

Nunca coloques el Access Token en:

- `Code.gs`.
- `clausura-config.js`.
- GitHub.
- Un HTML o JavaScript público.
- Un mensaje de chat.

## Verificar la cuenta conectada

Ejecuta desde el editor del Apps Script:

```javascript
testMercadoPagoConfiguration()
```

La función consulta la cuenta de Mercado Pago y guarda automáticamente `MERCADO_PAGO_COLLECTOR_ID`. Este identificador se usa para impedir que una operación de otra cuenta active una inscripción.

## Configurar el webhook

Ejecuta:

```javascript
getMercadoPagoWebhookUrl()
```

Copia del registro de ejecución el valor que empieza por:

```text
WEBHOOK_MERCADO_PAGO=https://script.google.com/macros/s/.../exec?mp_webhook=1&mp_token=...
```

En Mercado Pago, abre tu integración y configura esa URL en **Webhooks**, entorno de producción, evento **Pagos / Payments**.

El token `mp_token` es generado automáticamente y se guarda como propiedad privada del Apps Script. No lo publiques.

La notificación no se acepta como prueba del pago por sí sola. El backend vuelve a consultar el pago en la API oficial y valida:

- Código externo `CL26-####`.
- Estado `approved`.
- Moneda PEN.
- Total exacto, incluyendo S/ 4.90.
- Cuenta receptora o collector.
- Fecha de creación dentro del plazo.
- Identificador de pago no usado en otra orden.

## Actualizar la implementación web

En Apps Script entra a:

```text
Implementar → Administrar implementaciones
```

Edita la implementación existente, selecciona una versión nueva y conserva la misma URL `/exec`.

La aplicación debe ejecutarse como el propietario y permitir el acceso necesario para que el formulario público pueda comunicarse con ella.

## Prueba recomendada

1. Coloca primero un Access Token de prueba, cuando tu integración de Mercado Pago lo permita.
2. Ejecuta `testMercadoPagoConfiguration()`.
3. Actualiza la implementación.
4. Registra un equipo nuevo para obtener un código nuevo.
5. Abre la orden y paga desde el entorno de prueba.
6. Revisa:
   - `Ordenes_Pago`: estado `PAGADO`.
   - `Pagos`: monto base, comisión y total.
   - `Inscripciones`: estado `ACTIVA`.
   - `Usuarios`: estado `ACTIVO`.
   - `Equipos`: estado `ACTIVO`.
   - Correo de confirmación recibido.
7. Cambia al Access Token de producción.
8. Ejecuta nuevamente `testMercadoPagoConfiguration()` y actualiza la implementación.

Una preferencia creada con credenciales de prueba no debe reutilizarse en producción. Usa una inscripción nueva o ejecuta desde Apps Script:

```javascript
resetMercadoPagoPreference('CL26-1234')
```

La función solo reinicia una preferencia no pagada.

## Archivos y comportamientos que no se modifican

- Registro de equipos y entrenadores.
- Panel del delegado.
- Registro de jugadores y documentos.
- Google Sheet independiente del Clausura.
- Código corto de inscripción.
- Plazo de tres días hábiles.
- Recordatorios de pago.
- Opción interna protegida para confirmar excepcionalmente un pago coordinado manualmente.

## Después de subir los archivos

Espera la publicación de GitHub Pages y recarga sin caché:

```text
Mac:     Cmd + Shift + R
Windows: Ctrl + F5
```
