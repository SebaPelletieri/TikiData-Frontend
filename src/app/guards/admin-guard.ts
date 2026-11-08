import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();

  // Verifica que exista un usuario y que su rol sea Administrador
  if (currentUser && currentUser.role === 'Administrador') {
    return true;
  }

  // Si no tiene permisos o no está logueado, redirige al login
  router.navigate(['/login']);
  return false;
};
