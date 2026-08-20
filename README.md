# Ajuste visual — No disponible v2

Solo cambia la presentación del calendario público.

## Cambios
- Se elimina del encabezado del día el texto "Fecha no disponible" y el botón "Avisarme".
- El encabezado se tiñe suavemente solo cuando realmente existe algún tramo no disponible.
- Si todo el día ya está ocupado por reservas/eventos reales, el encabezado queda normal.
- Bloques no disponibles de 1–2 horas:
  - muestran solo "No disponible";
  - muestran un único botón/badge "Avisarme";
  - ocultan motivo y horario para evitar texto amontonado.
- Bloques de 3 horas usan una versión compacta.
- Bloques largos mantienen "Posibles usos de la Municipalidad", horario y CTA completo.

## Archivos de GitHub
Reemplaza únicamente:
- campos-deportivos.html
- assets/js/campos-deportivos.js
- assets/css/campos-deportivos.css

No hay cambios en Apps Script y no necesitas nueva implementación pública/privada.
