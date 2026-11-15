import { Router } from '@angular/router';

/**
 * Manda al login recordando la página actual, para volver a ella después
 * de iniciar sesión (por ejemplo, al tocar "Seguir" sin estar logueado).
 */
export function goToLogin(router: Router): void {
  router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
}

/**
 * Devuelve la URL a la que volver después del login, solo si es una ruta
 * interna de la app (empieza con "/" pero no con "//"). Así nadie puede
 * armar un link de login que redirija a otro sitio.
 */
export function safeReturnUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) {
    return '/';
  }
  return value;
}
