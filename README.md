# Pacha Deportes — Ajuste de index móvil + suscripción a novedades

Archivos preparados a partir del `index.html` y `Code.gs` actuales proporcionados.

## GitHub

Sube o reemplaza únicamente:

- `index.html`
- `suscribete.html`

No necesitas modificar `styles.css`, porque los nuevos estilos del index están contenidos dentro del propio `index.html`.

## Apps Script general

Reemplaza el contenido del `Code.gs` actual por:

- `apps-script-alquiler-campos/Code.gs`

No reemplaces `Workshops.gs`, `Cashier.html` ni otros archivos.

Después:

1. Guarda el proyecto.
2. Ejecuta una vez `setupNewsletterSubscriptions()`.
3. Comprueba que en la Google Sheet general aparezca la pestaña `Suscriptores_Novedades`.
4. Actualiza la implementación PÚBLICA existente a una nueva versión.
5. Conserva la misma URL `/exec`.

La nueva ruta pública es:

`subscribeNewsletter`

La página `suscribete.html` reutiliza `APP_CONFIG.RENTALS_API_URL` del `assets/js/config.js` actual. También incluye como respaldo la URL pública que ya utiliza campos y talleres.

## Datos almacenados

La hoja `Suscriptores_Novedades` contiene:

- subscriberId
- name
- email
- phone
- status
- source
- createdAt
- updatedAt

Si el mismo correo o WhatsApp vuelve a registrarse, el sistema actualiza el registro existente en lugar de crear un duplicado.

## Cambios del index

- Slider principal: un solo botón `Suscríbete para novedades`.
- Los cuatro recuadros informativos del slider principal pasan debajo de las cards.
- Slider de alquiler: se eliminan sus cuatro recuadros y la información se traslada a la nueva card de alquiler.
- Se agregan cuatro cards: Campeonatos, Talleres, Espacios deportivos y Eventos.
- La card Campeonatos incluye acceso destacado al Clausura de Menores 2026 y botón a `campeonatos.html`.
- La card Talleres enlaza a `talleres.html`.
- La card Espacios deportivos enlaza a `campos-deportivos.html`.
- La card Eventos enlaza al `fixture.html`, que ya es el destino utilizado por el index actual para la agenda deportiva.
- En móvil se reduce la altura de los sliders y el espacio superior/inferior.
- En móvil, el fondo del Clausura prioriza la zona izquierda de la imagen para conservar visible al niño.
