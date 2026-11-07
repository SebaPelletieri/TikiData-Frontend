import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Team } from '../../models/Team';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { PlayerService } from '../../services/player-service';

@Component({
  imports: [DatePipe],
  standalone: true,
  selector: 'app-player-detail',
  styleUrl: './player-detail.css',
  templateUrl: './player-detail.html',
})
export class PlayerDetail implements OnInit {
  teamActual = signal<Team | null>(null);
  activeTab = signal('general');
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  public playerService = inject(PlayerService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.playerService.getByID(Number(id));
      
      setTimeout(() => {
        const player = this.playerService.playerActual();
        if (player && player.currentTeamID) {
          this.fetchTeam(player.currentTeamID);
        }
      }, 500);
    }
  }

  fetchTeam(teamId: number) {
    this.http.get<Team>(`http://localhost:3000/equipos/${teamId}`).subscribe({
      next: (data) => this.teamActual.set(data),
      error: (err) => console.error('Error cargando equipo', err)
    });
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }
}
