# Crece+ V1.0 — Aplicación móvil (Ionic + Angular + Node + MySQL)

Proyecto del curso **Ingeniería de Software II** — Fundación Escuela Tecnológica de Neiva "Jesús Oviedo Pérez".
Plataforma orientada al ODS 8 que da visibilidad a emprendedores informales y negocios familiares de Neiva y el Huila.

## Documentación

- [Informe de errores, correcciones y evidencias](./INFORME-ERRORES-CORRECCIONES.md)
- [Manual de usuario](./MANUAL-USUARIO.md)

## Módulos implementados (Acta No. 002)

| # | Módulo | Backend | Frontend |
|---|--------|---------|----------|
| 1 | Registro y perfil del negocio | `auth`, `negocios` | `login`, `registro`, `mi-negocio` |
| 2 | Catálogo de productos y servicios | `productos` | `catalogo`, `negocio-detalle` |
| 3 | Buscador por cercanía geográfica | `negocios` (función `distancia_km`) | `inicio` |
| 4 | Facturación electrónica básica | `facturas` + `factura_detalle` | `facturacion` |
| 5 | Capacitación para formalización | `capacitaciones` + progreso | `capacitacion` |
| 6 | Calificaciones y reseñas | `resenas` | `negocio-detalle` |
| 7 | Carrito y pedidos sin pago en línea | `pedidos` + `pedido_detalle` | `negocio-detalle`, `mi-negocio` |

Extra: favoritos (negocios guardados).

---

## 1. Base de datos

```bash
mysql -u root -p < crece_db.sql
```

El script crea `crece_db` con 14 tablas, la vista `vw_negocios_calificacion`, la función
`distancia_km` (Haversine) y datos semilla de categorías y capacitaciones.

> Si MySQL rechaza la creación de la función, ejecute una vez:
> `SET GLOBAL log_bin_trust_function_creators = 1;`

Si ya tiene la base `crece_db` y no desea recrearla, aplique las migraciones en orden:

```bash
mysql -u root -p crece_db < backend/migrations/001_pedidos.sql
mysql -u root -p crece_db < backend/migrations/002_pedido_metodo_pago.sql
mysql -u root -p crece_db < backend/migrations/003_notificaciones_confirmacion_pedido.sql
mysql -u root -p crece_db < backend/migrations/004_verificacion_negocios.sql
mysql -u root -p crece_db < backend/migrations/005_verificacion_completa.sql
```

## 2. Backend (Node.js + Express + MySQL)

```bash
cd backend
npm install
cp .env.example .env     # edite DB_PASSWORD y JWT_SECRET
npm run dev
```

Queda en `http://localhost:3000/api`. Pruebe con `GET http://localhost:3000/api/health`.

### Crear el administrador inicial

Desde la carpeta `backend`, ejecuta `npm run crear-admin` en una terminal interactiva.
El comando solicita nombre y correo, y pide la contraseña sin mostrarla en pantalla.
Luego inicia sesión con ese correo desde la app; verás la pestaña **Administrar** para
revisar y verificar negocios. Al verificar uno, su dueño recibe una notificación en la
campana de la app.

### Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/registro` | Crear cuenta (rol `cliente` o `negocio`) |
| POST | `/api/auth/login` | Iniciar sesión, devuelve JWT |
| GET | `/api/negocios?q=&categoria_id=&lat=&lng=&radio=` | Buscador (texto, categoría y cercanía) |
| POST | `/api/negocios` | Registrar negocio (rol negocio) |
| GET | `/api/negocios/admin/pendientes-verificacion` | Listar negocios pendientes (solo admin) |
| PATCH | `/api/negocios/:id/verificar` | Verificar negocio y notificar a su dueño (solo admin) |
| GET | `/api/productos?negocio_id=1` | Catálogo de un negocio |
| POST | `/api/facturas` | Emitir factura con líneas (transaccional) |
| POST | `/api/pedidos` | Crear pedido de cliente desde el carrito (sin cobro en línea) |
| GET | `/api/pedidos?negocio_id=1` | Consultar pedidos recibidos por el negocio |
| PATCH | `/api/pedidos/:id/estado` | Actualizar el estado de un pedido |
| GET | `/api/capacitaciones/mi-progreso` | Contenidos con avance del usuario |
| POST | `/api/resenas` | Calificar un negocio (1 a 5) |

