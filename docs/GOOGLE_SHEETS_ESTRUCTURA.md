# Estructura Google Sheets

El archivo maestro está en:

```txt
docs/pacha-deportes-google-sheets-maestro.xlsx
```

## Pestañas

### Config
Configuración general.

### Categorias
Reglas de categorías, años de nacimiento, titulares y mínimos.

### Usuarios
Login de administradores y entrenadores.

Columnas principales:

```txt
email
password
role
status
teamId
```

### Entrenadores
Datos de entrenadores y equipos.

### Equipos
Datos generales de equipos, razón social, dirección, WhatsApp, correo e insignia.

### Jugadores
Nómina general de jugadores.

Máximo recomendado por equipo: 15 jugadores.

### Fixture
Programación de partidos y resultados.

Para cargar un resultado:

```txt
status = jugado
homeScore = goles local
awayScore = goles visitante
resultType = normal / W.O. / reclamo
```

### Convocatorias
Se llena desde el panel entrenador cuando se guarda una convocatoria.

### Sanciones
Registro de tarjetas, expulsiones y suspensiones.

## Importante

No cambies los nombres de las pestañas ni los encabezados de la fila 1.
El Apps Script lee exactamente esos nombres.
