# Clausura 2026 — archivos configurados con la URL pública del Apps Script

La URL pública configurada es:

```text
https://script.google.com/macros/s/AKfycbwrZSScOlLVBkYBKZats35ZX_oGY--1Yt7HNoed34OsS4psmZfV5OeO5Jm3sTNuo33hTA/exec
```

## 1. Archivos que debes subir a GitHub

Copia o reemplaza dentro de tu repositorio, respetando exactamente las rutas:

```text
campeonato-clausura-2026/inscripcion.html
campeonato-clausura-2026/estado.html
campeonato-clausura-2026/panel.html
campeonato-clausura-2026/assets/clausura-config.js
campeonato-clausura-2026/assets/clausura-api.js
campeonato-clausura-2026/assets/inscripcion.js
campeonato-clausura-2026/assets/clausura.css
```

`clausura-config.js` ya contiene la URL indicada por el usuario. Las páginas usan la versión de caché `v3` para que el navegador no conserve el archivo anterior con `API_URL` vacío.

## 2. Archivo del Apps Script del Clausura

El paquete también incluye:

```text
apps-script-campeonato-clausura-2026/Code.gs
```

Este archivo no se sube a GitHub. Debes copiarlo al proyecto de Apps Script vinculado a la Google Sheet del Clausura únicamente si todavía no instalaste la corrección de validación de contraseñas.

Después de cambiar `Code.gs`, ve a:

```text
Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar
```

Mantén la misma URL `/exec`.

## 3. Prueba

Después de subir los archivos, espera la publicación de GitHub Pages y recarga:

- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`

El aviso rojo de `Falta configurar API_URL` debe desaparecer.

Puedes probar el endpoint con:

```text
https://script.google.com/macros/s/AKfycbwrZSScOlLVBkYBKZats35ZX_oGY--1Yt7HNoed34OsS4psmZfV5OeO5Jm3sTNuo33hTA/exec?action=ping
```

La respuesta esperada es un JSON que indique que la API está activa.

## 4. Contraseña

El formulario ahora valida en tiempo real:

- mínimo 8 caracteres;
- al menos una letra mayúscula;
- al menos un número;
- coincidencia entre contraseña y confirmación;
- mostrar u ocultar cada contraseña mediante el icono del ojo.
