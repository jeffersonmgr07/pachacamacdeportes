# Imágenes de equipos y jugadores

## Insignias / escudos de equipos

Guárdalas dentro del repositorio en:

```txt
assets/img/equipos/
```

Recomendación principal:

```txt
assets/img/equipos/EQ010.png
```

También se aceptan nombres amigables sin espacios, sin tildes y en minúsculas:

```txt
assets/img/equipos/guerreros-de-manchay.png
assets/img/equipos/jm-sport.png
```

En la hoja `Equipos` o `Entrenadores`, columna `crestUrl`, coloca exactamente esa ruta.

## Fotos de jugadores

Guárdalas dentro del repositorio en:

```txt
assets/img/jugadores/
```

Recomendación:

```txt
assets/img/jugadores/DNI.png
```

Ejemplo:

```txt
assets/img/jugadores/10499558.png
assets/img/jugadores/94768639.png
```

En la hoja `Jugadores`, columna `photoUrl`, coloca la ruta correspondiente. Si la dejas vacía, el sistema intentará cargar automáticamente:

```txt
assets/img/jugadores/<DNI>.png
```

## Imágenes de fondo del campeonato

El hero del campeonato usa:

```txt
assets/img/bg-futbol-menores.svg
```

Puedes reemplazarlo por una imagen real, por ejemplo:

```txt
assets/img/bg-futbol-menores.jpg
```

Si cambias el nombre del archivo, actualiza la ruta en `assets/css/styles.css`.
