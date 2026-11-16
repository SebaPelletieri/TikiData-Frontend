/**
 * Slugs para las URLs de edición: "/team/edit/boca-juniors" en lugar del id.
 *
 * El slug sale del nombre. Si dos elementos generan el mismo (dos equipos "Nacional"),
 * a partir del segundo se le agrega el id al final para que la URL siga apuntando a uno solo.
 */

type WithId = { id?: number | string };

/** "Atlético Mineiro" → "atletico-mineiro" (sin tildes, minúsculas, guiones). */
export function slugify(text: string | null | undefined): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Mapa id → slug único para toda la lista. */
export function buildSlugMap<T extends WithId>(
  items: T[],
  baseName: (item: T) => string,
): Map<string, string> {
  const result = new Map<string, string>();
  const used = new Set<string>();
  for (const item of items) {
    const id = String(item.id);
    let slug = slugify(baseName(item)) || id;
    if (used.has(slug)) slug = `${slug}-${slugify(id)}`;
    used.add(slug);
    result.set(id, slug);
  }
  return result;
}

/** Busca el id que corresponde a un slug (con las mismas reglas que buildSlugMap). */
export function findIdBySlug<T extends WithId>(
  items: T[],
  baseName: (item: T) => string,
  slug: string,
): string | null {
  const target = slugify(slug);
  for (const [id, s] of buildSlugMap(items, baseName)) {
    if (s === target) return id;
  }
  return null;
}

/** Nombre base de un partido: "boca-juniors-vs-river-plate-2026-05-10". */
export function matchBaseName(
  match: { localTeamID?: unknown; awayTeamID?: unknown; date?: unknown },
  teamName: (id: unknown) => string,
): string {
  const date = String(match.date ?? '').slice(0, 10);
  return `${teamName(match.localTeamID)} vs ${teamName(match.awayTeamID)} ${date}`;
}
