# Actualización puntual de talleres deportivos — v17

Esta actualización parte de la versión 16 que ya estaba funcionando. No modifica el flujo de alquiler de campos, horarios, cuotas mensuales ni confirmación de pagos.

## Cambios visibles

- En la inscripción, el distintivo ahora dice **Formulario de inscripción** y usa texto verde oscuro.
- El menor y el apoderado registran **tipo y número de documento**:
  - DNI
  - Pasaporte
  - Carné de extranjería
  - PTP / CPP
  - Otro documento
- La matrícula se genera como `PE + número de documento del menor`, sin espacios ni guiones. Ejemplos: `PE41097621` o `PEAB12345`.
- La edad mantiene la validación de 6 a 17 años.
- El domicilio ahora incluye departamento, provincia y distrito dependientes.
- Para el departamento Lima aparecen todas sus provincias. Para las provincias de Lima y Callao incluidas en el formulario se muestran sus distritos; en otras provincias se permite escribir el distrito.
- Se muestra la alerta: **Se verificará la residencia al momento de realizar el pago en caja.**
- La declaración jurada muestra el tipo y número de documento del apoderado.
- La orden generada en la web y por correo incluye instrucciones para pagar en caja, prioriza el código de pago y enlaza a la consulta de matrícula.
- La consulta se realiza con:
  - código de matrícula del menor;
  - primer apellido del menor.
- Un mismo apoderado puede inscribir a varios hijos sin mezclar sus consultas. Un mismo menor inscrito en más de un taller verá sus talleres bajo el mismo código de matrícula.

## Archivos web para GitHub

Reemplazar o agregar respetando las rutas:

```text
talleres.html
taller-inscripcion.html
taller-consulta.html
taller-estado.html
assets/css/talleres.css
assets/js/taller-inscripcion.js
assets/js/taller-consulta.js
assets/js/workshops-common.js
```

Las URL pública y privada de Apps Script permanecen configuradas; no deben cambiarse.

## Archivos de Google Apps Script

Dentro del proyecto actual de Apps Script:

1. Reemplazar completamente `Code.gs`.
2. Reemplazar completamente `Cashier.html`.
3. Reemplazar completamente `Workshops.gs`.
4. Guardar los cambios.
5. Ejecutar una vez `setupRentalSystem()` y autorizar si se solicita.
6. Actualizar la implementación pública existente seleccionando una nueva versión.
7. Actualizar la implementación privada existente seleccionando la misma versión.

No crear un nuevo proyecto ni nuevas URL.

`setupRentalSystem()` agrega las nuevas columnas de tipo y número de documento sin borrar las matrículas existentes. Las matrículas antiguas se conservan y se migran como documento tipo DNI.

## Orden recomendado

1. Actualizar Apps Script.
2. Ejecutar `setupRentalSystem()`.
3. Actualizar las implementaciones pública y privada existentes.
4. Subir los archivos web a GitHub.
5. Realizar una recarga forzada:
   - macOS: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`

## Prueba rápida

1. Registrar un menor usando DNI o un documento alternativo.
2. Verificar que la matrícula tenga formato `PE + número de documento`.
3. Revisar las instrucciones de la orden web y del correo.
4. Consultar usando el código de matrícula y el apellido paterno del menor.
5. Generar una orden para una cuota posterior.
6. Buscar la orden desde el panel privado de caja.
