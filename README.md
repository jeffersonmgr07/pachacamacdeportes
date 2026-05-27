# Minetti Fútbol - Versión Google Sheets + Apps Script

Este ZIP reorganiza el proyecto para funcionar sin Vercel y sin Next.js.

## Qué contiene

- `apps-script/Code.gs`: backend de Apps Script.
- `apps-script/SeedData.gs`: data inicial del torneo, equipos, fixture, resultados de Fecha 1 y Fecha 2, jugadores de Guerreros Sub 6.
- `apps-script/Index.html`: web app única.
- `apps-script/Styles.html`: estilos.
- `apps-script/JavaScript.html`: lógica del frontend.
- `apps-script/appsscript.json`: manifiesto.
- `google-sheets-template/csv/`: respaldo en CSV de las pestañas que se crean.
- `assets/jugadores/`: fotos PNG de jugadores disponibles en el ZIP.

## Cómo instalarlo

### Opción simple desde Google Sheets

1. Crea un Google Sheet nuevo con el nombre:
   `Minetti Fútbol - Base de datos`

2. En ese Google Sheet entra a:
   `Extensiones > Apps Script`

3. Crea estos archivos en Apps Script y copia el contenido de la carpeta `apps-script/`:
   - `Code.gs`
   - `SeedData.gs`
   - `Index.html`
   - `Styles.html`
   - `JavaScript.html`

4. En Apps Script ejecuta la función:
   `setupMinettiFutbol`

5. Autoriza los permisos.

6. Vuelve al Google Sheet. Se habrán creado estas pestañas:
   - Config
   - Categorias
   - Equipos
   - Fixture
   - Jugadores
   - Delegados
   - Convocatorias
   - Convocatoria_Detalle
   - Sanciones

7. Publica la web:
   `Implementar > Nueva implementación > Aplicación web`

8. Configura:
   - Ejecutar como: `Yo`
   - Quién tiene acceso: `Cualquier usuario`

9. Copia el link `/exec`. Ese será el link público.

## Rutas de la web

La web usa el mismo link de Apps Script con parámetro `page`:

- Inicio: `?page=inicio`
- Fixture: `?page=fixture`
- Resultados: `?page=resultados`
- Tabla: `?page=tabla`
- Equipos: `?page=equipos`
- Delegado demo: `?page=delegado&token=demo-guerreros-sub6`
- Admin simple: `?page=admin`

## Cómo actualizar resultados

Tienes dos formas:

1. Directamente desde la hoja `Fixture`:
   - `status`: escribe `jugado`
   - `homeScore`: goles local
   - `awayScore`: goles visita
   - `resultType`: `normal`, `wo` o `reclamo`

2. Desde la página:
   - `?page=admin`

La tabla de posiciones se calcula automáticamente desde los partidos con `status = jugado`.

## Fotos de jugadores

Apps Script no maneja carpetas públicas internas como Next.js. Para las fotos:

1. Crea una carpeta en Google Drive llamada:
   `IMG/jugadores`

2. Sube las fotos en formato PNG usando como nombre el DNI:
   `94768639.png`
   `91972988.png`

3. Comparte la carpeta o los archivos con permiso de lectura.

4. Copia el ID de la carpeta de Drive.

5. En la hoja `Config`, pega ese ID en:
   `PLAYER_PHOTOS_FOLDER_ID`

También puedes colocar una URL directa en la columna `photoUrl` de la hoja `Jugadores`.

## Datos incluidos

- Categorías Sub 6, Sub 8, Sub 10 y Sub 12.
- Equipos del torneo.
- Fixture inicial.
- Resultados Fecha 1 y Fecha 2.
- Tabla calculada automáticamente.
- Demo de delegado para Guerreros de Manchay Sub 6.
- Nómina general de jugadores en cards.
- Convocatoria con titulares y suplentes.
- Los jugadores elegidos desaparecen de la lista disponible.


## Index y componentes visuales

- `index.html` en la raíz: vista estática de presentación para revisar el estilo deportivo del campeonato.
- `apps-script/Index.html`: archivo principal real para publicar con Google Apps Script.
- `apps-script/Header.html`: componente global del encabezado.
- `apps-script/Footer.html`: componente global del pie de página.

Para Apps Script, copia todos los archivos de `apps-script/` al editor de Apps Script. El archivo que se renderiza como web app es `Index.html`.
