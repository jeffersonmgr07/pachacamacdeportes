# Cambios realizados - móvil y login (2026-05-31)

## Menú móvil
- Se corrigió el botón **Menú**: antes solo agregaba la clase `show-nav`, pero no existía CSS que mostrara el menú.
- Se agregó apertura/cierre del menú con JavaScript, cierre al tocar un enlace, cierre al tocar fuera y cierre con tecla Escape.
- Se agregaron atributos de accesibilidad (`aria-expanded`, `aria-controls`, `aria-label`).
- Se mejoró el diseño móvil: menú desplegable tipo card, botones táctiles más grandes, mejor espaciado, modales tipo bottom sheet y cards más cómodas en pantalla pequeña.

## Login
- Se agregó manejo de errores con `try/catch`; ahora muestra mensajes claros si Apps Script no responde o si la URL está mal configurada.
- Se agregó timeout de 15 segundos para evitar que el login quede “congelado”.
- Se normalizó el usuario devuelto por Apps Script para que el frontend reconozca siempre `email`, `role`, `status`, `fullName`, `shortName`, `teamId` y `teamName`.
- El campo de acceso ahora acepta **correo, usuario o DNI**.
- Se reforzó `google-apps-script/Auth.gs` para buscar credenciales en `Usuarios` y, como respaldo, en `Entrenadores`.

## Importante para publicar
1. Subir estos archivos a GitHub.
2. Si el login sigue sin funcionar, copiar los archivos de `google-apps-script/` al proyecto de Apps Script.
3. En Apps Script, publicar una **nueva versión** como aplicación web:
   - Ejecutar como: **Yo**
   - Acceso: **Cualquier usuario**
4. Copiar la URL `/exec` nueva y actualizarla en `assets/js/config.js` si cambió.
