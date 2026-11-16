import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './i18n/transloco-loader';
import { LanguageService } from './i18n/language-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Al volver atrás se recupera la posición del scroll; al entrar a una página nueva, arranca arriba
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    provideHttpClient(),
    // Idiomas: español (base), inglés y portugués. Los textos están en public/i18n/*.json
    provideTransloco({
      config: {
        availableLangs: ['es', 'en', 'pt'],
        defaultLang: 'es',
        fallbackLang: 'es',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        // Lo que todavía no está traducido se muestra en español en vez de la clave
        missingHandler: { useFallbackTranslation: true, logMissingKey: isDevMode() },
      },
      loader: TranslocoHttpLoader,
    }),
    // Carga el idioma guardado antes de mostrar la página (evita ver un instante en español)
    provideAppInitializer(() => inject(LanguageService).init()),
  ],
};
