# Campos deportivos v11

Cambios incluidos:

- Reservas para hoy: 30 minutos para pagar, con 10 minutos internos de gracia.
- Reservas para mañana o fechas posteriores: hasta 2 horas hábiles de caja.
- Si la caja está abierta, el plazo termina como máximo al cierre del mismo día.
- Si la caja está cerrada, el conteo empieza en la siguiente apertura.
- La agenda pública muestra reservas pagadas como un bloque rojo oscuro consolidado.
- La agenda muestra el nombre y apellido del titular en la reserva pagada.
- Los eventos municipales se muestran como un bloque naranja opaco consolidado.
- Horarios consecutivos de la misma reserva o evento se unen en un solo bloque.

## Reemplazar en GitHub

- campos-deportivos.html
- assets/css/campos-deportivos.css
- assets/js/campos-deportivos.js

## Reemplazar en Apps Script

- apps-script-alquiler-campos/Code.gs

Después, guardar y actualizar con una nueva versión la implementación pública. La implementación privada también debe actualizarse porque comparte el mismo Code.gs.

No es necesario ejecutar setupRentalSystem(), porque no se agregaron columnas nuevas.
