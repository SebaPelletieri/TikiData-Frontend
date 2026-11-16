const cache = new Map<string, string[]>();

/** Nombres de los 12 meses en el idioma indicado, con mayúscula inicial ("Enero", "January", "Janeiro"). */
export function localizedMonths(locale: string): string[] {
  let months = cache.get(locale);
  if (!months) {
    const format = new Intl.DateTimeFormat(locale, { month: 'long' });
    months = Array.from({ length: 12 }, (_, i) => {
      const name = format.format(new Date(2026, i, 1));
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
    cache.set(locale, months);
  }
  return months;
}
