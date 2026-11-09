import { Component, input, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Team } from '../../models/Team';
import { Stadium } from '../../models/stadium';
import { Player } from '../../models/Player';
import { TeamRoster } from '../team-roster/team-roster';
import { AuthService } from '../../services/auth-service';
import { TeamService } from '../../services/team-service'; // Importamos tu TeamService

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, TeamRoster],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
})
export class TeamDetail implements OnInit {
  private authService = inject(AuthService) as AuthService;
  private route = inject(ActivatedRoute);
  private teamService = inject(TeamService); // Inyectamos el servicio aquí

  team = signal<Team | null>(null);

  stadium = input<Stadium | null>(null);
  championships = input<any[]>([]);
  matches = input<any[]>([]);
  players = input<Player[]>([]);

  activeTab = signal<'general' | 'squad' | 'matches'>('general');

  ngOnInit(): void {
    // Capturamos el parámetro 'name' de la URL (ej: "estudiantes-de-la-plata")
    this.route.paramMap.subscribe((params) => {
      const teamNameSlug = params.get('name');
      if (teamNameSlug) {
        this.loadTeamByName(teamNameSlug);
      }
    });
  }

  loadTeamByName(slug: string): void {
    // Obtenemos todos los equipos y buscamos el que coincida con el slug
    this.teamService.getAllTeams().subscribe((teams: Team[]) => {
      const found = teams.find((t) => t.name.toLowerCase().replace(/\s+/g, '-') === slug);
      if (found) {
        this.team.set(found);
      }
    });
  }

  setTab(tab: 'general' | 'squad' | 'matches'): void {
    this.activeTab.set(tab);
  }

  // Obtener el usuario actual reactivamente
  currentUser = computed(() => {
    const userFn = this.authService.currentUser as any;
    return typeof userFn === 'function' ? userFn() : userFn;
  });

  // Saber si el equipo actual ya está en los favoritos del usuario
  isFollowing = computed(() => {
    const user = this.currentUser();
    const currentTeam = this.team();
    if (!user || !user.favoriteTeams || !currentTeam || !currentTeam.id) return false;
    return user.favoriteTeams.includes(currentTeam.id);
  });

  // Método para alternar entre Seguir / Dejar de seguir
  toggleFollowTeam() {
    const user = this.currentUser();
    const currentTeam = this.team();
    if (!user || !user.id || !currentTeam || !currentTeam.id) return;

    let favoriteTeams: number[] = [...(user.favoriteTeams || [])];

    if (this.isFollowing()) {
      favoriteTeams = favoriteTeams.filter((id: number) => id !== currentTeam.id);
    } else {
      favoriteTeams.push(currentTeam.id);
    }

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
