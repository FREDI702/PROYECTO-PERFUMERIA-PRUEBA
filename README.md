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
$env:ADMIN_USERNAME = Read-Host "Usuario administrador"
$adminSecure = Read-Host "Clave administrador (12 caracteres o mas)" -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $adminSecure).Password
$env:USER_USERNAME = Read-Host "Usuario de solo consulta"
$userSecure = Read-Host "Clave de solo consulta (12 caracteres o mas)" -AsSecureString
$env:USER_PASSWORD = [System.Net.NetworkCredential]::new("", $userSecure).Password
.\mvnw.cmd spring-boot:run
```

El panel tiene una pantalla de acceso con opción para crear cuenta con usuario, correo y contraseña confirmada. Las cuentas registradas pueden iniciar sesión con su nombre de usuario o correo. El servidor asigna siempre el rol `USUARIO` a cuentas registradas: pueden consultar, pero no crear, editar ni eliminar datos. Los correos y nombres de usuario registrados deben ser únicos. Solo `ADMIN_USERNAME`, configurado en el servidor, puede administrar registros. La contraseña del administrador y la cuenta inicial de consulta son obligatorias y deben tener al menos 12 caracteres. No guardes credenciales en el repositorio. Para publicar el API, exige HTTPS y configura estas variables como secretos del servicio.

Al arrancar, el backend crea `public.app_users` si todavía no existe; las claves de las cuentas nuevas se guardan cifradas con BCrypt. El usuario de la base necesita permiso para crear esa tabla dentro de `public`. Clientes, marcas, perfumes y ventas usan `public`; detalles, pedidos y recepciones usan `a_perfumeria`. La base configurada debe tener las tablas en esos esquemas. Reinicia el backend tras cambiar las entidades para que Hibernate use el mapeo actualizado.

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

Las rutas de datos `/api/**` requieren autenticación. El backend permite lecturas a ambos roles y restringe las operaciones de escritura al rol administrador. El cierre de sesión limpia las credenciales de la pestaña actual; vuelve a iniciar sesión para entrar de nuevo. El registro público crea solo cuentas de consulta, nunca cuentas de administrador.

La URL de producción configurada actualmente no ofrece el mismo estado que el código local: durante la revisión, `/api/perfumes` respondió `404` y `/api/marcas` respondió `500`, mientras otras rutas sí respondieron. Después de desplegar el backend actualizado, verifica la conexión y los esquemas PostgreSQL configurados antes de dar por corregida esa instalación.
