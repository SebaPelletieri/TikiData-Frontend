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
  subtitle?: string;
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

  private allElements = computed<SearchResult[]>(() => {
    const championships: SearchResult[] = this.championshipService
      .championships()
      .map((c: Championship) => ({
        id: c.id!,
        name: c.name,
        type: 'campeonato',
        route: `/championships/${c.id}`,
        subtitle: [c.type, c.country].filter(Boolean).join(' • ') || 'Campeonato',
      }));

    const teams: SearchResult[] = this.teamService.teams().map((t: Team) => ({
      id: t.id!,
      name: t.name,
      type: 'equipo',
      route: `/teams/${t.id}`,
      subtitle: t.country || 'Equipo',
    }));

    const players: SearchResult[] = this.playerService.players().map((p: Player) => ({
      id: p.id!,
      name: p.name,
      type: 'jugador',
      route: `/players/${p.id}`,
      subtitle: [p.position, p.teamName].filter(Boolean).join(' • ') || 'Jugador',
    }));

    return [...championships, ...teams, ...players];
  });

  searchResults = computed(() => {
    const query = this.normalizeText(this.searchText());
    if (!query) return [];

    return this.allElements()
      .filter(
        (item) =>
          this.normalizeText(item.name).includes(query) ||
          this.normalizeText(item.type).includes(query) ||
          (item.subtitle && this.normalizeText(item.subtitle).includes(query)),
      )
      .slice(0, 12);
  });

  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === 'Administrador';
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
    this.router.navigate(['/login']);
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
