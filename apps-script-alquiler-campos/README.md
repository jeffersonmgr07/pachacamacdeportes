# Instalación del sistema de alquiler

1. Abre la Google Sheet oficial de Pacha Deportes.
2. Ve a **Extensiones > Apps Script**.
3. Crea un proyecto independiente o añade estos archivos en un proyecto separado. Se recomienda separado para no interferir con el script del campeonato.
4. Copia `Code.gs` y crea el archivo HTML `Cashier` con el contenido de `Cashier.html`.
5. En **Configuración del proyecto**, usa la zona horaria `America/Lima`.
6. Ejecuta una vez `setupRentalSystem()` y autoriza los permisos.
7. Ve a **Implementar > Nueva implementación > Aplicación web**:
   - Ejecutar como: tú.
   - Quién tiene acceso: cualquier usuario.
8. Copia la URL terminada en `/exec` y pégala en `assets/js/config.js`, propiedad `RENTALS_API_URL`.
9. Vuelve a subir a GitHub los archivos web modificados.

## Uso en caja

La opción recomendada es abrir la Google Sheet y usar el menú **Alquiler de campos > Abrir panel de caja**. El cajero busca el código, registra el comprobante y pulsa **Confirmar pago**. Esto evita correos accidentales por editar manualmente una celda.

También existe una casilla `confirmPayment` en la hoja `Reservas_Campos`. Al marcarla, el script valida el plazo y confirma el pago.

## Política implementada

- Horario del recinto: 8:00 a. m. a 11:00 p. m.
- De 8:00 a. m. a 6:00 p. m.: S/ 20 por hora.
- De 6:00 p. m. a 11:00 p. m.: S/ 30 por hora.
- Reserva para hoy: 10 minutos para pagar.
- Reserva dentro de los próximos 7 días, con caja abierta: 30 minutos.
- Reserva lejana o creada con caja cerrada: hasta las 5:00 p. m. del siguiente día hábil, siempre antes del evento.
- Gracia administrativa: 10 minutos adicionales para que caja registre un pago recibido a tiempo.
- Después de la gracia: estado `VENCIDO` y el horario vuelve a quedar libre.
- Caja: lunes a viernes de 8:00 a. m. a 5:00 p. m.
