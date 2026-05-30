# Imágenes de equipos y jugadores

## Insignias de equipos

Guardar los logos/escudos de los equipos en:

```txt
assets/img/equipos/
```

Puedes usar dos formas de nombre:

```txt
assets/img/equipos/EQ010.png
assets/img/equipos/guerreros-de-manchay.png
```

La forma recomendada es usar el `teamId` que aparece en la hoja `Equipos`.

Ejemplo para Guerreros de Manchay:

```txt
assets/img/equipos/EQ010.png
```

## Fotos de jugadores

Guardar las fotos de jugadores en:

```txt
assets/img/jugadores/
```

Nombre recomendado:

```txt
DNI.png
```

Ejemplo:

```txt
assets/img/jugadores/94768639.png
assets/img/jugadores/91972988.png
assets/img/jugadores/92523349.png
```

En la hoja `Jugadores`, el campo `photoUrl` puede quedar así:

```txt
assets/img/jugadores/94768639.png
```

## Nota

Si quieres que los entrenadores suban imágenes directamente desde el panel web, se debe implementar una función adicional en Apps Script para recibir base64 y guardar el archivo en Google Drive. Por ahora, la opción más estable es subir las imágenes manualmente al repositorio de GitHub.
