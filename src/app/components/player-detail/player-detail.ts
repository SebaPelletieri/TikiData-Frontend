import { Component, input, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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

  // Recibe el objeto jugador desde la página padre
  player = input<Player | null>(null);

  // Sistema de pestañas activo
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

  // Usuario actual obtenido del servicio de autenticación
  currentUser = computed(() => {
    const userFn = this.authService.currentUser as any;
    return typeof userFn === 'function' ? userFn() : userFn;
  });

  // Comprueba si el jugador actual está en la lista de favoritos del usuario
  isFollowing = computed(() => {
    const user = this.currentUser();
    const currentPlayer = this.player();
    if (!user || !user.favoritePlayers || !currentPlayer || !currentPlayer.id) return false;
    return user.favoritePlayers.some((id: any) => String(id) === String(currentPlayer.id));
  });

  // Alterna entre seguir y dejar de seguir al jugador
  toggleFollowPlayer() {
    const user = this.currentUser();
    const currentPlayer = this.player();
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
