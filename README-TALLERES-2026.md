# Pacha Deportes — Inscripción y pagos de talleres 2026

## Funcionalidad incluida

- Catálogo público de vóley, fútbol y básquet.
- Inscripción digital para menores de **6 a 17 años**; la edad se calcula y valida en el navegador y en Apps Script.
- Ficha con datos del menor, domicilio, institución educativa y datos del padre, madre o apoderado.
- Departamentos del Perú y los **43 distritos de la provincia de Lima**, con Lima/Pachacámac seleccionados inicialmente.
- Declaración jurada digital con casilla obligatoria de aceptación.
- Cuota mensual automática: **S/ 25 para residentes de Pachacámac** y **S/ 30 para otros distritos**.
- Código de matrícula `TAL...`, orden de pago `PAG...` y QR para presentar en caja.
- Orden válida hasta el cierre del siguiente día hábil de caja. Los feriados registrados en la hoja `Feriados` no se cuentan como días hábiles.
- Generación de cuotas mensuales desde el día de inscripción hasta el **30 de noviembre de 2026**. El apoderado puede seleccionar una, varias o todas las cuotas pendientes.
- Portal del apoderado mediante DNI y apellido para ver cuotas pagadas y pendientes.
- Baja automática si no se registra el primer pago dentro de tres días hábiles.
- Panel de caja para buscar el código, seleccionar cuotas y confirmar el pago.
- Correo automático al registrar la inscripción, generar una orden, confirmar pagos o dar de baja por falta de pago.
- Panel administrativo con alumnos, apoderados, estados, cuotas pagadas, pendientes y vencidas; permite dar de baja o reactivar matrículas.

## Horarios precargados

| Taller | Horario | Lugar precargado |
|---|---|---|
| Vóley | Lunes, martes y viernes, 3:00 p. m. a 6:00 p. m. | Coliseo Deportivo Municipal de Pachacámac |
| Fútbol | Lunes, miércoles y viernes, 4:00 p. m. a 6:00 p. m. | Estadio Municipal de Pachacámac |
| Básquet | Miércoles, 4:00 p. m. a 6:00 p. m.; sábado, 10:00 a. m. a 12:00 p. m. | Coliseo Deportivo Municipal de Pachacámac |

### Datos pendientes de confirmación

Como aún no se indicaron las fechas exactas de inicio, los tres talleres se precargan con **1 de agosto de 2026**. También se asumió el Estadio Municipal para fútbol y se interpretó “Vázquez” como **básquet**. Después de ejecutar la instalación, estos datos se cambian directamente en la hoja `Talleres_Catalogo`; el sistema conserva las modificaciones manuales.

## Archivos para GitHub Pages

- `talleres.html`
- `assets/css/talleres.css`
- `assets/js/talleres.js`
- `assets/js/config.js`
- `index.html`
- `admin.html`
- `assets/js/admin.js`

## Archivos para Apps Script

- Reemplazar `apps-script-alquiler-campos/Code.gs`.
- Reemplazar `apps-script-alquiler-campos/Cashier.html`.
- Crear un archivo de secuencia de comandos llamado `Workshops.gs` y copiar `apps-script-alquiler-campos/Workshops.gs`.

## Instalación en Apps Script

1. Haz una copia de seguridad del proyecto actual de Apps Script.
2. Reemplaza `Code.gs` y `Cashier.html`; agrega `Workshops.gs`.
3. Revisa las listas de acceso en `Code.gs`:

```javascript
AUTHORIZED_CASHIERS: [
  'pachacamacdeportes@gmail.com',
  'caja1.pachacamadeportes@gmail.com'
],
WORKSHOP_ADMIN_EMAILS: ['pachacamacdeportes@gmail.com']
```

4. Ejecuta manualmente `setupRentalSystem()` y concede permisos. Se crearán estas hojas:
   - `Talleres_Catalogo`
   - `Talleres_Matriculas`
   - `Talleres_Cuotas`
   - `Talleres_Ordenes`
5. En `Talleres_Catalogo`, corrige las fechas exactas de inicio y cualquier ubicación pendiente. No cambies `workshopId` cuando ya existan matrículas.
6. Actualiza la **implementación pública**: ejecutar como propietario y acceso público. Puede conservarse la misma URL si se actualiza la implementación existente.
7. Crea o actualiza una **implementación privada distinta**: ejecutar como el usuario que accede y exigir inicio de sesión con Google. Esta es la que protege caja y administración.
8. En `assets/js/config.js`:

```javascript
WORKSHOPS_API_URL: 'URL_PUBLICA_DE_APPS_SCRIPT',
CASHIER_APP_URL: 'URL_PRIVADA_DE_APPS_SCRIPT'
```

`CASHIER_APP_URL` debe ser la URL terminada en `/exec`, sin `?view=cashier`; el enlace del panel agrega ese parámetro automáticamente.

9. Sube los archivos web a GitHub y espera la actualización de GitHub Pages.

## Prueba recomendada antes de publicar

1. Registrar un menor válido de 6 a 17 años.
2. Comprobar código, QR y correo de inscripción.
3. Abrir la implementación privada con una cuenta de caja autorizada.
4. Buscar el código `PAG...`, registrar el primer pago y comprobar el correo.
5. Consultar el portal del apoderado con DNI y apellido.
6. Generar una orden con varias cuotas y verificar que caja pueda cobrarlas juntas.
7. Abrir “Administrar talleres” y verificar alumnos activos, pendientes y dados de baja.

## Regla de vencimiento

- La orden de pago vence al cierre del siguiente día hábil de caja: 5:00 p. m. de lunes a viernes o 12:00 p. m. el sábado.
- Una orden vencida no puede cobrarse usando ese código. El apoderado debe generar otra orden; caja también puede localizar la matrícula con el código `TAL...` para una gestión presencial.
- La matrícula pendiente se da de baja al cumplirse tres días hábiles sin primer pago. El disparador instalado por `setupRentalSystem()` revisa vencimientos cada cinco minutos.
