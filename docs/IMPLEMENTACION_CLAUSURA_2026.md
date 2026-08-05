# Implementación inicial - Campeonato Clausura de Menores 2026

## Separación del Apertura

- El campeonato Apertura se mantiene como archivo de consulta.
- `campeonato-futbol-menores-2026.html` ahora se muestra como campeonato finalizado.
- `registro.html` ya no permite nuevas solicitudes del Apertura y deriva al Clausura.
- `campeonatos.html` muestra el Clausura como campeonato activo y el Apertura como finalizado.

## Carpeta pública nueva

`campeonato-clausura-2026/`

- `index.html`: información, categorías, monto, fecha, horario y bases.
- `inscripcion.html`: ficha del delegado/profesor, equipo, RUC opcional, categorías y creación de contraseña.
- `estado.html`: consulta de inscripción y orden de pago.
- `panel.html`: acceso del delegado y registro de jugadores después del pago.
- `bases-torneo-municipal-menores-2026.pdf`: reglamento entregado para esta implementación.
- `assets/`: configuración, API, estilos y lógica independiente.

## Backend independiente

`apps-script-campeonato-clausura-2026/`

Este Apps Script debe instalarse en una Google Sheet nueva. Incluye:

- creación automática de hojas;
- inscripción a S/ 50.00 por categoría;
- cuenta inmediata en estado pendiente;
- orden de pago;
- plazo principal de 3 días y 2 días de gracia;
- recordatorios diarios al mediodía;
- inhabilitación automática;
- caja privada para confirmar pagos;
- activación del panel del delegado;
- registro de jugadores con foto, documento y autorización;
- validación de año de nacimiento y máximo de 12 jugadores;
- endpoint preparado para integrar un proveedor de pago online.

## Google Sheet

Se incluye:

`google-sheets-template/pacha-deportes-clausura-menores-2026.xlsx`

La plantilla contiene todas las pestañas del sistema y un resumen operativo.

## Configuración pendiente antes de publicar

1. Crear una Google Sheet nueva.
2. Instalar el Apps Script y ejecutar `setupClausura2026()`.
3. Crear las implementaciones pública y privada de caja.
4. Copiar la URL pública en `campeonato-clausura-2026/assets/clausura-config.js`.
5. Confirmar los correos autorizados en `CASHIER_EMAILS`.
6. Elegir el proveedor de pago online y configurar su checkout/webhook.

## Punto que debe confirmarse en las bases

El artículo 7 dice literalmente `mínimo de ocho (09) y máximo de doce (12) jugadores`. Esta implementación usa **9 jugadores como mínimo** de forma provisional, porque el número entre paréntesis es 09 y el usuario recordó un mínimo de nueve. Antes de publicar las bases del Clausura conviene corregir formalmente esa redacción.

Los mínimos para presentarse al partido sí quedan diferenciados:

- Sub 6 y Sub 8: 7 en campo, mínimo 5.
- Sub 10 y Sub 12: 9 en campo, mínimo 7.

Además, se mantuvo la exigencia de autorización del padre o apoderado porque aparece expresamente en el artículo 8.
