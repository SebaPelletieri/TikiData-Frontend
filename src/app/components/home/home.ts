import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ChampionshipService } from '../../services/championship-service';
import { PlayerService } from '../../services/player-service';
import { TeamService } from '../../services/team-service';
import { Team } from '../../models/Team';
import { Match } from '../../models/Match';
import { Player } from '../../models/Player';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageService } from '../../i18n/language-service';

@Component({
  imports: [RouterLink, DatePipe, TranslocoPipe],
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

  private languageService = inject(LanguageService);

  /** Fecha de hoy en el idioma elegido: "Lunes, 16 de noviembre" / "Monday, November 16" */
  fechaActual = computed(() => {
    this.languageService.current();
    const texto = new Date().toLocaleDateString(this.languageService.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  });

  featuredLeagues = computed(() =>
    this.campeonatos()
      .filter((c) => !c.name.toLowerCase().includes('champions'))
      .slice(0, 4),
  );

  ligaProfesionalName = computed(() => {
    const liga = this.campeonatos().find((c) => c.name.toLowerCase().includes('liga profesional'));
    return liga ? liga.name : 'Liga Profesional';
  });

  ngOnInit(): void {
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

  getPlayerGoals(player: Player): number {
    return player.goals ?? 0;
  }

  getPlayerAvatar(player: Player): string {
    if (player.photo) {
      return player.photo;
    }
    const encodedName = encodeURIComponent(player.name || 'Jugador');
    return `https://ui-avatars.com/api/?name=${encodedName}&background=06182e&color=fff&size=128`;
  }
}
