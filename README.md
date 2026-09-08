# Planificador de viajes

Aplicación web para descubrir lugares, crear viajes, organizar actividades y guardar favoritos.

## Stack

- **Frontend:** React, Vite, React Router, Bootstrap, Font Awesome y Leaflet.
- **Backend:** Flask, Flask-JWT-Extended, Flask-SQLAlchemy, Flask-Migrate y Flask-Mail.
- **Base de datos:** PostgreSQL.
- **Integraciones:** Overpass/OpenStreetMap para lugares y Nominatim/OpenStreetMap para direcciones.

## Requisitos

- Node.js 20 o superior.
- npm.
- Python 3.13.
- Pipenv.
- PostgreSQL en ejecución.

## Configuración local

1. Instala las dependencias:

```bash
npm install
pipenv install
```

2. Crea el archivo local de variables:

```bash
cp .env.example .env
```

3. Configura en `.env` los valores de tu entorno. Como mínimo, la aplicación necesita una base PostgreSQL y una URL del backend para el frontend:

```env
DATABASE_URL=postgresql:///planificador_viajes_dev
VITE_BACKEND_URL=http://127.0.0.1:3001
FRONTEND_URL=http://localhost:3000
```

Para PostgreSQL con usuario y contraseña:

```env
DATABASE_URL=postgresql://TU_USUARIO:TU_CONTRASENA@localhost:5432/planificador_viajes_dev
```

La configuración de correo requiere además los valores SMTP correspondientes. No subas `.env`, contraseñas, tokens, claves JWT ni cadenas de conexión al repositorio.

4. Crea la base local si todavía no existe:

```bash
createdb planificador_viajes_dev
```

## Migraciones

Aplicar las migraciones existentes:

```bash
pipenv run upgrade
```

Consultar el estado:

```bash
pipenv run flask db current
pipenv run flask db heads
```

Cuando cambie un modelo, crea una migración y revísala antes de aplicarla:

```bash
pipenv run migrate
pipenv run upgrade
```

## Ejecutar la aplicación

Inicia el backend en una terminal:

```bash
pipenv run start
```

El backend queda disponible en `http://127.0.0.1:3001`.

Inicia el frontend en otra terminal:

```bash
npm run dev -- --host localhost --port 3000
```

El frontend queda disponible en `http://localhost:3000`.

## Funcionalidades principales

- Registro y login con usuario o correo.
- Verificación de correo y reenvío de verificación.
- Recuperación de contraseña mediante correo y enlace con token.
- Perfil protegido y edición persistente de datos.
- Exploración de ciudades y lugares en mapa.
- Búsqueda, filtros y reverse geocoding de direcciones.
- Creación y organización de viajes y actividades.
- Favoritos.
- Panel administrativo protegido por JWT y rol de administrador.

## Destinos iniciales

El catálogo inicial incluye:

- Valparaíso, Chile.
- San José, Costa Rica.
- Río de Janeiro, Brasil.
- Buenos Aires, Argentina.
- Lima, Perú.

## Comprobaciones

Frontend:

```bash
npm run lint
npm run build
```

Backend:

```bash
pipenv run python -m py_compile src/app.py src/api/routes.py src/api/models.py
```

También conviene comprobar el endpoint de salud:

```bash
curl http://127.0.0.1:3001/api/health
```

## Estructura principal

```text
src/
├── api/                  # Aplicación Flask, modelos, comandos y servicios externos
├── front/
│   ├── components/       # Componentes reutilizables
│   ├── data/             # Catálogo inicial y metadatos de lugares
│   ├── pages/            # Pantallas y rutas de la aplicación
│   ├── utils/            # Sesión y normalización de errores
│   └── routes.jsx        # Configuración de rutas React
├── app.py                # Configuración y arranque Flask
└── wsgi.py               # Entrada para servidores WSGI
migrations/               # Historial de cambios de base de datos
index.html                # Entrada de Vite
package.json              # Scripts y dependencias frontend
Pipfile                  # Dependencias y comandos backend
render.yaml              # Configuración de despliegue
```

## Seguridad y despliegue

El despliegue todavía no forma parte de esta fase. Antes de desplegar hay que revisar variables de entorno, CORS, secretos, migraciones, correo SMTP, build frontend, servicio WSGI y configuración de la plataforma.

Nunca uses credenciales compartidas durante pruebas ni las guardes en archivos versionados, capturas, logs o documentación.
