import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { AppLang, LanguageService } from './language-service';

/**
 * Pipes para textos que vienen de la base en español (no son textos fijos de la página).
 */

/**
 * Traduce un valor de la base si existe una traducción para él; si no, lo muestra
 * tal cual. Sirve para listas cerradas como las estadísticas ("Posesión") o las
 * posiciones, donde un valor nuevo no debería verse como una clave rota.
 *
 * Uso: {{ stat.label | tr: 'stats' }}  → busca "stats.Posesión"
 */
@Pipe({ name: 'tr', pure: false })
export class TranslateOrOriginalPipe implements PipeTransform {
  private transloco = inject(TranslocoService);
  private language = inject(LanguageService);

  transform(value: string | null | undefined, section: string): string {
    const original = (value ?? '').toString();
    if (!original) return original;
    this.language.current(); // se recalcula al cambiar de idioma
    const key = `${section}.${original}`;
    const translated = this.transloco.translate(key);
    return translated && translated !== key ? translated : original;
  }
}

// Formatos que usa la carga de partidos para los eventos
const INCIDENCE_RULES: { re: RegExp; out: Record<AppLang, string> }[] = [
  { re: /^Gol en contra de (.+)$/, out: { es: 'Gol en contra de $1', en: 'Own goal by $1', pt: 'Gol contra de $1' } },
  { re: /^Gol de (.+)$/, out: { es: 'Gol de $1', en: 'Goal by $1', pt: 'Gol de $1' } },
  {
    re: /^Tarjeta Amarilla (?:en|a|para) (.+)$/,
    out: { es: 'Tarjeta amarilla para $1', en: 'Yellow card for $1', pt: 'Cartão amarelo para $1' },
  },
  {
    re: /^Tarjeta Roja (?:en|a|para) (.+)$/,
    out: { es: 'Tarjeta roja para $1', en: 'Red card for $1', pt: 'Cartão vermelho para $1' },
  },
  {
    re: /^Cambio en (.+?): Entra (.+?), sale (.+)$/,
    out: {
      es: 'Cambio en $1: entra $2, sale $3',
      en: 'Substitution for $1: $2 on, $3 off',
      pt: 'Substituição no $1: entra $2, sai $3',
    },
  },
];

export function translateIncidence(text: string | null | undefined, lang: AppLang): string {
  const original = (text ?? '').toString();
  if (!original || lang === 'es') return original;
  for (const rule of INCIDENCE_RULES) {
    if (rule.re.test(original)) return original.replace(rule.re, rule.out[lang]);
  }
  return original;
}

/** Uso: {{ inc.text | incidence }} → "Goal by G. Cano (1-0)" */
@Pipe({ name: 'incidence', pure: false })
export class IncidencePipe implements PipeTransform {
  private language = inject(LanguageService);

  transform(text: string | null | undefined): string {
    return translateIncidence(text, this.language.current());
  }
}

/**
 * Fecha formateada en el idioma elegido (el DatePipe de Angular usa un único idioma
 * fijo para toda la app). Formatos: 'short' (16/11/2026), 'long' (16 de noviembre
 * de 2026), 'datetime' (16/11/2026 21:30), 'time' (21:30).
 *
 * Uso: {{ match.date | ldate: 'datetime' }}
 */
@Pipe({ name: 'ldate', pure: false })
export class LocalizedDatePipe implements PipeTransform {
  private language = inject(LanguageService);

  transform(value: string | number | Date | null | undefined, format: 'short' | 'long' | 'datetime' | 'time' = 'short'): string {
    if (value === null || value === undefined || value === '') return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return String(value);
    const locale = this.language.locale();
    const options: Record<string, Intl.DateTimeFormatOptions> = {
      short: { day: '2-digit', month: '2-digit', year: 'numeric' },
      long: { day: 'numeric', month: 'long', year: 'numeric' },
      datetime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false },
      time: { hour: '2-digit', minute: '2-digit', hour12: false },
    };
    return date.toLocaleString(locale, options[format]);
  }
}

// Palabras de fechas/zonas que aparecen en nombres de la base ("Copa Libertadores - Grupo B - Fecha 6")
const ROUND_WORDS: Record<AppLang, [RegExp, string][]> = {
  es: [],
  en: [
    [/\bFecha\b/g, 'Matchday'],
    [/\bGrupo\b/g, 'Group'],
    [/\bZona\b/g, 'Zone'],
  ],
  pt: [
    [/\bFecha\b/g, 'Rodada'],
    [/\bZona\b/g, 'Zona'],
  ],
};

/** Uso: {{ group.roundTitle | round }} → "Matchday 6" */
@Pipe({ name: 'round', pure: false })
export class RoundPipe implements PipeTransform {
  private language = inject(LanguageService);

  transform(text: string | null | undefined): string {
    let out = (text ?? '').toString();
    for (const [re, word] of ROUND_WORDS[this.language.current()]) out = out.replace(re, word);
    return out;
  }
}
