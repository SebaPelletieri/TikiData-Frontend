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
    // Capturamos el parámetro 'name' de la URL en lugar de 'id'
    this.route.paramMap.subscribe((params) => {
      const teamSlug = params.get('name');
      if (teamSlug) {
        this.loadTeamBySlug(teamSlug);
      }
    });
  }

  loadTeamBySlug(slug: string) {
    // CORREGIDO: Usamos getAllTeams() en lugar de getAll() para poder hacer .subscribe()
    this.teamService.getAllTeams().subscribe({
      next: (teams: Team[]) => {
        const foundTeam = teams.find((t) => t.name.toLowerCase().replace(/\s+/g, '-') === slug);

        if (foundTeam && foundTeam.id) {
          this.teamService.teamActual.set(foundTeam);

          // Cargar jugadores del equipo usando el ID real del equipo encontrado
          this.playerService.getAllPlayers().subscribe((players: Player[]) => {
            const filtered = players.filter(
              (p: any) => p.teamId === foundTeam.id || p.team === foundTeam.id,
            );
            this.squadPlayers.set(filtered);
          });
        }
      },
      error: (err: any) => {
        console.error('Error cargando equipos:', err);
      },
    });
  }
}
