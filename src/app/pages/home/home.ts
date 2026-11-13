import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ChampionshipService } from '../../services/championship-service';
import { PlayerService } from '../../services/player-service';
import { TeamService } from '../../services/team-service';
import { Team } from '../../models/Team';
import { Match } from '../../models/Match';

@Component({
  imports: [RouterLink, DatePipe],
  selector: 'app-home',
  standalone: true,
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private championshipService = inject(ChampionshipService);
  private teamService = inject(TeamService);
  private playerService = inject(PlayerService);
  private http = inject(HttpClient);

  campeonatos = this.championshipService.championships;
  teamsRanked = signal<Team[]>([]);
  allTeams = signal<Team[]>([]);
  featuredMatches = signal<Match[]>([]);
  topScorers = this.playerService.topScorers;

  fechaActual: string = '';

  // Filtra la Champions League y toma las ligas principales para el carrusel superior
  featuredLeagues = computed(() =>
    this.campeonatos()
      .filter((c) => !c.name.toLowerCase().includes('champions'))
      .slice(0, 4)
  );

  // Busca el nombre de la Liga Profesional para enlazar "Ver tabla completa"
  ligaProfesionalName = computed(() => {
    const liga = this.campeonatos().find((c) =>
      c.name.toLowerCase().includes('liga profesional')
    );
    return liga ? liga.name : 'Liga Profesional';
  });

  ngOnInit(): void {
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    };
    const fechaFormateada = new Date().toLocaleDateString('es-ES', opciones);
    this.fechaActual = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

    this.championshipService.getAll();
    this.playerService.getTopScorers();

    this.teamService.getTeamsSortedByPoints().subscribe({
      next: (data) => {
        this.teamsRanked.set(data);
        this.allTeams.set(data);
      },
      error: (err) => console.error('Error al ordenar equipos:', err),
    });

    this.http.get<Match[]>('http://localhost:3000/partidos').subscribe({
      next: (data) => this.featuredMatches.set(data.slice(0, 5)),
      error: (err) => console.error('Error al cargar partidos:', err),
    });
  }

  getTeamById(id?: number): Team | undefined {
    if (id === undefined || id === null) return undefined;
    return this.allTeams().find((t) => Number(t.id) === Number(id));
  }

  getChampionshipName(champId?: number): string {
    if (!champId) return 'Torneo';
    const found = this.campeonatos().find((c) => Number(c.id) === Number(champId));
    return found ? found.name : 'Liga Profesional';
  }

  getLeagueIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('liga profesional') || lower.includes('argentina')) return '🇦🇷';
    if (lower.includes('copa')) return '🛡️';
    if (lower.includes('libertadores') || lower.includes('sudamericana')) return '🏆';
    return '⚽';
  }

  getPlayerGoals(player: any): number {
    return player.goals ?? player.statistics?.goals ?? 0;
  }

  getPlayerAvatar(player: any): string {
    if (player.photo || player.image || player.avatar) {
      return player.photo || player.image || player.avatar;
    }
    const encodedName = encodeURIComponent(player.name || 'Jugador');
    return `https://ui-avatars.com/api/?name=${encodedName}&background=06182e&color=fff&size=128`;
  }
}