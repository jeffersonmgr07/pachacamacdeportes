# Corrección visual

Cambios aplicados:

- Logo principal apuntando a `assets/img/logo-pacha-deportes.png`.
- Barra superior negra con textos más finos: Gestión Deportiva / Distrito Pachacamac.
- Hero principal con imagen de fondo de baja opacidad sin retirar degradados.
- Hero del campeonato Fútbol de Menores 2026 con imagen de fondo de baja opacidad.
- Recuadros del hero cambiados a textos más comerciales.
- Footer ampliado con secciones y enlaces.
- Modal y página de login con título “Iniciar sesión”.
- Eliminados botones demo de entrenador y administrador.

No se modificó Google Apps Script para estos cambios. Son cambios de frontend HTML/CSS/JS.

## Nueva mejora de panel entrenador

- Logo del header sin recuadro blanco.
- Barra superior negra con tipografía más fina.
- Login con texto “Contraseña” y placeholder “Ingresa tu contraseña”.
- Panel entrenador aclarado visualmente.
- Escudo/insignia del equipo en sidebar y perfil.
- Perfil muestra solo categorías habilitadas como etiquetas; al editar aparecen checkboxes.
- Registro de jugador ahora se abre en modal.
- Jugadores separados en nombres, apellidos, tipo de documento, número de documento, fecha, foto y categorías.
- Máximo 15 jugadores por categoría.
- Filtro de nómina por categoría.
- Próximos partidos ahora se muestran como calendario por fecha.
- Convocatorias vuelven a mostrarse como cards y se abren en modal.
- La convocatoria filtra jugadores por categoría del partido.

## Sobre imágenes de jugadores y escudos

Para esta versión estática en GitHub Pages, lo más estable es usar una ruta o URL pública:

- Escudo del equipo: `assets/img/equipos/nombre-equipo.png` o una URL pública.
- Foto del jugador: `assets/img/jugadores/DNI.png` o una URL pública.

La subida directa de archivos hacia Google Drive desde GitHub Pages requiere un flujo adicional de Apps Script/Drive. Por ahora no se toca si solo usarás rutas o URLs.
