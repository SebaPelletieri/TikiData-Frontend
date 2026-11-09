import { Component, input, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Team } from '../../models/Team';
import { Stadium } from '../../models/stadium';
import { Player } from '../../models/Player';
import { TeamRoster } from '../team-roster/team-roster';
import { AuthService } from '../../services/auth-service';
import { TeamService } from '../../services/team-service';

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
  public teamService = inject(TeamService); // Público para usarlo en el HTML si lo necesitas

  // Usamos un computed que prioriza el teamActual del servicio (que la página ya cargó)
  team = computed(() => {
    return this.teamService.teamActual() || this.localTeam();
  });

  localTeam = signal<Team | null>(null);

  stadium = input<Stadium | null>(null);
  championships = input<any[]>([]);
  matches = input<any[]>([]);
  players = input<Player[]>([]);

  activeTab = signal<'general' | 'squad' | 'matches'>('general');

  ngOnInit(): void {
    // Si por alguna razón el servicio no tiene el equipo cargado, lo buscamos de forma segura por ID o Slug
    if (!this.teamService.teamActual()) {
      this.route.paramMap.subscribe((params) => {
        const paramValue = params.get('id') || params.get('name');
        if (paramValue) {
          this.loadTeamFlexible(paramValue);
        }
      });
    }
  }

  loadTeamFlexible(paramValue: string): void {
    this.teamService.getAllTeams().subscribe((teams: Team[]) => {
      const found = teams.find((t: any) => {
        const matchId = String(t.id) === String(paramValue);
        const matchSlug =
          t.name &&
          t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === String(paramValue).toLowerCase();
        return matchId || matchSlug;
      });

      if (found) {
        this.localTeam.set(found);
        this.teamService.teamActual.set(found); // Sincronizamos con el servicio
      }
    });
  }

  setTab(tab: 'general' | 'squad' | 'matches'): void {
    this.activeTab.set(tab);
  }

  currentUser = computed(() => {
    const userFn = this.authService.currentUser as any;
    return typeof userFn === 'function' ? userFn() : userFn;
  });

  isFollowing = computed(() => {
    const user = this.currentUser();
    const currentTeam = this.team();
    if (!user || !user.favoriteTeams || !currentTeam || !currentTeam.id) return false;
    return user.favoriteTeams.includes(Number(currentTeam.id));
  });

  toggleFollowTeam() {
    const user = this.currentUser();
    const currentTeam = this.team();
    if (!user || !user.id || !currentTeam || !currentTeam.id) return;

    let favoriteTeams: number[] = [...(user.favoriteTeams || [])];
    const teamIdNum = Number(currentTeam.id);

    if (this.isFollowing()) {
      favoriteTeams = favoriteTeams.filter((id: number) => id !== teamIdNum);
    } else {
      favoriteTeams.push(teamIdNum);
    }

    this.authService.updateUser(user.id, { favoriteTeams }).subscribe();
  }

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
