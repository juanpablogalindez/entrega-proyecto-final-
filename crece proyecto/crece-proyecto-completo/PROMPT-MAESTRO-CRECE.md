# PROMPT MAESTRO — Proyecto Crece+ V1.0

## Cómo usarlo

1. Crea una carpeta vacía `crece-plus`, ábrela en VS Code (`File → Open Folder`).
2. Copia dentro el archivo `crece_db.sql`.
3. Abre Copilot Chat (`Ctrl + Alt + I`) y cambia el modo de **Ask** a **Agent**.
   (Si usas Claude Code o Cursor, ya trabajan en modo agente por defecto.)
4. Pega TODO el bloque de abajo de una sola vez y envía.
5. Cuando termine cada fase, responde `continúa con la fase N` hasta llegar a la 7.

---

## ⬇️ COPIA DESDE AQUÍ ⬇️

Actúa como desarrollador full-stack senior. Vas a construir un proyecto completo,
creando los archivos reales en disco dentro de este workspace.

# PROYECTO

"Crece+ V1.0" — aplicación móvil para el curso de Ingeniería de Software II de la
Fundación Escuela Tecnológica de Neiva (FET). Está enmarcada en el ODS 8 y busca dar
visibilidad a emprendedores informales y negocios familiares de Neiva y el Huila,
conectándolos con clientes de la zona y ayudándolos a formalizarse.

# STACK OBLIGATORIO

- Backend: Node.js + Express 4 + MySQL 8 con mysql2/promise, módulos ES (type: module)
- Autenticación: JWT (jsonwebtoken) + bcryptjs
- Frontend: Ionic 8 + Angular 18, componentes standalone, signals y reactive forms
- Base de datos: el archivo #file:crece_db.sql de este repositorio (NO lo modifiques,
  el esquema ya está aprobado por el docente)

# CONVENCIONES INNEGOCIABLES

- Todo en español: variables, funciones, comentarios y textos de la interfaz
- Servicios Angular con inject(), nunca con constructor
- Las interfaces TypeScript deben ser espejo exacto de las tablas del SQL
- No instales ninguna librería que no esté listada en este prompt
- Cada archivo que generes debe estar completo, sin "..." ni fragmentos omitidos

# MÓDULOS A CONSTRUIR (definidos en el Acta de Reunión No. 002)

1. Registro y perfil del negocio
2. Catálogo de productos y servicios
3. Buscador de negocios por cercanía geográfica
4. Módulo básico de facturación electrónica
5. Módulo de capacitación con contenido corto para formalización
6. Sistema de calificaciones y reseñas de clientes

# REGLAS DE NEGOCIO

- Tres roles: `cliente`, `negocio`, `admin` (ver ENUM en la tabla usuarios)
- Solo un usuario con rol `negocio` o `admin` puede crear negocios, productos y facturas
- Antes de modificar o eliminar cualquier recurso, verifica que pertenezca al usuario
  autenticado (o que sea admin). Esto aplica a negocios, productos, facturas y reseñas
- El buscador por cercanía DEBE usar la función `distancia_km` que ya existe en el SQL,
  no reimplementes Haversine en JavaScript
- La creación de una factura debe ser transaccional: el encabezado en `facturas` y las
  líneas en `factura_detalle` se guardan juntos o no se guarda nada
- El número de factura es un consecutivo por negocio con formato FAC-000001
- Un usuario solo puede dejar una reseña por negocio (ya hay una restricción única en la BD)
- El progreso de capacitación se guarda con INSERT ... ON DUPLICATE KEY UPDATE

# PLAN DE TRABAJO

Ejecuta las fases EN ORDEN. Al terminar cada una, muéstrame el árbol de archivos
creados y DETENTE a esperar mi confirmación antes de seguir. No adelantes fases.

## FASE 1 — Esqueleto del backend
Carpeta /backend con:
- package.json (express, mysql2, jsonwebtoken, bcryptjs, cors, morgan,
  express-validator, dotenv, nodemon como devDependency; scripts dev y start)
- .env.example con PORT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME,
  JWT_SECRET, JWT_EXPIRES
- src/config/db.js — pool de conexiones con decimalNumbers en true
- src/middlewares/auth.middleware.js — verificarToken y permitirRoles(...roles)
- src/middlewares/validar.middleware.js — usando validationResult
- src/middlewares/error.middleware.js — noEncontrado y manejadorErrores
- src/app.js y src/server.js (server.js prueba la conexión antes de escuchar)

## FASE 2 — Autenticación y categorías
- src/controllers/auth.controller.js: registrar, login, perfil, actualizarPerfil
  (hash con bcrypt, token con id/email/rol, rechazar cuentas no activas)
- src/routes/auth.routes.js con validaciones de express-validator
- src/controllers/categorias.controller.js y su ruta (solo lectura)

## FASE 3 — Negocios y catálogo
- Módulo negocios: GET / con filtros q, categoria_id, lat, lng, radio, paginación;
  GET /mis-negocios; GET /:id; POST; PUT; DELETE.
  El listado debe traer calificacion_promedio y total_resenas haciendo JOIN con la
  vista `vw_negocios_calificacion` que ya existe en el SQL.
