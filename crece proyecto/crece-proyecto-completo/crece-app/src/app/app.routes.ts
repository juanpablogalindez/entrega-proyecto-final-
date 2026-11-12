import { Routes } from '@angular/router';
import { adminGuard, authGuard, negocioGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'tabs/inicio', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.page').then((m) => m.RegistroPage)
  },
  {
    path: 'factura/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/factura-detalle/factura-detalle.page').then((m) => m.FacturaDetallePage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./pages/inicio/inicio.page').then((m) => m.InicioPage)
      },
      {
        path: 'mapa',
        loadComponent: () => import('./pages/mapa/mapa.page').then((m) => m.MapaPage)
      },
      {
        path: 'favoritos',
        loadComponent: () => import('./pages/favoritos/favoritos.page').then((m) => m.FavoritosPage)
      },
      {
        path: 'capacitacion',
        loadComponent: () =>
          import('./pages/capacitacion/capacitacion.page').then((m) => m.CapacitacionPage)
      },
      {
        path: 'mi-negocio',
        canActivate: [authGuard, negocioGuard],
        loadComponent: () =>
          import('./pages/mi-negocio/mi-negocio.page').then((m) => m.MiNegocioPage)
      },
      {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        loadComponent: () =>
          import('./pages/admin/admin.page').then((m) => m.AdminPage)
      },
      {
        path: 'perfil',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/perfil/perfil.page').then((m) => m.PerfilPage)
      },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },
  {
    path: 'negocio/:id',
    loadComponent: () =>
      import('./pages/negocio-detalle/negocio-detalle.page').then((m) => m.NegocioDetallePage)
  },
  {
    path: 'catalogo/:negocioId',
    canActivate: [authGuard, negocioGuard],
    loadComponent: () => import('./pages/catalogo/catalogo.page').then((m) => m.CatalogoPage)
  },
  {
    path: 'facturacion/:negocioId',
    canActivate: [authGuard, negocioGuard],
    loadComponent: () =>
      import('./pages/facturacion/facturacion.page').then((m) => m.FacturacionPage)
  },
  { path: '**', redirectTo: 'tabs/inicio' }
];
