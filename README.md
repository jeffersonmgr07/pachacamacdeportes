# Portal de deportes Pachacamac

Proyecto estático para GitHub Pages con HTML, CSS y JavaScript.  
Google Apps Script funciona únicamente como API/backend y Google Sheets funciona como base de datos editable.

## Páginas principales

- `index.html` — portal general deportivo.
- `campeonatos.html` — cards de campeonatos.
- `campeonato-futbol-menores-2026.html` — portal del campeonato de fútbol de menores.
- `fixture.html` — programación.
- `resultados.html` — resultados.
- `tabla-posiciones.html` — tabla calculada por resultados.
- `equipos.html` — equipos.
- `login.html` — login.
- `entrenador.html` — panel entrenador.
- `admin.html` — panel administrador.

## Logo

Coloca tu logo real en:

```txt
assets/IMG/logo-pacha-deportes.png
```

El proyecto incluye un fallback SVG si todavía no subiste el PNG.

## Conexión con Google Sheets

1. Sube `docs/pacha-deportes-google-sheets-maestro.xlsx` a Google Drive.
2. Ábrelo como Google Sheets.
3. Entra a `Extensiones > Apps Script`.
4. Copia los archivos de `google-apps-script/`.
5. Ejecuta `setupPachaDeportes`.
6. Publica como aplicación web.
7. Copia la URL `/exec`.
8. En `assets/js/config.js`, cambia:

```js
DEMO_MODE: false,
API_URL: "https://script.google.com/macros/s/TU_ID/exec"
```

## Login demo

Administrador:

```txt
admin@pachacamac.gob.pe / admin123
```

Entrenador:

```txt
elvisdennisroblessoto@gmail.com / 10499558E2026
```
