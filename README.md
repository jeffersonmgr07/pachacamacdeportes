# Pacha Deportes — Fechas no disponibles + aviso de liberación (v1)

## Qué hace esta versión

### Fechas temporalmente no disponibles

Se aplica a **todos los espacios deportivos activos** del sistema:

- Septiembre 2026: todos los sábados y domingos.
  - 05, 06, 12, 13, 19, 20, 26 y 27 de septiembre.
- Del lunes 05 de octubre de 2026 al 31 de diciembre de 2026: todos los días.

La restricción usa el horario normal del sistema: 08:00 a 23:00.

### Prioridad de reservas existentes

Las reservas de usuarios existentes SIEMPRE prevalecen.

Ejemplo:
- Fecha bloqueada: 08:00–23:00
- Usuario ya tiene reserva 10:00–12:00

El sistema crea:
- No disponible 08:00–10:00
- Reserva del usuario 10:00–12:00
- No disponible 12:00–23:00

No cancela ni modifica la reserva existente.

Los talleres, colegios y otros bloqueos administrativos también se respetan.

## Avisarme cuando esté disponible

En la agenda pública las fechas restringidas aparecen en un tono gris/azulado y muestran:

- `Fecha no disponible`
- `Horario no disponible`
- `Avisarme cuando esté disponible`

El formulario solicita:
- Nombre (obligatorio)
- Correo electrónico (obligatorio)
- WhatsApp (opcional)

El contacto mostrado es: **992 211 457**.

Los registros se guardan en:
`Avisos_Disponibilidad_Campos`

El calendario administrativo se guarda en:
`Fechas_No_Disponibles_Campos`

## Liberación administrativa

En Caja → Eventos aparece un nuevo módulo `Fechas temporalmente no disponibles`.

El administrador puede:
- consultar una fecha;
- ver cuántas personas esperan aviso;
- liberar la fecha y avisar;
- volver a bloquearla.

Al liberar una fecha:
1. se desactivan únicamente los bloqueos temporales de esa fecha;
2. las reservas de usuarios permanecen intactas;
3. talleres/eventos permanecen intactos;
4. se envía un correo a cada persona registrada;
5. el correo incluye botón para revisar la agenda y reservar.

El texto del correo aclara de manera sutil que la disponibilidad es compartida y puede ser tomada por otros usuarios.

## Archivos de Apps Script

Reemplaza:
- `Code.gs`
- `Cashier.html`

No reemplaces `Workshops.gs` ni `ClausuraBridge.gs`.

Después:
1. Guarda.
2. Ejecuta `setupRentalSystem()` una vez.
3. Ejecuta `instalarFechasNoDisponibles2026()` una vez.
4. Actualiza la implementación pública.
5. Actualiza la implementación privada de caja.

## Archivos de GitHub

Reemplaza:
- `campos-deportivos.html`
- `assets/js/campos-deportivos.js`
- `assets/css/campos-deportivos.css`

## Funciones útiles

- `instalarFechasNoDisponibles2026()`:
  crea el calendario y bloquea solo los horarios libres.

- `reconciliarFechasNoDisponibles2026()`:
  vuelve a revisar reservas/eventos y rellena correctamente los huecos que deben seguir bloqueados.

Si una reserva pendiente que ya existía vence, el sistema intenta volver a cubrir ese horario con el bloqueo temporal correspondiente.

## Importante

`Avisarme cuando esté disponible` NO genera una reserva. El usuario solo queda registrado para recibir un aviso.

Cuando la fecha se libera, el correo indica que otros usuarios también pueden reservar y recomienda completar la reserva en línea pronto.
