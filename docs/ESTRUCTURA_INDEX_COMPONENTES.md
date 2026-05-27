# Estructura de index y componentes

Este proyecto tiene dos archivos principales relacionados con el inicio:

## 1. `index.html` en la raíz

Es una vista estática y presentable para revisar el diseño base del campeonato desde GitHub o abriéndola en el navegador.

No se conecta a Google Sheets.

## 2. `apps-script/Index.html`

Es el archivo principal real de Google Apps Script.

Este archivo se publica como Web App y sí carga la información desde Google Sheets usando `Code.gs` y `JavaScript.html`.

## Componentes globales

Para reutilizar estructura en todas las páginas se agregaron:

- `apps-script/Header.html`
- `apps-script/Footer.html`

`apps-script/Index.html` los incluye así:

```html
<?!= include('Header'); ?>
<?!= include('Footer'); ?>
```

En Apps Script, los archivos HTML se manejan en el mismo nivel del proyecto, por eso los componentes no van dentro de carpetas.
