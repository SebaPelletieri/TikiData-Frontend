import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TeamDetail } from '../../components/team-detail/team-detail';
import { Team } from '../../models/Team';
import { Player } from '../../models/Player';
import { TeamService } from '../../services/team-service';
import { ChampionshipService } from '../../services/championship-service';
import { MatchService } from '../../services/match-service';
import { PlayerService } from '../../services/player-service';

@Component({
  selector: 'app-team-detail-page',
  standalone: true,
  imports: [CommonModule, TeamDetail],
  templateUrl: './team-detail.html',
  styleUrls: ['./team-detail.css'],
})
export class TeamDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  public teamService = inject(TeamService);
  private championshipService = inject(ChampionshipService);
  private matchService = inject(MatchService);
  private playerService = inject(PlayerService);

  stadiumActual = signal<any | null>(null);
  activeChampionships = signal<any[]>([]);
  recentMatches = signal<any[]>([]);
  squadPlayers = signal<Player[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        const teamId = Number(idParam);
        this.loadTeamData(teamId);
      }
    });
  }

  loadTeamData(id: number) {
    this.teamService.getById(id).subscribe({
      next: (team: Team) => {
        if (team) {
          this.teamService.teamActual.set(team);

          // Cargar jugadores del equipo
          this.playerService.getAllPlayers().subscribe((players: Player[]) => {
            const filtered = players.filter((p: any) => p.teamId === id || p.team === id);
            this.squadPlayers.set(filtered);
          });
        }
      },
      error: (err: any) => {
        console.error('Error cargando detalles:', err);
      },
    });
  }
}
