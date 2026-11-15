import { Component, inject, signal, HostListener, computed, OnInit } from '@angular/core';
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
})
export class Navbar implements OnInit {
  public authService = inject(AuthService);
  private teamService = inject(TeamService);
  private playerService = inject(PlayerService);
  private championshipService = inject(ChampionshipService);
  private router = inject(Router);

  isLightMode = signal(false);
  isProfileMenuOpen = signal(false);

  searchText = signal<string>('');
  isSearchFocused = signal<boolean>(false);

  // Función 100% dinámica y universal para obtener la bandera de CUALQUIER país
  getCountryFlag(countryName: string | number): string {
    if (!countryName) return 'https://flagcdn.com/w40/xx.png';

    const strCountry = String(countryName);

    if (
      strCountry.toLowerCase() === 'internacional' ||
      strCountry.toLowerCase() === 'global' ||
      strCountry.toLowerCase() === 'sudamérica'
    ) {
      return '';
    }

    const universalIsoExceptions: Record<string, string> = {
      argentina: 'ar',
      brasil: 'br',
      brazil: 'br',
      espana: 'es',
      spain: 'es',
      inglaterra: 'gb-eng',
      england: 'gb-eng',
      alemania: 'de',
      germany: 'de',
      italia: 'it',
      italy: 'it',
      uruguay: 'uy',
      colombia: 'co',
      chile: 'cl',
      ecuador: 'ec',
      paraguay: 'py',
      bolivia: 'bo',
      peru: 'pe',
      venezuela: 've',
      mexico: 'mx',
      francia: 'fr',
      portugal: 'pt',
      japon: 'jp',
      estadosunidos: 'us',
      reinounido: 'gb',
      suiza: 'ch',
      republicacheca: 'cz',
      angola: 'ao',
      haiti: 'ht',
      costarica: 'cr',
      panama: 'pa',
      eslovenia: 'si',
      siria: 'sy',
    };

    const normalized = strCountry
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');

    const isoCode = universalIsoExceptions[normalized] || normalized.substring(0, 2);

    return `https://flagcdn.com/w40/${isoCode}.png`;
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
  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === 'Administrador';
  });

    searchResults = computed(() => {
    const query = this.normalizeText(this.searchText());
    if (!query) return [];

    return this.allElements().filter(
      (item) =>
        this.normalizeText(item.name).includes(query) ||
        this.normalizeText(item.type).includes(query) ||
        (item.country && this.normalizeText(item.country).includes(query)) ||
        (item.meta && this.normalizeText(item.meta).includes(query)),
    );
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

  ngOnInit() {
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
    if (this.isLightMode()) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }

  selectSearchResult(result: SearchResult): void {
    this.searchText.set('');
    this.isSearchFocused.set(false);
    this.router.navigate([result.route]);
  }
}
