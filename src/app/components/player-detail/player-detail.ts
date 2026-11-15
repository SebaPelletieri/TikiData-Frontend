import { Component, input, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { goToLogin } from '../../utils/auth-redirect';
import { Player } from '../../models/Player';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './player-detail.html',
  styleUrl: './player-detail.css',
})
export class PlayerDetail {
  private authService = inject(AuthService) as AuthService;
  private router = inject(Router);

  /** Para el botón Seguir: sin sesión manda al login en lugar de seguir. */
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  player = input<Player | null>(null);

  activeTab = signal<'general' | 'stats' | 'clubs' | 'matches'>('general');

  setTab(tab: 'general' | 'stats' | 'clubs' | 'matches'): void {
    this.activeTab.set(tab);
  }

  formatSpanishDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    if (!dateStr.includes('-')) return dateStr;

    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));

    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  currentUser = computed(() => {
    const userFn = this.authService.currentUser as any;
    return typeof userFn === 'function' ? userFn() : userFn;
  });

  isFollowing = computed(() => {
    const user = this.currentUser();
    const currentPlayer = this.player();
    if (!user || !user.favoritePlayers || !currentPlayer || !currentPlayer.id) return false;
    return user.favoritePlayers.some((id: any) => String(id) === String(currentPlayer.id));
  });

  toggleFollowPlayer() {
    const user = this.currentUser();
    const currentPlayer = this.player();

    // Sin sesión no se puede seguir: se manda al login y después se vuelve a esta página
    if (!user || !user.id) {
      goToLogin(this.router);
      return;
    }
    if (!user || !user.id || !currentPlayer || !currentPlayer.id) return;

    let favoritePlayers: any[] = [...(user.favoritePlayers || [])];
    const playerId = String(currentPlayer.id);

    if (this.isFollowing()) {
      favoritePlayers = favoritePlayers.filter((id: any) => String(id) !== playerId);
    } else {
      favoritePlayers.push(playerId);
    }

    this.authService.updateUser(user.id, { favoritePlayers }).subscribe();
  }
}
