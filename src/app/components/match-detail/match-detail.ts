import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Match, LineupPlayer, MatchLineups } from '../../models/Match';
import { Team } from '../../models/Team';
import { Player } from '../../models/Player';
import { Championship } from '../../models/Championship';

@Component({
  selector: 'app-match-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './match-detail.html',
  styleUrl: './match-detail.css',
})
export class MatchDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  match = signal<Match | null>(null);
  localTeam = signal<Team | null>(null);
  awayTeam = signal<Team | null>(null);
  championship = signal<Championship | null>(null);
  dynamicLineups = signal<MatchLineups | null>(null);
  activeTab = signal<string>('Resumen');
  errorLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const matchId = params.get('id');
      if (matchId) {
        this.http.get<Match>(`http://localhost:3000/partidos/${matchId}`).subscribe({
          next: (data) => {
            this.match.set(data);
            this.loadTeamDetails(data.localTeamID, data.awayTeamID);
            this.loadChampionshipDetails(data.championshipID);
            this.loadTeamPlayers(data);
          },
          error: (err) => {
            console.error('Error al cargar el partido:', err);
            this.errorLoading.set(true);
          },
        });
      }
    });
  }

  setTab(tab: string): void {
    this.activeTab.set(tab);
  }

  getCountryFlag(country?: string): string {
    if (!country) return '🏳️';
    const c = country.toUpperCase();
    if (c.includes('ARG') || c === 'AR') return '🇦🇷';
    if (c.includes('BRA') || c === 'BR') return '🇧🇷';
    if (c.includes('URU') || c === 'UY') return '🇺🇾';
    if (c.includes('COL') || c === 'CO') return '🇨🇴';
    if (c.includes('CHI') || c === 'CL') return '🇨🇱';
    return '🏳️';
  }

  private loadTeamPlayers(matchData: Match): void {
    const localId = matchData.localTeamID;
    const awayId = matchData.awayTeamID;

    this.http.get<Player[]>(`http://localhost:3000/jugadores?currentTeamID=${localId}`).subscribe({
      next: (localPlayers) => {
        this.http.get<Player[]>(`http://localhost:3000/jugadores?currentTeamID=${awayId}`).subscribe({
          next: (awayPlayers) => {
            // Si hay jugadores cargados en la colección "jugadores" para esos equipos, armamos la lista real
            if (localPlayers.length > 0 || awayPlayers.length > 0) {
              const mapPlayer = (p: Player, idx: number): LineupPlayer => ({
                number: p.dorsals?.[localId] ?? p.dorsals?.[awayId] ?? idx + 1,
                name: p.name,
                position: p.position,
              });

              const mappedLocal = localPlayers.map((p, i) => mapPlayer(p, i));
              const mappedAway = awayPlayers.map((p, i) => mapPlayer(p, i));

              this.dynamicLineups.set({
                local: mappedLocal.slice(0, 11),
                localSubstitutes: mappedLocal.slice(11),
                away: mappedAway.slice(0, 11),
                awaySubstitutes: mappedAway.slice(11),
              });
            } else {
              // Respaldo: si no hay jugadores en /jugadores, usa los del partido
              this.dynamicLineups.set(matchData.lineups ?? null);
            }
          },
        });
      },
    });
  }

  private loadTeamDetails(localId: number, awayId: number): void {
    this.http.get<Team>(`http://localhost:3000/equipos/${localId}`).subscribe({
      next: (t) => this.localTeam.set(t),
      error: (err) => console.error('Error al cargar equipo local:', err),
    });

    this.http.get<Team>(`http://localhost:3000/equipos/${awayId}`).subscribe({
      next: (t) => this.awayTeam.set(t),
      error: (err) => console.error('Error al cargar equipo visitante:', err),
    });
  }

  private loadChampionshipDetails(champId: number): void {
    this.http.get<Championship>(`http://localhost:3000/campeonatos/${champId}`).subscribe({
      next: (c) => this.championship.set(c),
      error: (err) => console.error('Error al cargar campeonato:', err),
    });
  }
}