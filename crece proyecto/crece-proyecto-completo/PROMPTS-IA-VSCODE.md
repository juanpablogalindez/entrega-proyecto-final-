# Cómo pedirle a la IA de Visual Studio Code que trabaje en Crece+

Sirve para GitHub Copilot Chat, Claude Code o Cursor. La regla básica: la IA no adivina bien,
pero obedece muy bien cuando le da **contexto + objetivo + restricciones + formato de salida**.

## Regla de oro: los 5 ingredientes de un buen prompt

1. **Contexto** — qué proyecto es y qué stack usa.
2. **Archivos de referencia** — arrastre los archivos al chat o use `@workspace` / `#file`.
3. **Objetivo concreto** — un solo entregable por prompt.
4. **Restricciones** — convenciones, idioma, nada de librerías nuevas.
5. **Formato esperado** — qué archivos debe crear y dónde.

---

## Prompt 0 — Contexto inicial (péguelo una vez al abrir el chat)

```
Estoy desarrollando "Crece+ V1.0", una app móvil para el curso de Ingeniería de Software II
de la Fundación Escuela Tecnológica de Neiva.

Stack:
- Frontend: Ionic 8 + Angular 18 (componentes standalone, signals, reactive forms)
- Backend: Node.js + Express + MySQL 8 (mysql2/promise), autenticación JWT
- Base de datos: el archivo crece_db.sql en la raíz del repo

Convenciones del proyecto:
- Todo el código, nombres de variables y comentarios en español
- Servicios Angular con inject() en lugar de constructor
- Un servicio por módulo, en src/app/core/services
- Interfaces TypeScript en src/app/core/models/index.ts
- No agregar librerías nuevas sin avisarme

Antes de responder, revisa @workspace para respetar la estructura que ya existe.
Confírmame que entendiste y espera mi siguiente instrucción.
```

---

## Prompts por módulo

### Buscador por cercanía (mapa embebido)

```
En #file:inicio.page.html quiero agregar una vista de mapa además de la lista.
Usa Leaflet (npm i leaflet @types/leaflet) y muestra un marcador por cada negocio
de la señal negocios(), centrado en la posición del usuario.
Agrega un ion-segment arriba para alternar entre "Lista" y "Mapa".
Muéstrame solo los archivos modificados completos, no fragmentos sueltos.
```

### Subida de imágenes

```
Necesito reemplazar los campos "URL de la imagen" por subida real de archivos.
En el backend: crea src/middlewares/upload.middleware.js con Multer, guarda en /uploads,
y agrega POST /api/upload que devuelva { url }.
En el frontend: en #file:catalogo.page.ts usa @capacitor/camera para tomar o elegir foto,
súbela a ese endpoint y guarda la URL devuelta en imagen_url.
Respeta el manejo de errores con ToastController que ya uso en ese archivo.
```

### PDF de la factura

```
En #file:facturas.controller.js agrega el endpoint GET /api/facturas/:id/pdf que genere
un PDF de la factura usando pdfkit, con el encabezado del negocio, los datos del cliente,
la tabla de factura_detalle y los totales.
Valida con el mismo helper esPropietarioNegocio que ya existe en ese archivo.
Luego agrega el botón "Descargar PDF" en el historial de #file:facturacion.page.html.
```

### Pruebas (para el rol de Tester del Acta 003)

```
Genera pruebas unitarias con Jasmine/Karma para #file:auth.service.ts y #file:negocios.service.ts,
usando HttpClientTestingModule. Cubre: login exitoso, login fallido, guardado del token en
localStorage, y construcción de los query params del buscador cuando se usa cercanía.
Nombra los describe/it en español.
```

### Panel de administrador

```
Crea una nueva página standalone src/app/pages/admin/admin.page.ts protegida por un nuevo
guard adminGuard (rol 'admin'), que liste los negocios en estado 'pendiente' y permita
aprobarlos o rechazarlos llamando a PUT /api/negocios/:id con { estado }.
Sigue exactamente el estilo de #file:catalogo.page.ts (signals, ion-list, AlertController).
Agrega la ruta en #file:app.routes.ts.
```

---

## Prompts de calidad (úselos antes de entregar)

```
Revisa @workspace/backend/src y dime qué endpoints no validan la propiedad del recurso
antes de modificarlo. No cambies código todavía, solo lístamelos con archivo y línea.
```

```
Refactoriza #file:negocios.controller.js para extraer la construcción del SQL del buscador
a una función aparte. No cambies el comportamiento ni la firma de los endpoints.
```

```
Genera el archivo de colección de Postman (JSON) con todos los endpoints de @workspace/backend/src/routes,
incluyendo ejemplos de body y una variable {{token}} en el header Authorization.
```

---

## Errores comunes al pedirle cosas a la IA

| Prompt débil | Prompt fuerte |
|---|---|
| "Hazme la app Crece+" | "Crea la página de catálogo con CRUD de productos, siguiendo el estilo de #file:mi-negocio.page.ts" |
| "Arregla el error" | "Al llamar POST /api/facturas me devuelve 500. Aquí está el log: [...]. Revisa #file:facturas.controller.js" |
| "Agrega un mapa" | "Agrega un mapa Leaflet en #file:inicio.page.html con un marcador por negocio de la señal negocios()" |

Pida **un módulo por conversación**. Cuando el chat se llena de contexto viejo, la IA empieza
a inventar archivos que no existen — abra un chat nuevo y vuelva a pegar el Prompt 0.
