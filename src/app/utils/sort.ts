/**
 * Orden alfabético en español: ignora mayúsculas y tildes, así "España" queda
 * entre "Escocia" y "Estados Unidos" (con sort() común quedaba al final).
 */
export function compareEs(a: string | undefined | null, b: string | undefined | null): number {
  return (a || '').localeCompare(b || '', 'es', { sensitivity: 'base', numeric: true });
}

/** Ordena una lista por su propiedad `name`, sin modificar la original. */
export function sortByName<T extends { name?: string }>(items: T[]): T[] {
  return [...items].sort((x, y) => compareEs(x.name, y.name));
}
