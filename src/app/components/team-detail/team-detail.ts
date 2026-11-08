import { Component, input, signal, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Team } from '../../models/Team';
import { Stadium } from '../../models/stadium';
import { Player } from '../../models/Player';
import { TeamRoster } from '../team-roster/team-roster';
import { AuthService } from '../../services/auth-service'; 

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, TeamRoster],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
})
export class TeamDetail {
  private authService = inject(AuthService) as AuthService; 

  team = input.required<Team>();
  stadium = input<Stadium | null>(null);
  championships = input<any[]>([]);
  matches = input<any[]>([]);
  players = input<Player[]>([]);

  activeTab = signal<'general' | 'squad' | 'matches'>('general');

  setTab(tab: 'general' | 'squad' | 'matches'): void {
    this.activeTab.set(tab);
  }

  // 3. Obtener el usuario actual reactivamente
  currentUser = computed(() => {
    const userFn = this.authService.currentUser as any;
    return typeof userFn === 'function' ? userFn() : userFn;
  });

  // 4. Saber si el equipo actual ya está en los favoritos del usuario
  isFollowing = computed(() => {
    const user = this.currentUser();
    const currentTeam = this.team();
    if (!user || !user.favoriteTeams || !currentTeam || !currentTeam.id) return false;
    return user.favoriteTeams.includes(currentTeam.id);
  });

  // 5. Método para alternar entre Seguir / Dejar de seguir
  toggleFollowTeam() {
    const user = this.currentUser();
    const currentTeam = this.team();
    if (!user || !user.id || !currentTeam || !currentTeam.id) return;

    let favoriteTeams: number[] = [...(user.favoriteTeams || [])];

    if (this.isFollowing()) {
      // Si ya lo sigue, lo quitamos
      favoriteTeams = favoriteTeams.filter((id: number) => id !== currentTeam.id);
    } else {
      // Si no lo sigue, lo agregamos
      favoriteTeams.push(currentTeam.id);
    }

    // Actualizamos al usuario mediante el servicio
    this.authService.updateUser(user.id, { favoriteTeams }).subscribe();
  }

  // Método para formatear en español nativo
  formatSpanishDate(dateInput: string | Date | undefined): string {
    if (!dateInput) return '';

    let date: Date;

    if (typeof dateInput === 'string') {
      const cleanDate = dateInput.split('T')[0];
      const [year, month, day] = cleanDate.split('-').map(Number);
      date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
    } else {
      date = new Date(dateInput);
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }
}
