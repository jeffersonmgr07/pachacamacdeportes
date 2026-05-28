# Minetti Fútbol - Apps Script + Google Sheets

Versión corregida con login de entrenadores y administrador.

## Importante sobre el login

El botón de login solo funciona cuando la página se abre desde la URL publicada de Google Apps Script.

No funciona si abres `index.html` o `apps-script/Index.html` directamente en Chrome, porque ahí no existe `google.script.run`.

## Pasos correctos

1. Crea un Google Sheet.
2. Ve a `Extensiones > Apps Script`.
3. Crea/copias estos archivos en Apps Script:
   - Code.gs
   - SeedData.gs
   - Index.html
   - Header.html
   - Footer.html
   - Styles.html
   - JavaScript.html
   - appsscript.json
4. Guarda.
5. Ejecuta la función `setupMinettiFutbol`.
6. Autoriza permisos.
7. Ejecuta opcionalmente `testLoginDemo`.
8. Publica:
   - Implementar > Nueva implementación
   - Tipo: Aplicación web
   - Ejecutar como: Yo
   - Acceso: Cualquier usuario
9. Abre la URL `/exec` que te da Google.

## Usuarios demo

Administrador:

- Usuario: `admin`
- Contraseña: `admin123`

Entrenador demo:

- Usuario: `guerreros`
- Contraseña: `demo123`

## Páginas

- `?page=inicio`
- `?page=fixture`
- `?page=resultados`
- `?page=tabla`
- `?page=equipos`
- `?page=login`
- `?page=admin`
- `?page=entrenador`
