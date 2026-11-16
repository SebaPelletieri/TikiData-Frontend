import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { User } from '../models/User';
import { AuthService } from '../services/auth-service';

/**
 * Solo deja pasar a administradores. Quien no lo es (o no inició sesión) vuelve al inicio.
 *
 * El rol guardado en el navegador se puede editar a mano desde las herramientas del
 * navegador, así que no alcanza con mirarlo: se vuelve a pedir el usuario al servidor
 * y se decide con el rol que figura ahí. Si el rol cambió (le quitaron el permiso),
 * también se actualiza la sesión local.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);

  const home = router.createUrlTree(['/']);
  const currentUser = authService.currentUser();

  if (!currentUser?.id || currentUser.role !== 'Administrador') {
    return home;
  }

  return http.get<User>(`http://localhost:3000/usuarios/${currentUser.id}`).pipe(
    map((serverUser) => {
      if (serverUser?.role === 'Administrador') return true;
      if (serverUser) authService.syncCurrentUser(serverUser);
      return home;
    }),
    catchError(() => of(home)),
  );
};
