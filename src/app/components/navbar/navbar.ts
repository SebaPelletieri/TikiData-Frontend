import { Component, inject, signal, HostListener, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';

interface SearchResult {
  id: number;
  name: string;
  type: 'equipo' | 'campeonato' | 'jugador';
  route: string; // Ej: '/teams/1', '/championships/2', '/players/1'
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
  private router = inject(Router);

  isLightMode = signal(false);
  isProfileMenuOpen = signal(false);

  // Estado del Buscador Global
  searchText = signal<string>('');
  isSearchFocused = signal<boolean>(false);

  // Datos simulados con las rutas de detalle específicas por ID
  private allElements: SearchResult[] = [
    {
      id: 1,
      name: 'Liga Profesional',
      type: 'campeonato',
      route: '/championships/1',
      subtitle: 'Campeonato Activo',
    },
    {
      id: 2,
      name: 'Copa Libertadores',
      type: 'campeonato',
      route: '/championships/2',
      subtitle: 'Internacional',
    },
    { id: 1, name: 'River Plate', type: 'equipo', route: '/teams/1', subtitle: 'Argentina' },
    { id: 2, name: 'Boca Juniors', type: 'equipo', route: '/teams/2', subtitle: 'Argentina' },
    {
      id: 1,
      name: 'Franco Armani',
      type: 'jugador',
      route: '/players/1',
      subtitle: 'Arquero • Boca Juniors',
    },
    {
      id: 2,
      name: 'Edinson Cavani',
      type: 'jugador',
      route: '/players/2',
      subtitle: 'Delantero • Boca Juniors',
    },
  ];

  // Filtrado reactivo con computed
  searchResults = computed(() => {
    const query = this.searchText().toLowerCase().trim();
    if (!query) return [];

    return this.allElements.filter(
      (item) => item.name.toLowerCase().includes(query) || item.type.toLowerCase().includes(query),
    );
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
    console.log('Usuario actual en Navbar:', this.authService.currentUser());
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
