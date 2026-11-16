import { inject, Pipe, PipeTransform } from '@angular/core';
import { getCountryFlag } from '../utils/countries';
import { AppLang, LanguageService } from './language-service';

/**
 * Traduce un nombre de país guardado en español ("Alemania") al idioma elegido
 * ("Germany" / "Alemanha"). Usa el código ISO que ya conocemos por las banderas y la
 * API del navegador Intl.DisplayNames, así no hace falta una lista por idioma.
 * Si no reconoce el país, lo deja tal cual.
 *
 * Uso: {{ team.country | country }}
 */

// Naciones del Reino Unido: no son códigos ISO, Intl no las conoce
const UK_NATIONS: Record<string, Record<AppLang, string>> = {
  'gb-eng': { es: 'Inglaterra', en: 'England', pt: 'Inglaterra' },
  'gb-sct': { es: 'Escocia', en: 'Scotland', pt: 'Escócia' },
  'gb-wls': { es: 'Gales', en: 'Wales', pt: 'País de Gales' },
  'gb-nir': { es: 'Irlanda del Norte', en: 'Northern Ireland', pt: 'Irlanda do Norte' },
};

const REGIONS: Record<string, Record<AppLang, string>> = {
  internacional: { es: 'Internacional', en: 'International', pt: 'Internacional' },
};

const cache = new Map<string, string>();
const displayNames = new Map<AppLang, Intl.DisplayNames | null>();

function namesFor(lang: AppLang): Intl.DisplayNames | null {
  if (!displayNames.has(lang)) {
    try {
      displayNames.set(lang, new Intl.DisplayNames([lang], { type: 'region' }));
    } catch {
      displayNames.set(lang, null);
    }
  }
  return displayNames.get(lang) ?? null;
}

export function translateCountry(name: string | null | undefined, lang: AppLang): string {
  const original = (name ?? '').toString();
  // Los datos ya están en español: se muestran tal cual se cargaron
  if (!original || lang === 'es') return original;

  const key = `${lang}|${original}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  let result = original;
  const region = REGIONS[original.trim().toLowerCase()];
  if (region) {
    result = region[lang];
  } else {
    const code = /\/w\d+\/([a-z-]+)\.png$/.exec(getCountryFlag(original))?.[1];
    if (code && UK_NATIONS[code]) {
      result = UK_NATIONS[code][lang];
    } else if (code && code !== 'xx' && /^[a-z]{2}$/.test(code)) {
      result = namesFor(lang)?.of(code.toUpperCase()) || original;
    }
  }

  cache.set(key, result);
  return result;
}

@Pipe({ name: 'country', pure: false })
export class CountryPipe implements PipeTransform {
  private language = inject(LanguageService);

  transform(name: string | number | null | undefined): string {
    return translateCountry(name == null ? name : String(name), this.language.current());
  }
}

/**
 * Comparador para ordenar países por su nombre en el idioma elegido
 * (en inglés "Germany" va con la G, no primero por "Alemania").
 */
export function compareCountries(lang: AppLang) {
  return (a: string | null | undefined, b: string | null | undefined): number =>
    translateCountry(a, lang).localeCompare(translateCountry(b, lang), lang, {
      sensitivity: 'base',
      numeric: true,
    });
}
