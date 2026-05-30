# Corrección conexión, jugadores e imágenes

## Jugadores reales vs demo

El frontend ahora queda con `DEMO_MODE: false` en `assets/js/config.js`. Si vuelve a aparecer `Jugador Guerreros 1`, revisa que no esté en `DEMO_MODE: true` o que tu URL de Apps Script no esté fallando.

## Importante sobre Apps Script

Cuando actualices los archivos `.gs`, debes ir a **Implementar > Administrar implementaciones > Editar** y seleccionar la **nueva versión**. Crear una versión sin actualizar la implementación puede dejar la web usando el código anterior.

La función `setupPachaDeportes()` fue corregida para no borrar hojas existentes ni reemplazar tus jugadores reales. No la uses para reiniciar datos, solo para crear columnas faltantes.

## Rutas de imágenes

Fondos:

```txt
assets/img/backgrounds/bg-index-deportivo.jpg
assets/img/backgrounds/bg-futbol-menores-real.jpg
```

Insignias de equipos:

```txt
assets/img/equipos/EQ001.PNG
assets/img/equipos/EQ010.PNG
```

Fotos de jugadores:

```txt
assets/img/jugadores/DNI.png
```

En Google Sheets puedes colocar la ruta exacta en `crestUrl` o `photoUrl`. Si está vacío, el sistema intentará cargar la imagen por código de equipo o DNI.
