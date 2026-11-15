import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Match } from '../../models/Match';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  styleUrl: './match-card.css',
  templateUrl: './match-card.html',
})
export class MatchCard implements OnInit {
  @Input({ required: true }) match!: Match;
  private http = inject(HttpClient);

  localTeam = signal<any | null>(null);
  awayTeam = signal<any | null>(null);

  ngOnInit(): void {
    if (this.match?.localTeamID) {
      this.http.get<any>(`http://localhost:3000/equipos/${this.match.localTeamID}`).subscribe({
        next: (t) => this.localTeam.set(t),
        error: (err: any) => {
          console.error('Error al cargar equipo local:', err);
          this.localTeam.set({ name: `Equipo ${this.match.localTeamID}` });
        },
      });
    }
    if (this.match?.awayTeamID) {
      this.http.get<any>(`http://localhost:3000/equipos/${this.match.awayTeamID}`).subscribe({
        next: (t) => this.awayTeam.set(t),
        error: (err: any) => {
          console.error('Error al cargar equipo visitante:', err);
          this.awayTeam.set({ name: `Equipo ${this.match.awayTeamID}` });
        },
      });
    }
  }
}
