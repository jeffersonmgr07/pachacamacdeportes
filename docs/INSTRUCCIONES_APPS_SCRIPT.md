# Publicación de Apps Script como API

1. Abre el Google Sheet maestro.
2. Ve a `Extensiones > Apps Script`.
3. Crea los archivos `.gs`:
   - Code.gs
   - Setup.gs
   - Api.gs
   - Auth.gs
   - Sheets.gs
   - SeedData.gs
4. Copia el contenido desde la carpeta `google-apps-script/`.
5. En configuración activa el manifiesto `appsscript.json` y copia su contenido.
6. Ejecuta `setupPachaDeportes`.
7. Publica:
   - Implementar > Nueva implementación
   - Tipo: Aplicación web
   - Ejecutar como: Yo
   - Acceso: Cualquier usuario
8. Copia la URL que termina en `/exec`.
9. Pégala en `assets/js/config.js`.
