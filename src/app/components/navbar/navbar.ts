import {
  Component,
  inject,
  signal,
  HostListener,
  computed,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  NgZone,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { TeamService } from '../../services/team-service';
import { PlayerService } from '../../services/player-service';
import { ChampionshipService } from '../../services/championship-service';
import { Championship } from '../../models/Championship';
import { Team } from '../../models/Team';
import { Player } from '../../models/Player';
import { getCountryFlag as countryFlagUrl } from '../../utils/countries';

interface SearchResult {
  id: number | string;
  name: string;
  type: 'equipo' | 'campeonato' | 'jugador';
  route: string;
  country?: string;
  flag?: string;
  meta?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  host: { '[class.is-island]': 'isIsland()' },
})
export class Navbar implements OnInit, AfterViewInit, OnDestroy {
  public authService = inject(AuthService);
  private teamService = inject(TeamService);
  private playerService = inject(PlayerService);
  private championshipService = inject(ChampionshipService);
  private router = inject(Router);

  isLightMode = signal(false);
  isProfileMenuOpen = signal(false);

  // =====================================================================
  // Isla flotante ligada al scroll
  // ---------------------------------------------------------------------
  // En lugar de prender/apagar una clase, se calcula un progreso de 0 a 1
  // según cuánto se scrolleó (0 = barra completa, 1 = isla). Ese valor se
  // suaviza cuadro a cuadro y se pasa al CSS como la variable --p, así el
  // navbar se transforma siguiendo el movimiento del scroll.
  // Todo corre fuera de Angular para no disparar detección de cambios en cada cuadro.
  // =====================================================================
  private host = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);

  // ---------------------------------------------------------------------
  // Geometría de la isla. El contenido NUNCA cambia de tamaño: se mide una
  // vez cómo está en la barra completa y se calcula cuánto tiene que
  // deslizarse cada pieza (logo, cada link, buscador + botones) para quedar
  // dentro de la píldora. Ese desplazamiento se guarda en --tx y el CSS lo
  // aplica con transform: translateX(--tx × --p), que el navegador anima
  // en la placa de video sin recalcular posiciones.
  // ---------------------------------------------------------------------
  private readonly ISLAND_WIDTH = 1040; // ancho de la píldora (igual que en el CSS)
  private readonly ISLAND_PAD_LEFT = 18; // margen interno izquierdo de la isla
  private readonly ISLAND_PAD_RIGHT = 8; // margen interno derecho de la isla
  private readonly FAVICON_SIZE = 32;
  private readonly PILL = 38; // tamaño de la pastilla de cada link en la isla
  private readonly PILL_GAP = 4;
  private resizeObserver?: ResizeObserver;

  /** Posición horizontal de `el` dentro de `ancestor`, sin contar transforms. */
  private offsetLeftWithin(el: HTMLElement, ancestor: HTMLElement): number {
    let x = 0;
    let node: HTMLElement | null = el;
    while (node && node !== ancestor) {
      x += node.offsetLeft;
      node = node.offsetParent as HTMLElement | null;
    }
    return x;
  }

  private measureIsland(): void {
    const root = this.host.nativeElement as HTMLElement;
    const nav = root.querySelector<HTMLElement>('.navbar');
    const brand = root.querySelector<HTMLElement>('.navbar__brand');
    const utils = root.querySelector<HTMLElement>('.navbar__utils');
    const items = Array.from(root.querySelectorAll<HTMLElement>('.navbar__item'));
    if (!nav || !brand || !utils) return;

    // offsetLeft/offsetWidth no incluyen transforms: siempre miden la barra completa
    const navW = nav.offsetWidth;
    const inset = Math.max(0, (navW - this.ISLAND_WIDTH) / 2);
    const islandLeft = inset;
    const islandRight = navW - inset;

    // Logo / ícono: pegado al borde izquierdo de la isla
    const brandTx = islandLeft + this.ISLAND_PAD_LEFT - brand.offsetLeft;
    brand.style.setProperty('--tx', `${Math.round(brandTx)}px`);

    // Buscador + tema + sesión: pegados al borde derecho de la isla (sin cambiar de tamaño)
    const utilsTx = islandRight - this.ISLAND_PAD_RIGHT - (utils.offsetLeft + utils.offsetWidth);
    utils.style.setProperty('--tx', `${Math.round(utilsTx)}px`);

    // Links: solo íconos, en fila y centrados entre el ícono del logo y el buscador
    const spaceLeft = islandLeft + this.ISLAND_PAD_LEFT + this.FAVICON_SIZE;
    const spaceRight = utils.offsetLeft + utilsTx;
    const groupW = items.length * this.PILL + (items.length - 1) * this.PILL_GAP;
    const start = spaceLeft + Math.max(0, (spaceRight - spaceLeft - groupW) / 2);

    items.forEach((item, i) => {
      const icon = item.querySelector<HTMLElement>('.navbar__icon');
      if (!icon) return;
      const iconCenter = this.offsetLeftWithin(icon, nav) + icon.offsetWidth / 2;
      const target = start + this.PILL / 2 + i * (this.PILL + this.PILL_GAP);
      item.style.setProperty('--tx', `${Math.round(target - iconCenter)}px`);
    });
  }

  /** Scroll (en px) en el que la transformación queda completa. Más alto = más gradual. */
  private readonly ISLAND_RANGE = 260;
  /**
   * Tiempo aproximado (en segundos) que tarda el navbar en alcanzar al scroll.
   * Más alto = más suave y "flotante"; más bajo = más pegado al scroll.
   * Al estar basado en tiempo, se ve igual de fluido a 60Hz que a 144Hz.
   */
  private readonly SMOOTH_TIME = 0.45;

  isIsland = signal(false);
  private progress = 0;
  private velocity = 0;
  private target = 0;
  private frameId: number | null = null;
  private lastFrame = 0;
  private reduceMotion = false;
  private readonly onScroll = () => {
    // En celular y tablet no hay isla: la barra queda fija arriba (los links van abajo)
    this.target = this.isCompact()
      ? 0
      : Math.min(1, Math.max(0, window.scrollY / this.ISLAND_RANGE));
    this.startLoop();
  };

  // ---------------------------------------------------------------------
  // Celular / tablet (hasta 900px, igual que en navbar.css)
  // ---------------------------------------------------------------------
  private readonly compactQuery = window.matchMedia('(max-width: 900px)');
  private readonly onCompactChange = () => {
    if (!this.isCompact()) this.zone.run(() => this.closeMobileSearch());
    this.onScroll();
  };

  private isCompact(): boolean {
    return this.compactQuery.matches;
  }

  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;
  isMobileSearchOpen = signal(false);

  openMobileSearch(): void {
    this.isMobileSearchOpen.set(true);
    // Se espera a que el buscador se muestre para poner el cursor en el campo
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  closeMobileSearch(): void {
    this.isMobileSearchOpen.set(false);
    this.isSearchFocused.set(false);
    this.searchText.set('');
  }

  private startLoop(): void {
    if (this.frameId === null) {
      this.lastFrame = performance.now();
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  /**
   * Resorte con amortiguación crítica ("SmoothDamp"): además de la posición
   * guarda la velocidad, así el navbar acelera y frena de forma gradual
   * (sin tirones cuando la rueda del mouse avanza a saltos) y nunca se pasa
   * del objetivo ni rebota.
   */
  private springStep(dt: number): void {
    const omega = 2 / this.SMOOTH_TIME;
    const x = omega * dt;
    const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const change = this.progress - this.target;
    const temp = (this.velocity + omega * change) * dt;
    this.velocity = (this.velocity - omega * temp) * decay;
    let next = this.target + (change + temp) * decay;

    // Evita pasarse del objetivo
    if (this.target - this.progress > 0 === next > this.target) {
      next = this.target;
      this.velocity = 0;
    }
    this.progress = next;
  }

  /** Curva muy suave en los extremos: arranca y termina despacio (smootherstep). */
  private ease(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private readonly tick = (now: number) => {
    // dt acotado para que una pestaña en segundo plano no provoque un salto al volver
    const dt = Math.min(0.05, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;

    if (this.reduceMotion) {
      this.progress = this.target;
      this.velocity = 0;
    } else {
      this.springStep(dt);
      if (Math.abs(this.target - this.progress) < 0.0005 && Math.abs(this.velocity) < 0.002) {
        this.progress = this.target;
        this.velocity = 0;
      }
    }

    this.host.nativeElement.style.setProperty('--p', this.ease(this.progress).toFixed(4));
    // Directo sobre el DOM (sin pasar por Angular): activa el desenfoque solo fuera del tope
    this.host.nativeElement.classList.toggle('is-scrolled', this.progress > 0.01);

    // La clase solo cambia al cruzar la mitad (para pointer-events y estados puntuales)
    const island = this.progress > 0.5;
    if (island !== this.isIsland()) this.zone.run(() => this.isIsland.set(island));

    this.frameId = this.progress === this.target ? null : requestAnimationFrame(this.tick);
  };

  searchText = signal<string>('');
  isSearchFocused = signal<boolean>(false);

  // Bandera del país: usa la lista completa compartida (utils/countries.ts)
  getCountryFlag(countryName: string | number): string {
    return countryFlagUrl(countryName);
  }

    private allElements = computed<SearchResult[]>(() => {
    const championships: SearchResult[] = this.championshipService
      .championships()
      .map((c: Championship) => ({
        id: c.id!,
        name: c.name,
        type: 'campeonato',
        route: `/championship/${this.toSlug(c.name.split(/[-–—]|Fecha/)[0])}`,
        country: c.country || '',
        flag: this.getCountryFlag(c.country || ''),
        meta: c.type ? c.type.toUpperCase() : '',
      }));

    const teams: SearchResult[] = this.teamService.teams().map((t: Team) => ({
      id: t.id!,
      name: t.name,
      type: 'equipo',
      route: `/team/${t.id}`,
      country: t.country || '',
      flag: this.getCountryFlag(t.country || ''),
    }));

    

    const players: SearchResult[] = this.playerService.players().map((p: Player) => ({
      id: p.id!,
      name: p.name,
      type: 'jugador',
      route: `/player/${this.toSlug(p.name)}`,
      country: p.nationality || '',
      flag: this.getCountryFlag(p.nationality || ''),
      meta: p.position || '',
    }));

    return [...championships, ...teams, ...players];
  });

  /**
   * Texto de búsqueda de cada elemento, normalizado una sola vez (cuando cambian los
   * datos) y no en cada tecla: antes se normalizaban cientos de nombres por pulsación.
   */
  private searchIndex = computed(() =>
    this.allElements().map((item) => ({
      item,
      text: this.normalizeText([item.name, item.type, item.country, item.meta].filter(Boolean).join(' ')),
    })),
  );
  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === 'Administrador';
  });

  searchResults = computed(() => {
    const query = this.normalizeText(this.searchText());
    if (!query) return [];
    const results: SearchResult[] = [];
    // Con 40 resultados alcanza para el desplegable; dibujar cientos trababa el tipeo
    for (const entry of this.searchIndex()) {
      if (entry.text.includes(query)) {
        results.push(entry.item);
        if (results.length === 40) break;
      }
    }
    return results;
  });

  userName = computed(() => {
    const user = this.authService.currentUser() as any;
    if (!user) return '';
    return user.username || user.name || user.email?.split('@')[0] || '';
  });

  userInitial = computed(() => {
    const name = this.userName();
    return name ? name.charAt(0).toUpperCase() : '';
  });

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      // Se vuelve a medir si cambia el ancho de la ventana o del bloque de la derecha
      // (por ejemplo, al iniciar sesión cambian los botones por el avatar)
      this.resizeObserver = new ResizeObserver(() => this.measureIsland());
      const root = this.host.nativeElement as HTMLElement;
      const nav = root.querySelector('.navbar');
      const utils = root.querySelector('.navbar__utils');
      if (nav) this.resizeObserver.observe(nav);
      if (utils) this.resizeObserver.observe(utils);
      this.measureIsland();
      // Las fuentes pueden cambiar el ancho de los textos al terminar de cargar
      document.fonts?.ready.then(() => this.measureIsland());
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.compactQuery.removeEventListener('change', this.onCompactChange);
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
  }

  ngOnInit() {
    this.loadSavedTheme();
    this.reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.compactQuery.addEventListener('change', this.onCompactChange);
    });
    this.onScroll(); // por si la página ya arranca scrolleada


    if (this.championshipService.championships().length === 0) {
      this.championshipService.getAll();
    }
    if (this.teamService.teams().length === 0) {
      this.teamService.getAll();
    }
    if (this.playerService.players().length === 0) {
      this.playerService.getAll();
    }
  }

    private toSlug(text: string): string {
    return (text || '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.navbar__user-dropdown')) {
      this.closeProfileMenu();
    }
    if (!target.closest('.navbar__search')) {
      this.isSearchFocused.set(false);
    }
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isProfileMenuOpen.update((open) => !open);
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen.set(false);
  }

  onLogout(): void {
    this.closeProfileMenu();
    this.authService.logout();
    this.router.navigate(['/']);
  }

  toggleTheme() {
    this.isLightMode.update((value) => !value);
    this.applyTheme();
    // Se recuerda la elección para la próxima vez que se abra la página
    try {
      localStorage.setItem(this.THEME_KEY, this.isLightMode() ? 'light' : 'dark');
    } catch {
      // Sin acceso al almacenamiento (modo privado, etc.): el tema funciona igual
    }
  }

  private readonly THEME_KEY = 'tikidata-theme';

  private applyTheme(): void {
    document.body.classList.toggle('light-theme', this.isLightMode());
  }

  private loadSavedTheme(): void {
    try {
      this.isLightMode.set(localStorage.getItem(this.THEME_KEY) === 'light');
    } catch {
      this.isLightMode.set(false);
    }
    this.applyTheme();
  }

  selectSearchResult(result: SearchResult): void {
    this.searchText.set('');
    this.isSearchFocused.set(false);
    this.isMobileSearchOpen.set(false);
    this.router.navigate([result.route]);
  }
}
