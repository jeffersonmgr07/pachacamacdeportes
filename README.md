# Minetti Fútbol - GitHub Pages + Google Apps Script

Proyecto HTML/CSS/JS para publicar en GitHub Pages, conectado a Google Sheets mediante Google Apps Script.

## Estructura

```txt
index.html
login.html
admin.html
entrenador.html
fixture.html
resultados.html
tabla-posiciones.html
equipos.html

assets/
  css/styles.css
  js/config.js
  js/api.js
  js/mock-data.js
  components/header.js
  components/footer.js
  img/jugadores/

google-apps-script/
  Code.gs
  Setup.gs
  Api.gs
  Auth.gs
  Sheets.gs
  SeedData.gs
  appsscript.json
```

## Funcionamiento

- GitHub Pages muestra toda la web visual.
- Google Apps Script funciona solo como API/backend.
- Google Sheets guarda usuarios, equipos, jugadores, fixture, resultados y convocatorias.

## Usuarios demo

- Administrador: `admin / admin123`
- Entrenador demo: `guerreros / demo123`

## Para conectar Apps Script

1. Crea o abre tu Google Sheet.
2. Ve a Extensiones > Apps Script.
3. Copia los archivos `.gs` de la carpeta `google-apps-script`.
4. Ejecuta `setupMinettiFutbol`.
5. Publica como Aplicación web.
6. Copia la URL `/exec`.
7. Pégala en `assets/js/config.js` en `API_URL`.
8. Cambia `DEMO_MODE` a `false`.
