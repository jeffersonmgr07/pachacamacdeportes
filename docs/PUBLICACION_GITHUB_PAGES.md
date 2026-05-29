# Publicar en GitHub Pages

1. Sube este proyecto a un repositorio de GitHub.
2. Entra a Settings > Pages.
3. En Source elige `Deploy from a branch`.
4. Selecciona la rama `main` y carpeta `/root`.
5. Guarda.
6. GitHub te dará una URL pública.

## Conectar con Apps Script

Edita `assets/js/config.js`:

```js
API_URL: "https://script.google.com/macros/s/TU_ID/exec",
DEMO_MODE: false
```
