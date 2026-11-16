import { Component, input, output, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { goToLogin } from '../../utils/auth-redirect';
import { Team } from '../../models/Team';
import { Player } from '../../models/Player';
import { TeamRoster } from '../team-roster/team-roster';
import { AuthService } from '../../services/auth-service';
import { TeamService } from '../../services/team-service';
import { Stadium } from '../../models/Stadium';
import { getCountryFlag as countryFlagUrl } from '../../utils/countries';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, TeamRoster],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
})
export class TeamDetail implements OnInit {
  private authService = inject(AuthService) as AuthService;
  private router = inject(Router);

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
  private route = inject(ActivatedRoute);
  public teamService = inject(TeamService);

  team = computed(() => {
    return this.teamService.teamActual() || this.localTeam();
  });

  localTeam = signal<Team | null>(null);

  stadium = input<Stadium | null>(null);
  championships = input<any[]>([]);
  matches = input<any[]>([]);
  players = input<Player[]>([]);

  playerAdded = output<Player>();

  onPlayerAdded(player: Player): void {
    this.playerAdded.emit(player);
  }

  activeTab = signal<'general' | 'squad' | 'matches'>('general');

  ngOnInit(): void {
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
        this.teamService.teamActual.set(found);
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
    return user.favoriteTeams.some((id: any) => String(id) === String(currentTeam.id));
  });

  toggleFollowTeam() {
    const user = this.currentUser();
    const currentTeam = this.team();

    // Sin sesión no se puede seguir: se manda al login y después se vuelve a esta página
    if (!user || !user.id) {
      goToLogin(this.router);
      return;
    }
    if (!user || !user.id || !currentTeam || !currentTeam.id) return;

    // Ids como texto, igual que los guarda json-server ("4"), para comparar sin conversiones
    let favoriteTeams: (number | string)[] = [...(user.favoriteTeams || [])];
    const teamIdNum = String(currentTeam.id);

    if (this.isFollowing()) {
      favoriteTeams = favoriteTeams.filter((id: any) => String(id) !== String(teamIdNum));
    } else {
      favoriteTeams.push(teamIdNum);
    }

    this.authService.updateUser(user.id, { favoriteTeams }).subscribe();
  }

  /** Bandera del país del equipo ('' si es "Internacional" u otra región: se muestra 🌎). */
  countryFlag(country: string | undefined): string {
    return country ? countryFlagUrl(country) : '';
  }

  /** "Liga · 2026/2027", "Copa · 2026"... para las tarjetas de campeonatos activos. */
  championshipLabel(champ: { type?: string; season?: string }): string {
    const type = champ.type === 'LIGA' ? 'Liga' : champ.type === 'COPA' ? 'Copa' : '';
    return [type, champ.season].filter(Boolean).join(' · ');
  }

  formatSpanishDate(dateInput: string | Date | undefined | null): string {
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