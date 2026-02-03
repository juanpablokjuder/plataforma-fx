# Plataforma FX — Prototipo

Descripción breve
------------------

Este repositorio contiene un prototipo de una pequeña plataforma web para visualización y gestión de instrumentos (interfaz estática + API).

Funcionamiento (resumen)
------------------------

- La carpeta `src/public` contiene la interfaz web (HTML, CSS, JS).
- La carpeta `src/api` contiene endpoints PHP para autenticación y acceso a datos.
- Hay imágenes Docker en `docker/` para montar la aplicación (nginx, PHP, websockets, etc.).
- La carpeta `src/api` contiene endpoints PHP para autenticación y acceso a datos.
- Hay imágenes Docker en `docker/` para montar la aplicación (nginx, PHP) y un servicio de WebSocket.
  - El servicio de WebSocket se encuentra en `docker/ws` y está implementado con `Python`.

Tecnologías
------------

- Frontend: HTML, CSS, JavaScript
- Backend: PHP (endpoints simples en `src/api`)
- Contenerización: Docker y Docker Compose
- Base de datos: scripts SQL en `sql/init.sql` (inicializador)
- Frontend: HTML, CSS, JavaScript
- Backend: PHP (endpoints simples en `src/api`)
 - Websockets: Python (servicio en `docker/ws`) — comunicación en tiempo real vía WebSocket
- Contenerización: Docker y Docker Compose
- Base de datos: scripts SQL en `sql/init.sql` (inicializador)

Estructura principal
--------------------

- `src/public` — archivos públicos (index, dashboard, assets)
- `src/api` — endpoints PHP y configuración de base de datos
- `docker/` — archivos de Docker y `docker-compose.yml`
- `sql/` — scripts de inicialización de la base de datos

Requisitos
----------

- Docker y Docker Compose instalados en el sistema.

Despliegue (rápido)
--------------------

1. Abrir una terminal y situarse en la carpeta `docker` del proyecto:

```powershell
cd docker
```

2. Levantar los servicios con Docker Compose:

```powershell
docker compose up -d
```

3. Verificar los contenedores en ejecución:

```powershell
docker compose ps
```

4. Abrir la aplicación en un navegador: `http://localhost/` (puerto por defecto 80). Si su entorno usa otro puerto, consulte `docker/docker-compose.yml`.
