import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

/**
 * Rutas que necesitan sesión iniciada (perfil, editar perfil). Sin sesión se vuelve al inicio.
 *
 * Se mira el usuario de la sesión y no solo el token: un token suelto sin usuario
 * (sesión a medio borrar) abría el perfil vacío.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && localStorage.getItem('tiki_token')) {
    return true;
  }

  return router.createUrlTree(['/']);
};
