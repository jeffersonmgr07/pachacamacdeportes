# Sistema de alquiler de campos v5

## Almacenamiento
GitHub Pages solo aloja el HTML/CSS/JS. Las reservas se guardan en Google Sheets:
- `Reservas_Campos`: cabecera de la solicitud, cliente, total, estado y vencimiento.
- `Reserva_Items`: cada fecha y bloque horario de la reserva.
- `Bloqueos_Campos`: horarios bloqueados por la municipalidad sin pago.
- `Campos_Deportivos`: catálogo de espacios.

El campo `itemsJson` de `Reservas_Campos` es una copia compacta para consulta; la fuente principal de cada horario es `Reserva_Items`.

## Seguridad recomendada: dos implementaciones del mismo Apps Script

### 1. Implementación pública
- Ejecutar como: **tú**.
- Acceso: **cualquier usuario**.
- Esta URL se coloca en `assets/js/config.js` como `RENTALS_API_URL`.
- Solo permite consultar disponibilidad y crear solicitudes.
- Las funciones de caja exigen una cuenta Google incluida en `AUTHORIZED_CASHIERS`.

### 2. Implementación privada de caja
- Ejecutar como: **usuario que accede a la aplicación web**.
- Acceso: usuarios con cuenta Google (o solo usuarios de tu organización, si usas Google Workspace).
- Abrir: `URL_PRIVADA/exec?view=cashier`.
- La cuenta debe aparecer en `AUTHORIZED_CASHIERS`.

No incrustes una contraseña fija en GitHub Pages: el JavaScript es público y cualquier persona podría leerla.

## Instalación
1. Reemplaza `Code.gs` y `Cashier.html`.
2. Añade los correos autorizados en `AUTHORIZED_CASHIERS`.
3. Ejecuta `setupRentalSystem()` una vez.
4. Autoriza permisos.
5. Actualiza la implementación pública con una nueva versión.
6. Crea la implementación privada de caja.

## Bloqueos municipales
En el panel privado abre **Bloqueo municipal**, indica campo, fecha, hora de inicio, hora de fin y motivo. El calendario público lo mostrará en rojo como ocupado. El bloqueo puede liberarse desde el mismo panel.
