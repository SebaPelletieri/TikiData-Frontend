import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Team } from '../../models/Team';

@Component({
  imports: [DatePipe],
  standalone: true,
  selector: 'app-player-detail',
  styleUrl: './player-detail.css',
  templateUrl: './player-detail.html',
})
export class PlayerDetail implements OnInit {
  teamActual = signal<Team | null>(null);
  
  // Pestaña activa (Vista general, Estadísticas, etc.)
  activeTab = 'general'; 
  route: any;
  playerService: any;
  http: any;

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
    this.http.get(`http://localhost:3000/equipos/${teamId}`).subscribe({
      next: (data: any) => this.teamActual.set(data as Team),
      error: (err: any) => console.error('Error cargando equipo', err)
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }
}
