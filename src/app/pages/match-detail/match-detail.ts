import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchService } from '../../services/match-service';

@Component({
  imports: [CommonModule, RouterModule],
  selector: 'app-match-detail',
  styleUrl: './match-detail.css',
  templateUrl: './match-detail.html',
})
export class MatchDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  public matchService = inject(MatchService);

  localTeam = signal<any | null>(null);
  awayTeam = signal<any | null>(null);
  activeTab = signal<string>('resumen');

  constructor() {
    effect(() => {
      const match = this.matchService.matchActual();
      if (match) {
        if (match.localTeamID && !this.localTeam()) {
          this.fetchTeam(match.localTeamID, true);
        }
        if (match.awayTeamID && !this.awayTeam()) {
          this.fetchTeam(match.awayTeamID, false);
        }
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.matchService.getByID(Number(id));
    }
  }

  fetchTeam(teamId: number, isLocal: boolean): void {
    this.http.get<any>(`http://localhost:3000/equipos/${teamId}`).subscribe({
      next: (team) => {
        if (isLocal) {
          this.localTeam.set(team);
        } else {
          this.awayTeam.set(team);
        }
      },
      error: (err) => console.error('Error cargando equipo', err)
    });
  }

  setTab(tab: string): void {
    this.activeTab.set(tab);
  }

  getPercentage(valLocal: number, valAway: number, isLocal: boolean): number {
    const total = valLocal + valAway;
    if (total === 0) return 50;
    return isLocal ? (valLocal / total) * 100 : (valAway / total) * 100;
  }

}
