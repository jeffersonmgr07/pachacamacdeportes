# Corrección del botón Login

Se cambió el botón de login para que use `id="loginBtn"` y eventos con `addEventListener`, en lugar de depender solo de `onclick`.

También se agregó una validación para mostrar un mensaje claro si la página se abre fuera de Apps Script.

## Para probar

1. Ejecuta `setupMinettiFutbol`.
2. Ejecuta `testLoginDemo`.
3. Publica como aplicación web.
4. Abre la URL de Apps Script.
5. Ve a `?page=login`.
6. Ingresa `admin / admin123`.

Si abres el HTML directo, el login no funcionará porque `google.script.run` es exclusivo de Apps Script.
