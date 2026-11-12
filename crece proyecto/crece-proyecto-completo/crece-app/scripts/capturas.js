import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = 'http://127.0.0.1:4200';
const outputDir = path.resolve('..', 'docs', 'capturas');
const credentials = {
  cliente: ['cliente.demo@crece.test', 'Crece123!'],
  negocio: ['emprendedor1.demo@crece.test', 'Crece123!'],
  admin: ['admin.demo@crece.test', 'Crece123!']
};
const captured = [];
const failed = [];

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  permissions: ['geolocation'],
  geolocation: { latitude: 2.9273, longitude: -75.2819 }
});
const page = await context.newPage();

async function settle() {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(900);
}

async function capture(number, name, options = {}) {
  const file = `${String(number).padStart(2, '0')}-${name}.png`;
  try {
    await settle();
    const bodyText = await page.locator('body').innerText();
    if (bodyText.trim().length < 20) {
      throw new Error('La pantalla no contiene texto suficiente');
    }
    await page.screenshot({
      path: path.join(outputDir, file),
      fullPage: options.fullPage ?? true
    });
    const stat = await fs.stat(path.join(outputDir, file));
    if (stat.size < 1000) {
      throw new Error('La captura parece vacía');
    }
    captured.push(file);
    console.log(`OK ${file}`);
  } catch (error) {
    failed.push({ file, reason: error.message });
    console.error(`FAIL ${file}: ${error.message}`);
  }
}

async function login(role) {
  await page.goto(`${baseURL}/login`);
  await settle();
  await page.locator('input[type="email"]').fill(credentials[role][0]);
  await page.locator('input[type="password"]').fill(credentials[role][1]);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForURL(/\/tabs\/inicio/);
  await settle();
}

async function clearSession() {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

// Public screens.
await page.goto(`${baseURL}/login`);
await capture(1, 'login');
await page.goto(`${baseURL}/registro`);
await capture(2, 'registro');

// Client screens.
await login('cliente');
await capture(3, 'inicio', { fullPage: false });
await page.locator('ion-searchbar input').fill('Sabor');
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'Filtros' }).click();
await capture(4, 'buscador-filtros', { fullPage: false });
await page.goto(`${baseURL}/tabs/mapa`);
await capture(5, 'mapa');

await page.goto(`${baseURL}/tabs/inicio`);
await settle();
const businessHref = await page.locator('a.business-card-link').first().getAttribute('href');
if (!businessHref) {
  failed.push({ file: '06-detalle-negocio.png', reason: 'No se encontró un negocio demo en Inicio' });
} else {
  await page.goto(`${baseURL}${businessHref}`);
  await capture(6, 'detalle-negocio');
  await page.getByRole('button', { name: /Agregar .* al carrito/ }).first().click();
  await page.getByRole('button', { name: 'Ver carrito' }).click();
  await capture(7, 'carrito', { fullPage: false });
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  await capture(8, 'pedido-enviado', { fullPage: false });
  await page.goto(`${baseURL}/tabs/favoritos`);
  await capture(9, 'favoritos');
  await page.goto(`${baseURL}/tabs/capacitacion`);
  await capture(10, 'mis-cursos');
  await page.goto(`${baseURL}/tabs/perfil`);
  await capture(11, 'perfil');
  await page.getByRole('button', { name: 'Notificaciones' }).click();
  await capture(12, 'notificaciones', { fullPage: false });
  failed.push({
    file: '13-mis-pedidos.png',
    reason: 'La versión actual no tiene una pantalla separada “Mis pedidos”; los pedidos del cliente se muestran mediante notificaciones y el flujo de compra.'
  });
  await page.getByRole('button', { name: 'Cerrar notificaciones' }).click().catch(() => {});
  await page.goto(`${baseURL}${businessHref}`);
  await page.locator('ion-segment-button').filter({ hasText: 'Reseñas' }).click();
  await capture(14, 'resena');
}

// Entrepreneur screens.
await clearSession();
await login('negocio');
await page.goto(`${baseURL}/tabs/mi-negocio`);
await capture(15, 'perfil-negocio');
await page.getByRole('button', { name: 'Catálogo' }).click();
await page.waitForURL(/\/catalogo\//);
const catalogUrl = page.url();
await capture(16, 'lista-productos');
await page.locator('ion-fab-button').last().click();
await capture(17, 'formulario-producto', { fullPage: false });
await page.getByRole('button', { name: 'Cerrar' }).click();
await page.goto(`${baseURL}/tabs/mi-negocio`);
await capture(18, 'pedidos-recibidos');
const statusButton = page.getByRole('button', { name: /Preparando|Confirmado|Listo|Entregado/ }).first();
if (await statusButton.count()) {
  await statusButton.click();
  await capture(19, 'actualizacion-estado', { fullPage: false });
} else {
  failed.push({ file: '19-actualizacion-estado.png', reason: 'No se encontró un pedido activo con botón de estado' });
}
await page.getByRole('button', { name: 'Facturación e historial' }).click();
await page.waitForURL(/\/facturacion\//);
await capture(20, 'factura');

// Administrator screens.
await clearSession();
await login('admin');
await page.goto(`${baseURL}/tabs/admin`);
const demoPendingCard = page.locator('ion-card').filter({ hasText: 'Tecno Huila' }).first();
await demoPendingCard.scrollIntoViewIfNeeded();
await capture(21, 'administrador-pendientes', { fullPage: false });
const reviewButton = demoPendingCard.getByRole('button', { name: 'Revisar negocio' });
if (await reviewButton.count()) {
  await reviewButton.click();
  await capture(22, 'revision-negocio', { fullPage: false });
} else {
  failed.push({ file: '22-revision-negocio.png', reason: 'No se encontró negocio pendiente' });
}

console.log(`Capturas correctas: ${captured.length}`);
console.log(`Capturas pendientes: ${JSON.stringify(failed)}`);
await browser.close();
