import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Match } from '../../models/Match';
import { HttpClient } from '@angular/common/http';

@Component({
  imports: [CommonModule, RouterLink, DatePipe],
  selector: 'app-match-card',
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
        error: () => this.localTeam.set({ name: `Equipo ${this.match.localTeamID}` })
      });
    }
    if (this.match?.awayTeamID) {
      this.http.get<any>(`http://localhost:3000/equipos/${this.match.awayTeamID}`).subscribe({
        next: (t) => this.awayTeam.set(t),
        error: () => this.awayTeam.set({ name: `Equipo ${this.match.awayTeamID}` })
      });
    }
  }
}
