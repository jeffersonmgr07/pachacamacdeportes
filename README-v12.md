# Pacha Deportes — Campos deportivos v12

## Cambios
- Permite solicitudes para el mismo día aun cuando caja está cerrada, siempre que el horario todavía no haya empezado.
- El plazo excepcional es de 30 minutos, redondeado al siguiente múltiplo de 5 y limitado a 5 minutos antes del inicio.
- Mantiene 10 minutos internos de gracia para caja.
- El comprobante y correo indican que debe coordinarse inmediatamente con el administrador.
- Los bloqueos administrativos ya no se muestran automáticamente como “Evento municipal”.
- En Cashier aparece la casilla “Es un evento municipal”.
- Sin marcar: “Reservado para [motivo]”.
- Marcada: “Evento municipal — [motivo]”.

## Archivos para GitHub
- campos-deportivos.html
- assets/js/campos-deportivos.js
- assets/css/campos-deportivos.css

## Archivos para Apps Script
- apps-script-alquiler-campos/Code.gs
- apps-script-alquiler-campos/Cashier.html

## Instalación
1. Reemplazar los archivos.
2. Ejecutar una vez `setupRentalSystem()` para agregar las columnas `paymentMode`, `paymentNotice` e `isMunicipalEvent`.
3. Crear una nueva versión de la implementación pública.
4. Crear una nueva versión de la implementación privada de caja.
