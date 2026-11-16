import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { findIdBySlug, matchBaseName } from '../utils/slug';

/**
 * Las rutas de edición reciben el nombre (/championship/edit/premier-league) y estos
 * resolvers lo traducen al id real antes de abrir la página. Si el nombre no existe
 * (URL vieja o mal escrita) se vuelve al panel de administración en vez de mostrar
 * una página vacía. Corren después del adminGuard, así que solo los admins llegan acá.
 */

const API = 'http://localhost:3000';
type Named = { id?: number | string; name?: string };

function resolveByName(collection: string): ResolveFn<string> {
  return (route) => {
    const http = inject(HttpClient);
    const router = inject(Router);
    const slug = route.paramMap.get('slug') ?? '';
    const back = new RedirectCommand(router.parseUrl('/admin'));

    return http.get<Named[]>(`${API}/${collection}`).pipe(
      map((items) => findIdBySlug(items, (i) => i.name ?? '', slug) ?? back),
      catchError(() => of(back)),
    );
  };
}

export const teamEditIdResolver = resolveByName('equipos');
export const playerEditIdResolver = resolveByName('jugadores');
export const championshipEditIdResolver = resolveByName('campeonatos');

/** Los partidos no tienen nombre: se arma con los equipos y la fecha. */
export const matchEditIdResolver: ResolveFn<string> = (route) => {
  const http = inject(HttpClient);
  const router = inject(Router);
  const slug = route.paramMap.get('slug') ?? '';
  const back = new RedirectCommand(router.parseUrl('/admin'));

  return forkJoin({
    matches: http.get<any[]>(`${API}/partidos`),
    teams: http.get<Named[]>(`${API}/equipos`),
  }).pipe(
    map(({ matches, teams }) => {
      const names = new Map(teams.map((t) => [String(t.id), t.name ?? '']));
      const teamName = (id: unknown) => names.get(String(id)) || `equipo-${id}`;
      return findIdBySlug(matches, (m) => matchBaseName(m, teamName), slug) ?? back;
    }),
    catchError(() => of(back)),
  );
};
