# Perfumería Néctar

Tienda de perfumes y panel de gestión con frontend React/Vite y API REST Java/Spring Boot. El backend usa PostgreSQL.

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

La tienda solicita el correo del cliente y envía allí el número de orden y el DNI/RUC usado para consultar el seguimiento. También envía un aviso de nueva compra a `MAIL_NOTIFICATION_TO`; si no se define, usa `MAIL_USERNAME`. Para habilitar los envíos, configura `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` y `MAIL_FROM` en el entorno del backend. Por ejemplo, Gmail requiere una contraseña de aplicación; usa secretos del sistema de despliegue y nunca guardes la contraseña en el repositorio. Sin SMTP configurado, el pedido se registra igualmente y el cliente recibe un aviso para guardar sus datos de seguimiento.

### Pago con tarjeta mediante Mercado Pago

La opción Tarjeta redirige al Checkout Pro alojado por Mercado Pago; la tienda no solicita ni almacena el número, vencimiento o CVV. Configura estas variables como secretos del backend (por ejemplo, en Railway):

- `MP_ACCESS_TOKEN`: Access Token de prueba para sandbox o credencial de producción para cobros reales. Nunca uses el token de producción en una demostración.
- `MP_WEBHOOK_SECRET`: clave secreta de firma de webhook proporcionada al configurar la notificación en Mercado Pago.
- `MP_WEBHOOK_URL`: URL pública HTTPS del endpoint, por ejemplo `https://tu-api.example.com/api/tienda/mercadopago/webhook`; registra la misma URL en Mercado Pago.

El servidor verifica la firma y consulta el pago directamente con Mercado Pago antes de marcar la venta como completada. Si las credenciales o el webhook no están configurados, el pago con tarjeta no se inicia. Para probarlo localmente, usa credenciales de prueba y una URL HTTPS pública de webhook; no se debe considerar que un retorno al sitio por sí solo confirme el pago.

### Imágenes de perfumes

El administrador puede adjuntar una imagen desde el formulario de perfumes (JPG, PNG o WebP, hasta 5 MB). El archivo se sube directamente a Cloudinary con una firma temporal generada por el backend; la clave secreta nunca se entrega al navegador y el archivo ni su URL se guardan en PostgreSQL. La imagen usa el identificador del perfume como `public_id`, por lo que se muestra en la tienda y se puede reemplazar desde el mismo formulario.

Crea una cuenta de Cloudinary y configura `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` como secretos/variables del backend en Railway. Tras desplegar el backend, la carga de imágenes quedará habilitada; si no se han configurado, el formulario muestra un error explícito. No guardes estas credenciales en el repositorio ni las compartas en el chat.

### Importar perfumes de Chanel y Maison Niche

El script `scripts/importar-perfumes-fuentes.ps1` agrega perfumes de Bleu de Chanel, algunas fragancias femeninas Chanel, Parfums de Marly y una fragancia representativa para cada marca que estaba vacía en el catálogo. Omite los que ya existen con la misma marca, nombre, concentración y tamaño, y asigna 10 unidades de stock. Primero puedes revisar lo que se agregaría con `-WhatIf`; para importar, usa la URL base del backend (terminada en `/api`) y una cuenta administradora:

```powershell
.\scripts\importar-perfumes-fuentes.ps1 -ApiUrl "https://tu-api.example.com/api" -WhatIf
.\scripts\importar-perfumes-fuentes.ps1 -ApiUrl "https://tu-api.example.com/api"
```

