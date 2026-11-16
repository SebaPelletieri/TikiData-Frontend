import { inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

export type AppLang = 'es' | 'en' | 'pt';

export interface LanguageOption {
  code: AppLang;
  /** Nombre del idioma en su propio idioma, así cada uno reconoce el suyo */
  label: string;
  short: string;
  /** Código de bandera de flagcdn */
  flag: string;
  /** Locale para fechas y números (Intl / toLocaleDateString) */
  locale: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'es', label: 'Español', short: 'ES', flag: 'ar', locale: 'es-AR' },
  { code: 'en', label: 'English', short: 'EN', flag: 'us', locale: 'en-US' },
  { code: 'pt', label: 'Português', short: 'PT', flag: 'br', locale: 'pt-BR' },
];

const STORAGE_KEY = 'tikidata-lang';

/**
 * Idioma de la página. Guarda la elección en el navegador y, la primera vez, toma el
 * idioma del navegador si es inglés o portugués (si no, español).
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private transloco = inject(TranslocoService);

  readonly languages = LANGUAGES;
  readonly current = signal<AppLang>('es');

  /** Se llama al arrancar la app: deja cargado el idioma antes de dibujar la página. */
  init(): Promise<unknown> {
    const lang = this.initialLang();
    this.apply(lang);
    return firstValueFrom(this.transloco.load(lang)).catch(() => null);
  }

  setLang(lang: AppLang): void {
    if (lang === this.current()) return;
    this.apply(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* navegación privada: no se recuerda, pero se cambia igual */
    }
  }

  option(lang: AppLang = this.current()): LanguageOption {
    return LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  }

  /** Locale para formatear fechas según el idioma elegido (ej. "es-AR"). */
  locale(): string {
    return this.option().locale;
  }

  private apply(lang: AppLang): void {
    this.current.set(lang);
    this.transloco.setActiveLang(lang);
    document.documentElement.lang = lang;
  }

  private initialLang(): AppLang {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved as AppLang;

    const browser = (navigator.language || '').slice(0, 2).toLowerCase();
    return browser === 'en' || browser === 'pt' ? browser : 'es';
  }
}
