# 🌸 Perfumería de Néctar

**Integrantes:** Videz, Fredi

---

## 🎯 Descripción del problema

Comprar perfumes suele ser incómodo: el catálogo está disperso, no hay un lugar único donde ver
lo que existe y el negocio lleva sus registros a mano. **Perfumería de Néctar** facilita el uso y
la compra de perfumes con una plataforma moderna donde se puede encontrar lo que se busca, y
centraliza la información del negocio (clientes, marcas, perfumes, ventas, pedidos de envío y
recepción de carga) en una base de datos real.

## 🛠️ Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite |
| Backend | Spring Boot 4.1 (Java 21), Spring Data JPA |
| Base de datos | PostgreSQL alojada en **Neon** |
| Despliegue backend | **Railway** |
| Despliegue frontend | **Vercel** |

## 🔗 Enlaces públicos

- **Frontend (Vercel):** https://proyecto-perfumeria-prueba.vercel.app
- **Backend (Railway):** https://proyecto-perfumeria-prueba-production.up.railway.app
  - Ejemplo de endpoint: https://proyecto-perfumeria-prueba-production.up.railway.app/api/clientes
- **Repositorio:** https://github.com/FREDI702/PROYECTO-PERFUMERIA-PRUEBA

## ✨ Funcionalidades implementadas

**Clientes (CRUD completo desde la interfaz):**

- Listar los clientes guardados en la base de datos.
- Crear un cliente nuevo.
- Editar un cliente (el cambio persiste al recargar).
- Eliminar un cliente.

**API REST del backend:**

| Recurso | Ruta | Operaciones |
|---|---|---|
| Clientes | `/api/clientes` | GET, GET por id, POST, PUT, DELETE |
| Marcas | `/api/marcas` | GET, GET por id, POST, PUT, DELETE |
| Perfumes | `/api/perfumes` | GET, GET por id, POST, PUT, DELETE |
| Detalle de ventas | `/api/detalle-ventas` | GET, GET por id, POST, PUT, DELETE |
| Pedidos de envío | `/api/pedidos` | GET, GET por id, POST, PUT, DELETE |
| Recepción de carga | `/api/recepciones` | GET, GET por id, POST, PUT, DELETE |
| Ventas | `/api/ventas` | GET, PUT |

## 📁 Estructura del proyecto

```
PROYECTO-PERFUMERIA-PRUEBA/
├── backend/    API REST con Spring Boot
└── Interfaz/   Aplicación web con React + Vite
```

## 🚀 Cómo ejecutarlo localmente

### Requisitos

- Java 21
- Node.js 20 o superior (incluye npm)
- Una base de datos PostgreSQL (la del proyecto está en Neon)
- Git

> **Credenciales de la base de datos:** por seguridad no se publican en este repositorio.
> Se entregan por separado al docente. Con ellas se completan las variables de entorno del paso 2.

### 1. Clonar el repositorio

```bash
git clone https://github.com/FREDI702/PROYECTO-PERFUMERIA-PRUEBA.git
cd PROYECTO-PERFUMERIA-PRUEBA
```

### 2. Backend

El backend lee la conexión a la base de datos desde **variables de entorno** (no hay credenciales en el código):

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DB_URL` | URL JDBC de PostgreSQL | `jdbc:postgresql://HOST/BASE?sslmode=require` |
| `DB_USER` | Usuario de la base de datos | `mi_usuario` |
| `DB_PASSWORD` | Contraseña | `mi_clave` |
| `FRONTEND_URL` | *(opcional)* Origen permitido por CORS | `http://localhost:5173` (por defecto) |
| `PORT` | *(opcional)* Puerto del servidor | `8080` (por defecto) |

> `DB_URL` debe empezar con `jdbc:postgresql://`. No es la misma URL que muestra Neon (`postgresql://usuario:clave@host/...`).

Ejecutar desde la carpeta `backend`:

**Windows (PowerShell):**

```powershell
cd backend
$env:DB_URL="jdbc:postgresql://HOST/BASE?sslmode=require"
$env:DB_USER="mi_usuario"
$env:DB_PASSWORD="mi_clave"
.\mvnw.cmd spring-boot:run
```

**Linux / macOS:**

```bash
cd backend
export DB_URL="jdbc:postgresql://HOST/BASE?sslmode=require"
export DB_USER="mi_usuario"
export DB_PASSWORD="mi_clave"
./mvnw spring-boot:run
```

**Con IntelliJ IDEA:**

- Abrir la carpeta `backend`.
- Ir a *Run → Edit Configurations* de `PerfumeriaApplication`.
- Agregar en *Environment variables*: `DB_URL=...;DB_USER=...;DB_PASSWORD=...`
- Pulsar **Run**.

Cuando arranque, la consola muestra `CONEXION EXITOSA`. Para comprobarlo, abrir http://localhost:8080/api/clientes: debe devolver un JSON con los clientes.

### 3. Frontend

En otra terminal:

```bash
cd Interfaz
npm install
```

Crear el archivo `Interfaz/.env` con la URL del backend:

```
VITE_API_URL=http://localhost:8080/api
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Abrir http://localhost:5173. Debe mostrarse la lista de clientes.

> Vite lee el archivo `.env` solo al arrancar: si se cambia, hay que reiniciar `npm run dev`.

## ☁️ Despliegue

- **Base de datos:** proyecto en Neon (PostgreSQL).
- **Backend en Railway:** variables `DB_URL`, `DB_USER`, `DB_PASSWORD` y `FRONTEND_URL` (la URL pública de Vercel, **sin** barra final). Railway define `PORT` por su cuenta.
- **Frontend en Vercel:** *Root Directory* `Interfaz`, *Framework Preset* Vite y la variable `VITE_API_URL` apuntando a `https://proyecto-perfumeria-prueba-production.up.railway.app/api`.
- Después de cambiar una variable en Vercel hay que volver a desplegar, porque Vite la incorpora al compilar.
- Cada `git push` a la rama `main` redespliega backend y frontend automáticamente.

## 🧪 Matriz de pruebas

| Caso | Acción | Resultado esperado | Estado |
|---|---|---|---|
| TC01 | Listar | Muestra registros reales | ☐ |
| TC02 | Crear | Guarda y aparece en pantalla | ☐ |
| TC03 | Editar | Persiste después de recargar | ☐ |
| TC04 | Eliminar | Desaparece de la BD y la UI | ☐ |
| TC05 | URL pública | Funciona fuera de localhost | ☐ |

*(Marcar con ✅ cada caso cuando se verifique, y agregar las capturas como evidencia.)*
