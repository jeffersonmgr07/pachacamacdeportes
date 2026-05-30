# Actualización Fecha 3 - Sub 13 y Sub 15

Se agregó la programación oficial del sábado 30 de mayo para las categorías Sub 13 y Sub 15.

## Partidos agregados

| Hora | Partido | Categoría |
|---|---|---|
| 09:00 AM | Guerreros de Manchay vs JM Sport | Sub 13 |
| 10:10 AM | Remanente FC vs Tolentino FC | Sub 13 |
| 11:20 AM | Juventud Costa FC vs Talentos Unidos | Sub 15 |
| 12:30 PM | Guerreros de Manchay vs Mathe Sport | Sub 15 |
| 01:40 PM | Cachorros FC vs Benjamin FC | Sub 13 |

## Hoja de cálculo

En la hoja `Fixture`, estos partidos están como:

- `M003-021`
- `M003-022`
- `M003-023`
- `M003-024`
- `M003-025`

También se agregó el equipo `JUVENTUD COSTA FC` con ID `EQ102`.

## Apps Script

Si ya tienes tu hoja de cálculo en uso, no necesitas reemplazar toda la hoja. Copia los scripts actualizados y ejecuta esta función una sola vez:

```js
actualizarFecha3Sub13Sub15
```

Esa función actualiza o agrega los partidos en la hoja `Fixture` y agrega `JUVENTUD COSTA FC` en la hoja `Equipos` si aún no existe.

Después de actualizar los archivos `.gs`, recuerda ir a:

`Implementar > Administrar implementaciones > Editar > Versión nueva > Guardar`

