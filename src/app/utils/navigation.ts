import { Location } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Vuelve a la página anterior, como el botón "atrás" del navegador, así se recupera
 * la posición del scroll y la pantalla donde estaba el usuario.
 * Si se entró directo a la URL (no hay página anterior dentro de la app), va a `fallback`.
 */
export function goBackOr(location: Location, router: Router, fallback: string = '/admin'): void {
  const navigationId = (location.getState() as { navigationId?: number } | null)?.navigationId;
  if (navigationId && navigationId > 1) {
    location.back();
  } else {
    router.navigate([fallback]);
  }
}
