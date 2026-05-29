# Gestión Deportiva Municipal · Pachacamac

Proyecto HTML/CSS/JS para GitHub Pages con Google Apps Script como API/backend y Google Sheets como base editable.

## Estructura principal

- `index.html`: portal general de deportes.
- `campeonatos.html`: cards de campeonatos disponibles.
- `campeonato-futbol-menores-2026.html`: portada del Torneo Municipal de Fútbol de Menores 2026.
- `fixture.html`: programación y partidos.
- `resultados.html`: resultados.
- `tabla-posiciones.html`: tabla de posiciones.
- `equipos.html`: equipos participantes.
- `login.html`: página de login alternativa.
- `entrenador.html`: panel de entrenador.
- `admin.html`: panel administrador.

## Logo

El header usa:

```txt
assets/img/logo-pacha-deportes.svg
```

Si tienes tu logo real, reemplaza ese archivo o cambia la ruta en:

```txt
assets/components/header.js
assets/components/footer.js
```

## Login demo

- Admin: `admin` / `admin123`
- Entrenador: `guerreros` / `demo123`

El botón `Login` abre un modal. El formulario de registro sugiere clave temporal con esta regla:

```txt
DNI + inicial del primer nombre + 2026
```

Ejemplo: DNI `12345678`, nombre `Carlos` → `12345678C2026`.

## Modo demo y Apps Script

Por defecto trabaja en modo demo desde `assets/js/config.js`:

```js
DEMO_MODE: true
API_URL: ""
```

Cuando publiques Apps Script como API, cambia a:

```js
DEMO_MODE: false
API_URL: "https://script.google.com/macros/s/TU_ID/exec"
```

## Panel entrenador

Incluye:

- Perfil de equipo en modo lectura.
- Botón editar para habilitar campos.
- Insignia del equipo.
- Categorías habilitadas.
- Registro de jugadores con máximo 15.
- Categorías elegibles por fecha de nacimiento.
- Próximos partidos.
- Convocatorias en modal.
- Estado visual `Convocado` luego de guardar.
