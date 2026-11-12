import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Match } from '../../models/Match';
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
  localTeam = signal<any | null>(null);
  awayTeam = signal<any | null>(null);
  championship = signal<Championship | null>(null);
  activeTab = signal<string>('Resumen');

  ngOnInit(): void {
    const matchId = this.route.snapshot.paramMap.get('id');
    if (matchId) {
      this.http.get<Match>(`http://localhost:3000/partidos/${matchId}`).subscribe({
        next: (data) => {
          this.match.set(data);
          this.loadTeamDetails(data.localTeamID, data.awayTeamID);
          this.loadChampionshipDetails(data.championshipID);
        },
        error: () => {
          const mockMatch: Match = {
            id: Number(matchId),
            championshipID: 1,
            localTeamID: 1,
            awayTeamID: 2,
            localGoals: 2,
            awayGoals: 1,
            status: 'Finalizado',
            date: '2026-11-08T14:00:00',
            stadium: 'Estadio Monumental, Buenos Aires, Argentina',
            championshipName: 'Liga Profesional - Fecha 15',
            incidences: [
              { minute: 12, type: 'GOAL', text: 'M. Simón' },
              { minute: 28, type: 'YELLOW_CARD', text: 'L. Advíncula' },
              { minute: 41, type: 'GOAL', text: 'M. Borja' },
              { minute: 78, type: 'GOAL', text: 'E. Cavani' },
              { minute: 85, type: 'YELLOW_CARD', text: 'E. Díaz' },
            ],
            statistics: [
              { label: 'Posesión', local: 58, away: 42, unit: '%' },
              { label: 'Tiros totales', local: 14, away: 8 },
              { label: 'Tiros al arco', local: 6, away: 3 },
              { label: 'Corners', local: 5, away: 2 },
              { label: 'Pases', local: 412, away: 298 },
              { label: 'Precisión de pases', local: 87, away: 81, unit: '%' },
              { label: 'Faltas', local: 13, away: 17 },
              { label: 'Tarjetas amarillas', local: 2, away: 3 },
              { label: 'Tarjetas rojas', local: 0, away: 1 },
            ],
            summary: {
              text: '...',
              manOfTheMatch: {
                name: 'Miguel Borja',
                team: 'River Plate',
                position: 'Delantero',
                nationality: 'Colombia',
                flag: '🇨🇴',
                rating: '9.1',
              },
            },
          };
          this.match.set(mockMatch);
          this.loadTeamDetails(1, 2);
          this.loadChampionshipDetails(1);
        },
      });
    }
  }

  setTab(tab: string): void {
    this.activeTab.set(tab);
  }

  getCountryFlag(country: string): string {
    if (!country) return '🏳️';
    const c = country.toUpperCase();
    if (c.includes('ARG') || c === 'AR') return '🇦🇷';
    if (c.includes('BRA') || c === 'BR') return '🇧🇷';
    if (c.includes('URU') || c === 'UY') return '🇺🇾';
    if (c.includes('COL') || c === 'CO') return '🇨🇴';
    if (c.includes('CHI') || c === 'CL') return '🇨🇱';
    return '🏳️';
  }

  private loadTeamDetails(localId: number, awayId: number): void {
    this.http.get<any>(`http://localhost:3000/equipos/${localId}`).subscribe({
      next: (t) => this.localTeam.set(t),
      error: () =>
        this.localTeam.set({
          name: 'River Plate',
          country: 'Argentina',
          shield: 'https://via.placeholder.com/60',
        }),
    });

    this.http.get<any>(`http://localhost:3000/equipos/${awayId}`).subscribe({
      next: (t) => this.awayTeam.set(t),
      error: () =>
        this.awayTeam.set({
          name: 'Boca Juniors',
          country: 'Argentina',
          shield: 'https://via.placeholder.com/60',
        }),
    });
  }

  private loadChampionshipDetails(champId: number): void {
    this.http.get<Championship>(`http://localhost:3000/campeonatos/${champId}`).subscribe({
      next: (c) => this.championship.set(c),
      error: () =>
        this.championship.set({
          id: champId,
          name: 'Liga Profesional - Fecha 15',
          logo: 'https://via.placeholder.com/24',
          type: 'LIGA',
          country: 'Argentina',
          teamsIDs: [1, 2],
          season: '2026',
        }),
    });
  }
}
