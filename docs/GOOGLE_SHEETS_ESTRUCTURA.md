# Estructura de Google Sheets

Crea estas hojas con los encabezados exactos en la fila 1.

## Config
`name | organizer | venue | season | status`

## Categorias
`id | label | birthYears | fieldPlayers | minPlayers | gameTime | break`

## Usuarios
`id | username | password | role | name | teamId | status`

## Equipos
`id | name | category | group`

## Equipos_Perfil
`id | name | businessName | address | whatsapp | email | updatedAt`

## Jugadores
`id | teamId | teamName | category | firstName | lastName | dni | birthDate | photoFileName | status | createdAt`

## Fixture
`id | round | dateLabel | field | time | home | away | category | group | status | homeScore | awayScore | updatedAt`

## Convocatorias
`id | matchId | teamId | status | createdAt`

## Convocatoria_Detalle
`convocationId | playerId | type`

## Sanciones
`id | playerId | matchId | type | matches | status | notes`

Puedes ejecutar `setupMinettiFutbol` desde Apps Script para crear estas hojas automáticamente.
