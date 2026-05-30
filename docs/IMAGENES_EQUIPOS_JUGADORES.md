# Imágenes de equipos y jugadores

## Opción simple recomendada por ahora

Subir manualmente las imágenes al repositorio de GitHub:

```txt
assets/img/equipos/
assets/img/jugadores/
```

### Insignias de equipos

Nombre recomendado:

```txt
assets/img/equipos/EQ001.png
assets/img/equipos/EQ010.png
```

También puedes colocar una ruta personalizada en el perfil del equipo, en el campo `crestUrl`.

### Fotos de jugadores

Nombre recomendado:

```txt
assets/img/jugadores/DNI.png
```

Ejemplo:

```txt
assets/img/jugadores/10499558.png
```

## Subida automática de imágenes

Se puede implementar, pero con la arquitectura actual GitHub Pages + Apps Script API no es tan directo como cuando todo el HTML vive dentro de Apps Script.

Para permitir subida real a Drive se necesitaría una de estas opciones:

1. Crear un formulario de carga alojado en Apps Script para recibir archivos y guardarlos en Google Drive.
2. Usar un servicio externo de imágenes como Cloudinary, Firebase Storage o Supabase Storage.
3. Implementar subida base64 hacia Apps Script con control de tamaño, lo cual no es recomendable para fotos grandes.

Por ahora el proyecto queda preparado para leer imágenes desde ruta o URL pública.
