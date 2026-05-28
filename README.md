# Minetti Fútbol - Apps Script + Google Sheets

Proyecto reorganizado para funcionar sin Vercel y sin Next.js.

## Qué incluye este avance

- Página pública deportiva.
- Header y footer como componentes.
- Login de entrenador y administrador.
- Registro de entrenador.
- Registro de equipo.
- Selección de categorías.
- Registro de jugadores con foto.
- Próximos partidos.
- Convocatorias con titulares y suplentes.
- Panel administrador inicial.
- Base de datos en Google Sheets.

## Carpeta principal

```txt
apps-script/
  Code.gs
  SeedData.gs
  Index.html
  Header.html
  Footer.html
  Styles.html
  JavaScript.html
  appsscript.json
```

## Index en raíz

El archivo `index.html` en la raíz es una maqueta de presentación.

La aplicación real se publica desde Apps Script usando:

```txt
apps-script/Index.html
```

## Instalación

1. Crear un Google Sheet.
2. Abrir **Extensiones > Apps Script**.
3. Copiar los archivos de `apps-script/`.
4. Ejecutar `setupMinettiFutbol`.
5. Publicar como **Aplicación web**.

## Usuarios demo

```txt
Admin: admin / admin123
Entrenador: guerreros / demo123
```
