# Cambios: validaciones de convocatoria, duplicados y filtros

## Convocatorias

- Sub 6 y Sub 8: máximo 7 titulares.
- Sub 10, Sub 12 y Sub 13: máximo 9 titulares.
- Sub 15, Sub 16 y Sub 18: máximo 11 titulares.
- El límite se lee primero desde la hoja `Categorias`, columna `playersOnField`.
- Si la hoja no tiene ese dato, el sistema aplica la regla por defecto.

## Jugadores duplicados

Al registrar un jugador se valida por DNI:

- Si el DNI ya existe en otro equipo, se bloquea el registro.
- Si el DNI ya existe en el mismo equipo, se indica que debe editar el jugador existente y habilitar la categoría correspondiente.

## Fixture

- El estado ahora se muestra como texto descriptivo, por ejemplo: `Partido jugado con normalidad`.
- El marcador sigue apareciendo entre ambos equipos.
- Se mejoraron los badges para que el texto tenga mejor contraste.

## Resultados

- Se agregaron filtros por fecha, categoría y equipo.

## Tabla de posiciones

- Se mejoró el contraste del texto `Categoría`.