- Módulo productos: listar por negocio_id con filtros tipo y q, más CRUD protegido

## FASE 4 — Facturación, capacitación, reseñas y favoritos
- Módulo facturas: listar por negocio, obtener con su detalle, crear (transaccional,
  calculando subtotal/impuestos/total en el servidor), PATCH /:id/estado
- Módulo capacitaciones: listar publicadas, obtener, GET /mi-progreso con LEFT JOIN
  contra capacitacion_progreso, POST /:id/progreso
- Módulo resenas: listar por negocio, crear, actualizar, PATCH /:id/responder
  (solo el dueño del negocio), eliminar
- Módulo favoritos: listar, agregar, eliminar

## FASE 5 — Núcleo del frontend
Carpeta /frontend con la estructura de un proyecto Ionic Angular standalone:
- src/environments/environment.ts con apiUrl http://localhost:3000/api
- src/app/core/models/index.ts — interfaces Usuario, Categoria, Negocio,
  ProductoServicio, Factura, ItemFactura, Capacitacion, Resena
- src/app/core/services/ — auth.service.ts (con signals para el usuario y
  computed estaAutenticado/esNegocio, token en localStorage), negocios.service.ts,
  productos.service.ts, facturas.service.ts, capacitaciones.service.ts,
  resenas.service.ts, geolocalizacion.service.ts (@capacitor/geolocation, con las
  coordenadas de Neiva 2.9273,-75.2819 como respaldo si no hay permiso de GPS)
- src/app/core/interceptors/auth.interceptor.ts — HttpInterceptorFn que inyecta el
  Bearer token y cierra sesión ante un 401
- src/app/core/guards/auth.guard.ts — authGuard y negocioGuard
- src/app/app.config.ts, app.routes.ts y app.component.ts

## FASE 6 — Páginas
Todas standalone, con .page.ts + .page.html separados:
- login, registro (con selector de tipo de cuenta cliente/emprendedor)
- tabs (Buscar, Aprender, Mi negocio solo si el rol es negocio, Perfil)
- inicio: searchbar, filtro por categoría, toggle "cerca de mí" con ion-range para
  el radio en km, lista de resultados con estrellas y distancia
- negocio-detalle: ficha del negocio, ion-segment entre catálogo y reseñas,
  formulario para calificar, botones de WhatsApp y de abrir en mapas
- mi-negocio: formulario del perfil del negocio con botón "usar GPS"
- catalogo: lista con ion-item-sliding para eliminar, FAB para agregar,
  ion-modal con el formulario del producto
- facturacion: segment Nueva/Historial, se agregan ítems tocando el catálogo,
  totales calculados con computed(), historial con badges de estado
- capacitacion: tarjetas con ion-progress-bar y botón de marcar completado
- perfil: datos del usuario y cierre de sesión con confirmación

Usa ToastController para todos los mensajes de éxito y error, y AlertController
para las confirmaciones de borrado.

## FASE 7 — Documentación
- README.md en la raíz: pasos para importar el SQL, levantar el backend, generar
  el proyecto Ionic y compilar para Android (incluyendo los permisos de ubicación
  en AndroidManifest.xml)
- Tabla de todos los endpoints con método, ruta y descripción
- Una colección de Postman en JSON con variable {{token}}

# EMPIEZA AHORA

Lee primero #file:crece_db.sql completo. Luego ejecuta únicamente la FASE 1 y
detente para que yo la revise.

## ⬆️ COPIA HASTA AQUÍ ⬆️

---

# Qué hacer cuando falle (y va a fallar)

| Síntoma | Qué le respondes |
|---|---|
| Genera fragmentos con "..." | `Muéstrame el archivo completo, sin omitir líneas.` |
| Se inventa columnas que no existen | `Revisa de nuevo #file:crece_db.sql. La tabla X no tiene esa columna. Corrige el archivo #file:x.controller.js.` |
| Se salta fases | `Detente. Solo pedí la fase 3. Elimina lo que creaste de más.` |
| El chat se vuelve lento o confuso | Abre un chat nuevo y pega solo el bloque de STACK + CONVENCIONES + la fase que sigue. |
| Usa constructor en vez de inject() | `Refactoriza a inject(), es la convención del proyecto.` |
| Error 500 al probar | `Al llamar POST /api/facturas obtengo este error: [pega el log]. Revisa #file:facturas.controller.js` |

# Verificación antes de entregar al docente

Pídele esto al final, en un chat nuevo:

```
Revisa @workspace/backend/src y respóndeme sin cambiar código todavía:
1. ¿Qué endpoints modifican un recurso sin verificar que pertenezca al usuario autenticado?
2. ¿Hay alguna consulta SQL construida por concatenación de strings en vez de parámetros?
3. ¿Qué rutas deberían exigir JWT y no lo están haciendo?
Lístamelo con archivo y número de línea.
```

Esas tres preguntas son justo lo que revisa un auditor de proyecto. Si el agente
encuentra hallazgos, corrígelos uno por uno.
