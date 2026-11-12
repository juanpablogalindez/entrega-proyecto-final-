import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado()) return true;
  router.navigateByUrl('/login');
  return false;
};

/** Solo permite el paso a usuarios con rol 'negocio' o 'admin' */
export const negocioGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const rol = auth.usuario()?.rol;

  if (rol === 'negocio' || rol === 'admin') return true;
  router.navigateByUrl('/tabs/inicio');
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.usuario()?.rol === 'admin') return true;
  router.navigateByUrl('/tabs/inicio');
  return false;
};