Para comprar, el cliente inicia sesión, agrega productos del catálogo al carrito, selecciona
efectivo, transferencia, tarjeta u otro medio, y envía el pedido. El negocio puede revisar el
medio de pago elegido desde **Mi negocio** y actualizar el estado. La app no procesa pagos
en línea; el pago se coordina directamente entre el cliente y el negocio.
Los nuevos pedidos también aparecen en la campana de notificaciones del dueño mientras tiene
la aplicación abierta. Cuando el dueño confirma un pedido, el cliente recibe una notificación
persistente en la campana la próxima vez que abra la aplicación.

Todas las rutas protegidas esperan el header `Authorization: Bearer <token>`.

## 3. Frontend (Ionic + Angular standalone)

Si aún no tiene el proyecto Ionic creado:

```bash
npm install -g @ionic/cli
ionic start crece-app blank --type=angular --capacitor
cd crece-app
npm install @capacitor/geolocation
```

Luego copie el contenido de la carpeta `frontend/src/` sobre el `src/` del proyecto generado
(reemplazando `app.routes.ts`, `app.config.ts` y `app.component.ts`) y ejecute:

```bash
ionic serve
```

### Compilar para Android

```bash
ionic build
npx cap add android
npx cap sync
npx cap open android
```

En `android/app/src/main/AndroidManifest.xml` agregue los permisos de ubicación:

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
```

> Para probar la app nativa en un celular físico conectado a la misma Wi-Fi, configure
> `apiUrl` en `crece-app/src/environments/environment.prod.ts` con la IP local actual de
> su PC (ahora `http://20.20.2.73:3000/api`). Luego genere y sincronice el build con
> `ionic build` y `npx cap sync ios` (o `npx cap sync android`). Si cambia de red, actualice
> esa IP. Para abrir la app desde Safari usando `ionic serve`, use la URL de red del servidor
> frontend; el proxy de desarrollo envía `/api` al backend.

## 4. Estructura

```
crece-plus/
├── backend/
│   └── src/
│       ├── config/db.js            Pool de conexiones MySQL
│       ├── middlewares/            JWT, roles, validación, errores
│       ├── controllers/            Lógica de cada módulo
│       ├── routes/                 Definición de endpoints
│       ├── app.js                  Configuración de Express
│       └── server.js               Arranque del servidor
└── frontend/src/
    ├── environments/
    └── app/
        ├── core/
        │   ├── models/             Interfaces TypeScript (espejo del SQL)
        │   ├── services/           HTTP + estado con signals
        │   ├── guards/             authGuard, negocioGuard
        │   └── interceptors/       Inyección del token JWT
        ├── pages/                  10 páginas standalone
        ├── app.routes.ts
        └── app.config.ts
```

## 5. Usuarios de prueba sugeridos

Después de levantar el backend, registre desde la app:

- **Cliente:** `cliente@crece.com` / `123456` → busca negocios y deja reseñas.
- **Emprendedor:** `negocio@crece.com` / `123456` → registra su negocio, publica catálogo y factura.

---

## 6. Pendientes sugeridos para la entrega del 20 de noviembre

- Subida real de imágenes (Multer + almacenamiento local o Cloudinary).
- Generación de PDF de la factura y envío por correo (Nodemailer).
- Mapa embebido con Leaflet o Google Maps en lugar de abrir la app externa.
- Pruebas unitarias (Jasmine/Karma en Angular, Jest o Supertest en el backend) para el plan del Tester.
- Documento de arquitectura y diagrama de despliegue para el Auditor de Proyecto.
