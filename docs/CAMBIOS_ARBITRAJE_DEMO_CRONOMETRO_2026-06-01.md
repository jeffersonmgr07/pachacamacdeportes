# Cambios de arbitraje, demo y ajustes puntuales

## Arbitraje
- Demo de arbitraje visible solo para administradores.
- Evento nuevo: `anulacion_gol`, que resta un gol al equipo seleccionado.
- Eliminación de eventos desde el modal. Si el evento eliminado es gol o anulación de gol, el marcador se corrige automáticamente.
- Árbitros solo pueden iniciar arbitraje desde 5 minutos antes de la hora programada.
- Administradores pueden iniciar/finalizar cualquier partido en cualquier momento.
- Cronómetro por tiempos dentro del modal. El reloj cambia a alerta cuando se supera el tiempo reglamentario del tiempo.
- Botón compacto para agregar +1 minuto adicional.
- Botón de fase: finalizar primer tiempo, continuar segundo tiempo y finalizar segundo tiempo.

## Administrador
- Botón de cerrar sesión en el panel administrador.
- Botón de volver al modo administrador desde modo arbitraje.
- Mejor contraste puntual en títulos y contadores.
- Estados de partidos como badges estéticos.
- Texto de fecha/campo con formato peruano en tarjetas.

## Registro
- El formulario de registro ahora envía solicitud a Apps Script.
- Se guarda en la hoja `Solicitudes_Registro`.
- Envía correo al administrador `pacharamacdeportes@gmail.com`.
- Envía correo automático al usuario registrado indicando que su solicitud está en evaluación.

## Login desde inicio
- El `index.html` general ahora muestra botón `Iniciar sesión` en la navegación.
- Usa el mismo modal de login del campeonato.
