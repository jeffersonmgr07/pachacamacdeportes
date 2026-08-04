# Reservas, caja y talleres deportivos v13

## Tarifas implementadas (TUSNE 2025, página 6)

El TUSNE distingue tarifas por hora según tipo de espacio, día y horario:

- Losa deportiva: S/ 20 de lunes a viernes (día y noche), S/ 20 sábados/domingos/feriados de día y S/ 25 de noche.
- Grass sintético, público general: S/ 30 lunes-viernes de día; S/ 40 fin de semana/feriado de día; S/ 40 lunes-viernes de noche; S/ 50 fin de semana/feriado de noche.
- Estadio municipal, público general: S/ 120 lunes-viernes de día; S/ 150 fin de semana de día; S/ 160 de noche.

El TUSNE no define a qué hora comienza la tarifa nocturna. En `Code.gs` se configuró operativamente a las 18:00 mediante `NIGHT_START_HOUR: 18`.

La hoja `Feriados` permite registrar fechas feriadas con columnas `date`, `description` y `active`.

## Espacios habilitados

- Coliseo Deportivo Municipal de Pachacámac — tarifa LOSA.
- Campo Deportivo Matamoros — tarifa GRASS.
- Estadio Municipal Sector B Manchay — tarifa ESTADIO.
- Estadio Municipal de Pachacámac — tarifa ESTADIO.

## Seguridad de caja

`AUTHORIZED_CASHIERS` permite buscar reservas y confirmar pagos.

`EVENT_ADMIN_EMAILS` permite además registrar y retirar eventos institucionales. Por defecto, solo `pachacamacdeportes@gmail.com` administra eventos.

La confirmación manual mediante casillas de Google Sheets fue desactivada. Los pagos deben validarse desde la implementación privada del panel Cashier.

## Instalación

1. Reemplaza `Code.gs` y `Cashier.html` en Apps Script.
2. Ejecuta `setupRentalSystem()` una vez.
3. Actualiza la implementación pública (ejecutar como propietario, acceso público).
4. Actualiza o crea la implementación privada (ejecutar como usuario que accede, acceso con cuenta Google).
5. Abre caja con `URL_PRIVADA/exec?view=cashier`.

Para agregar cajeros:

```javascript
AUTHORIZED_CASHIERS: [
  'pachacamacdeportes@gmail.com',
  'caja1.pachacamadeportes@gmail.com',
  'caja2.pachacamadeportes@gmail.com'
]
```

Solo el administrador debe figurar en:

```javascript
EVENT_ADMIN_EMAILS: ['pachacamacdeportes@gmail.com']
```


## Módulo de talleres 2026

El proyecto ahora también utiliza `Workshops.gs` y las hojas `Talleres_Catalogo`, `Talleres_Matriculas`, `Talleres_Cuotas` y `Talleres_Ordenes`.

La caja autorizada puede confirmar pagos de campos y talleres. Solo las cuentas de `WORKSHOP_ADMIN_EMAILS` pueden abrir el tablero de matrículas, consultar datos completos, dar de baja o reactivar alumnos.

Para actualizar esta versión:

1. Reemplaza `Code.gs` y `Cashier.html`.
2. Agrega `Workshops.gs` al mismo proyecto.
3. Ejecuta `setupRentalSystem()` una vez.
4. Actualiza las implementaciones pública y privada.
5. Revisa la guía completa `README-TALLERES-2026.md` incluida en el repositorio.
