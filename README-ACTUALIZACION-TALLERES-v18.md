# Actualización puntual de talleres v18

Esta versión corrige la consulta de matrículas y mejora el correo de inscripción sin alterar el resto del sistema.

## Correcciones web

- El campo de código de matrícula inicia completamente vacío.
- Ya no agrega automáticamente las letras `PE` mientras el usuario escribe.
- El usuario puede copiar el código completo tal como aparece en el correo.
- El servidor acepta el código con o sin `PE`, elimina espacios y compara de forma normalizada.
- La búsqueda compara de forma más tolerante el primer apellido del menor para matrículas antiguas o migradas.

## Correcciones de correo

- Asunto: `Inscripción al taller de vóley para Laritza`.
- El saludo usa solamente el primer nombre del apoderado: `Hola Jefferson`.
- La tabla principal conserva matrícula, alumno, taller, lugar, tipo de pago y vigencia.
- Horario, periodo, vencimiento y cuota mensual aparecen en tarjetas visuales debajo de la información principal.
- Las instrucciones y el enlace de consulta se mantienen.

## Instalación

1. En Google Apps Script, reemplazar `Code.gs` y `Workshops.gs`.
2. Guardar y ejecutar una vez `setupRentalSystem()`.
3. Actualizar las implementaciones pública y privada existentes usando una nueva versión. No crear URLs nuevas.
4. En GitHub, reemplazar `taller-consulta.html` y `assets/js/taller-consulta.js`.
5. Esperar la publicación de GitHub Pages y recargar con `Cmd + Shift + R` o `Ctrl + Shift + R`.

No es necesario reemplazar `Cashier.html` en esta actualización.
