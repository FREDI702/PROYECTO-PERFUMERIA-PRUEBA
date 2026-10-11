# PerfumeStore

Aplicación de gestión de perfumería con frontend React/Vite y API REST Java/Spring Boot. El backend usa PostgreSQL.

## Requisitos

- Node.js compatible con Vite 8
- Java 21
- Acceso a una base de datos PostgreSQL con las tablas y esquemas usados por las entidades del backend

## Ejecutar en Windows

### Backend

Abre PowerShell en `backend`, configura las variables para tu base de datos y arranca Spring Boot:

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/tu_base"
$env:DB_USER = "tu_usuario"
$env:DB_PASSWORD = "tu_clave"
$env:FRONTEND_URL = "http://localhost:5173"
.\mvnw.cmd spring-boot:run
```

No guardes credenciales en el repositorio. Clientes, marcas, perfumes y ventas usan `public`; detalles, pedidos y recepciones usan `a_perfumeria`. La base configurada debe tener las tablas en esos esquemas. Reinicia el backend tras cambiar las entidades para que Hibernate use el mapeo actualizado.

Las pruebas del backend usan una base H2 temporal y no necesitan credenciales PostgreSQL:

```powershell
.\mvnw.cmd test
```

### Frontend

Abre otra terminal en `frontend`. Si aún no tienes `.env.local`, copia la configuración de ejemplo y ejecuta Vite:

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

La configuración local apunta a `http://localhost:8080/api`, para usar el backend que ejecutas en la sección anterior. `.env.local` prevalece sobre `.env`; reinicia Vite si cambias esa dirección. `VITE_API_URL` debe apuntar a la raíz `/api` del backend. Para compilar y revisar el código:

```powershell
npm run lint
npm run build
```

## Módulos

El panel permite gestionar clientes, marcas, perfumes, ventas, detalles de venta, pedidos/envíos y recepciones de carga. Los controladores del backend exponen las rutas `/api/clientes`, `/api/marcas`, `/api/perfumes`, `/api/ventas`, `/api/detalle-ventas`, `/api/pedidos` y `/api/recepciones`.

## Despliegue y acceso

La pantalla de bienvenida solo permite entrar al panel; no hay cuentas, inicio de sesión ni protección de autenticación implementados. No publiques el API como servicio administrativo abierto a Internet hasta configurar autenticación y autorización.

La URL de producción configurada actualmente no ofrece el mismo estado que el código local: durante la revisión, `/api/perfumes` respondió `404` y `/api/marcas` respondió `500`, mientras otras rutas sí respondieron. Después de desplegar el backend actualizado, verifica la conexión y los esquemas PostgreSQL configurados antes de dar por corregida esa instalación.
