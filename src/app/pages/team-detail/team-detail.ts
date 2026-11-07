import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { TeamService } from '../../services/team-service';
import { Stadium } from '../../models/stadium';
import { TeamDetailComponent } from '../../components/team-detail/team-detail';

@Component({
  selector: 'app-team-detail-page',
  standalone: true,
  imports: [CommonModule, TeamDetailComponent],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
})
export class TeamDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  public teamService = inject(TeamService);

  stadiumActual = signal<Stadium | null>(null);
  activeChampionships = signal<any[]>([]);
  recentMatches = signal<any[]>([]);
  players = signal<any[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const teamId = Number(id);
    this.teamService.getByID(teamId);

    forkJoin({
      team: this.http.get<any>(`http://localhost:3000/equipos/${teamId}`),
      teams: this.http.get<any[]>('http://localhost:3000/equipos'),
      champs: this.http.get<any[]>('http://localhost:3000/campeonatos'),
      matches: this.http.get<any[]>('http://localhost:3000/partidos'),
      allPlayers: this.http.get<any[]>('http://localhost:3000/jugadores'),
    }).subscribe({
      next: ({ team, teams, champs, matches, allPlayers }) => {
        // Estadio
        if (team.stadiumID) {
          this.http.get<Stadium>(`http://localhost:3000/estadios/${team.stadiumID}`).subscribe({
            next: (st) => this.stadiumActual.set(st),
            error: () => console.warn('Estadio no encontrado'),
          });
        }

        // Campeonatos activos
        if (team.championshipsActive?.length) {
          this.activeChampionships.set(
            champs.filter((c) => team.championshipsActive.includes(c.id)),
          );
        }

        // Partidos recientes
        const teamMatches = (matches || []).filter(
          (m) => m.localTeamID === teamId || m.awayTeamID === teamId,
        );

        const mappedMatches = teamMatches.slice(0, 5).map((m) => {
          const home = teams.find((t) => t.id === m.localTeamID);
          const away = teams.find((t) => t.id === m.awayTeamID);
          const tournament = champs.find((c) => c.id === m.championshipID);

          return {
            date: m.date,
            homeName: home?.name || 'Local',
            homeShield: home?.shield || '',
            score: `${m.localGoals} - ${m.awayGoals}`,
            awayName: away?.name || 'Visitante',
            awayShield: away?.shield || '',
            tournament: tournament?.name || 'Torneo',
          };
        });

        this.recentMatches.set(mappedMatches);

        // Jugadores del plantel
        const teamPlayers = (allPlayers || []).filter(
          (p) => Number(p.teamID) === teamId || Number(p.equipoId) === teamId,
        );
        this.players.set(teamPlayers);
      },
      error: (err) => console.error('Error cargando detalles:', err),
    });
  }
}