El script pide las credenciales de administrador de forma interactiva y no las guarda. Omite perfumes cuyo tamaño no está confirmado. Si la API rechaza un producto, muestra el estado y el detalle devuelto por el servidor y se detiene; puedes volver a ejecutarlo, pues los productos que ya existan se omiten. Los precios se basan en precios publicados por Chanel, Maison Niche y resultados de productos de Falabella Perú al preparar la lista; pueden ser promocionales y cambiar, así que confírmalos antes de vender. Referencias: [Chanel Bleu de Chanel](https://www.chanel.com/pe/perfumes/masculinos/c/7x1x2x34/bleu-de-chanel/), [Chanel perfumes femeninos](https://www.chanel.com/pe/perfumes/femeninas/c/7x1x1/) y [Falabella Perú](https://www.falabella.com.pe/falabella-pe/search?Ntt=perfumes).

### Guion breve para la exposición

1. Presenta el catálogo y muestra cómo filtrar perfumes por género y marca.
2. Agrega un perfume al carrito y recorre el formulario de entrega y pago.
3. Explica que el cliente puede consultar su pedido con el número de orden y su DNI/RUC.
4. Para Yape, verifica el pago en la aplicación oficial; después, como administrador, abre Ventas y selecciona "Confirmar pago Yape". Solo entonces se contará en las estadísticas.
5. Muestra las estadísticas por día, semana o año y cómo se gestionan perfumes y pedidos desde el panel.

Para una compra en vivo, confirma antes que la API, el correo SMTP y las credenciales de Mercado Pago estén disponibles. Yape requiere validación manual; tarjeta usa Mercado Pago cuando el backend está configurado. El comprobante por email es informativo; no es una boleta electrónica emitida por SUNAT. No muestres contraseñas, datos de tarjetas ni datos personales reales durante la presentación.

El panel tiene una pantalla de acceso con opción para crear cuenta con usuario, correo y contraseña confirmada. Las cuentas registradas pueden iniciar sesión con su nombre de usuario o correo. El servidor asigna siempre el rol `USUARIO` a cuentas registradas: pueden consultar, pero no crear, editar ni eliminar datos. Los correos y nombres de usuario registrados deben ser únicos. Solo `ADMIN_USERNAME`, configurado en el servidor, puede administrar registros. La contraseña del administrador y la cuenta inicial de consulta son obligatorias y deben tener al menos 12 caracteres. No guardes credenciales en el repositorio. Para publicar el API, exige HTTPS y configura estas variables como secretos del servicio.

Al arrancar, el backend crea `public.app_users` si todavía no existe; las claves de las cuentas nuevas se guardan cifradas con BCrypt. El usuario de la base necesita permiso para crear esa tabla dentro de `public`. Clientes, marcas, perfumes y ventas usan `public`; detalles, pedidos y recepciones usan `a_perfumeria`. La base configurada debe tener las tablas en esos esquemas. Reinicia el backend tras cambiar las entidades para que Hibernate use el mapeo actualizado.

### Probar una compra local con Yape

El perfil `local-demo` usa una base H2 en memoria aislada; no se conecta a PostgreSQL ni modifica el catálogo publicado. Incluye el perfume de prueba **Dior Fahrenheit** a **S/ 1.00** con 10 unidades. Desde PowerShell en `backend`, configura las mismas variables seguras `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `USER_USERNAME` y `USER_PASSWORD` descritas arriba, y ejecuta:

```powershell
$env:SPRING_PROFILES_ACTIVE = "local-demo"
.\mvnw.cmd spring-boot:run
```

El inicializador se niega a insertar el perfume si la conexión no es H2. Los datos de esta base en memoria se pierden al detener el backend. Inicia el frontend apuntando a `http://localhost:8080/api`; después entra con una cuenta de usuario, agrega Fahrenheit al carrito y selecciona Yape. El QR se muestra en el pago, pero la aplicación no verifica transferencias. Para probar Tarjeta, configura credenciales de sandbox de Mercado Pago, un webhook HTTPS accesible y las tres variables `MP_*` descritas arriba. No uses credenciales de producción para la exposición.

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

Las rutas de datos `/api/**` requieren autenticación. El administrador puede gestionar el panel; las cuentas de usuario solo pueden consultar perfumes y marcas y usar las rutas de pedidos de la tienda. El cierre de sesión limpia las credenciales de la pestaña actual; vuelve a iniciar sesión para entrar de nuevo. El registro público crea solo cuentas de usuario, nunca administradores.

La URL de producción configurada actualmente no ofrece el mismo estado que el código local: durante la revisión, `/api/perfumes` respondió `404` y `/api/marcas` respondió `500`, mientras otras rutas sí respondieron. Después de desplegar el backend actualizado, verifica la conexión y los esquemas PostgreSQL configurados antes de dar por corregida esa instalación.
