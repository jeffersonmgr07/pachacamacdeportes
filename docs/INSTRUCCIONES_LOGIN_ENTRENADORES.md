# Login de entrenadores y administrador

Este avance convierte el proyecto en una aplicación Google Apps Script con Google Sheets como base de datos.

## Archivos principales

Copia estos archivos en el editor de Apps Script:

- `Code.gs`
- `SeedData.gs`
- `Index.html`
- `Header.html`
- `Footer.html`
- `Styles.html`
- `JavaScript.html`
- `appsscript.json`

## Crear la base de datos en Google Sheets

1. Crea un Google Sheet nuevo.
2. Entra a **Extensiones > Apps Script**.
3. Copia los archivos de la carpeta `apps-script/`.
4. Ejecuta la función:

```txt
setupMinettiFutbol
```

5. Autoriza permisos.

La función creará estas hojas:

- `Config`
- `Categorias`
- `Equipos`
- `Fixture`
- `Jugadores`
- `Delegados`
- `Convocatorias`
- `Convocatoria_Detalle`
- `Sanciones`
- `Usuarios`
- `Equipos_Perfil`
- `Equipo_Categorias`

## Usuarios demo

Administrador:

```txt
usuario: admin
contraseña: admin123
```

Entrenador demo Guerreros:

```txt
usuario: guerreros
contraseña: demo123
```

## Rutas de la web app

Cuando publiques como aplicación web, tendrás una URL tipo:

```txt
https://script.google.com/macros/s/XXXX/exec
```

Rutas:

```txt
?page=inicio
?page=fixture
?page=resultados
?page=tabla
?page=equipos
?page=login
?page=entrenador
?page=admin
```

## Qué puede hacer el entrenador

- Crear cuenta.
- Registrar datos personales.
- Registrar datos del equipo.
- Seleccionar categorías: Sub 6, Sub 8, Sub 10, Sub 12, Sub 15 y Sub 16.
- Registrar jugadores con nombre, DNI, fecha de nacimiento, categoría y foto.
- Ver próximos partidos.
- Enviar convocatoria con titulares y suplentes.

## Qué puede ver el administrador

- Equipos registrados.
- Jugadores registrados.
- Convocatorias enviadas.
- Cargar resultados rápidos.

## Fotos de jugadores

El formulario permite subir una foto. Apps Script la guarda en Google Drive.

Si quieres usar una carpeta específica de Drive, crea una carpeta y pega su ID en la hoja `Config` con esta clave:

```txt
PLAYER_PHOTOS_FOLDER_ID
```

Si no defines una carpeta, el sistema intentará crear o usar:

```txt
IMG/jugadores
```

## Importante sobre seguridad

Este login es una primera versión práctica para torneo local. Las contraseñas se guardan en Google Sheets como texto simple para facilitar la administración inicial. Para una versión más seria se debe cambiar a contraseñas encriptadas o control mediante cuentas Google.
