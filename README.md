# Corrección API_URL y contraseña — Clausura de Menores 2026

Este paquete corrige dos puntos:

1. Mejora la contraseña del formulario de inscripción:
   - mínimo 8 caracteres;
   - al menos una letra mayúscula;
   - al menos un número;
   - validación visual en tiempo real;
   - validación de coincidencia;
   - botón para mostrar u ocultar cada contraseña;
   - validación repetida en el backend de Apps Script.

2. Cambia la versión de los archivos estáticos de `v1` a `v2` para evitar que el navegador siga usando archivos antiguos guardados en caché.

## Archivos para GitHub

Copia o reemplaza respetando las rutas:

- `campeonato-clausura-2026/inscripcion.html`
- `campeonato-clausura-2026/estado.html`
- `campeonato-clausura-2026/panel.html`
- `campeonato-clausura-2026/assets/inscripcion.js`
- `campeonato-clausura-2026/assets/clausura.css`
- `campeonato-clausura-2026/assets/clausura-api.js`

## Archivo para el Apps Script del Clausura

Reemplaza en el proyecto nuevo asociado a la Google Sheet del Clausura:

- `apps-script-campeonato-clausura-2026/Code.gs`

Después actualiza la implementación pública del Apps Script.

## Corrección obligatoria de API_URL

El mensaje de error aparece porque el archivo existente contiene:

```javascript
API_URL: "",
```

Abre en GitHub:

```text
campeonato-clausura-2026/assets/clausura-config.js
```

Cambia únicamente esa línea por la URL pública `/exec` del Apps Script nuevo del Clausura:

```javascript
API_URL: "https://script.google.com/macros/s/ID_DE_TU_IMPLEMENTACION/exec",
```

No coloques la URL de la caja privada ni una URL terminada en `/dev`.

El archivo completo debe mantener una estructura como esta:

```javascript
window.CLAUSURA_CONFIG = {
  API_URL: "https://script.google.com/macros/s/ID_DE_TU_IMPLEMENTACION/exec",
  CHAMPIONSHIP_ID: "CHAMP_FUT_MEN_CLAUSURA_2026",
  FEE_PER_CATEGORY: 50,
  START_DATE: "2026-08-23",
  CONTACT_PHONE: "992211457",
  REQUEST_TIMEOUT_MS: 60000,
  UPLOAD_TIMEOUT_MS: 180000
};
```

## Prueba rápida

Abre en el navegador:

```text
TU_URL_EXEC?action=ping
```

Debe aparecer:

```json
{"ok":true,"message":"API Clausura 2026 activa"}
```

Luego abre nuevamente la ficha de inscripción y fuerza una recarga:

- macOS: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`

## Orden recomendado

1. Reemplazar `Code.gs` en Apps Script.
2. Guardar y actualizar la implementación pública.
3. Copiar la URL `/exec`.
4. Colocarla en `clausura-config.js`.
5. Subir a GitHub los archivos del paquete.
6. Esperar la publicación de GitHub Pages.
7. Probar `?action=ping` y luego el formulario.
