# Panel de árbitros y super acceso administrador

## Roles

### Nivel 1: entrenador / delegado
Accede a `entrenador.html`. Puede gestionar equipo, jugadores, calendario y convocatorias.

### Nivel 2: árbitro
Accede a `arbitro.html`. Puede ver partidos asignados, iniciar arbitraje, registrar eventos y finalizar partido.

### Nivel 3: administrador
Accede a `admin.html`. Tiene super acceso a equipos, jugadores, fixture, accesos y también puede ingresar a `arbitro.html` para arbitrar cualquier partido desde mesa.

## Usuarios árbitros

Agregar en la hoja `Usuarios` una fila como esta:

| userId | trainerId | teamId | fullName | shortName | dni | email | password | teamName | role | status |
|---|---|---|---|---|---|---|---|---|---|---|
| ARB001 |  |  | Juan Pérez | Juan Pérez | 12345678 | arbitro@gmail.com | 123456 |  | arbitro | activo |

El rol debe ser `arbitro`. El `teamId` queda vacío.

## Hojas nuevas recomendadas

### Arbitros
| refereeId | userId | fullName | shortName | dni | email | phone | status |

### Partido_Arbitros
| matchId | refereeId | userId | email | role | status |

Sirve para asignar árbitros a partidos específicos.

### Eventos_Partido
| eventId | matchId | minute | teamSide | teamName | playerId | playerName | eventType | notes | createdBy | createdAt |

Eventos permitidos desde el panel:
- gol
- amarilla
- roja
- penal
- autogol
- observacion

### Resultados
| matchId | homeScore | awayScore | status | resultType | updatedBy | updatedAt |

## Funcionamiento

1. El usuario inicia sesión.
2. Si es admin, entra a `admin.html`; también puede entrar a `arbitro.html` para arbitrar cualquier partido.
3. Si es árbitro, entra directo a `arbitro.html`.
4. En el panel árbitro el usuario toca “Iniciar arbitraje”.
5. Se abre un modal móvil con marcador, eventos y botón de finalizar.
6. Cada gol incrementa el marcador y registra evento.
7. Al finalizar, se guarda el resultado en `Fixture` y también en `Resultados`.

## Apps Script

Después de subir los archivos a GitHub, copia/actualiza también la carpeta `google-apps-script` en Apps Script y publica una nueva versión de la aplicación web.

Acciones nuevas del backend:
- `startMatch`
- `saveMatchEvent`
- `finishMatch`

La función `setupPachaDeportes()` ahora también crea las hojas nuevas si no existen.
