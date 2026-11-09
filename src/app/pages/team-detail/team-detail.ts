import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TeamDetail } from '../../components/team-detail/team-detail';
import { Team } from '../../models/Team';
import { Player } from '../../models/Player';
import { TeamService } from '../../services/team-service';
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
  private playerService = inject(PlayerService);

  squadPlayers = signal<Player[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      // Obtenemos el parámetro que venga (puede ser 'id' o 'name' según cómo responda la ruta)
      const paramValue = params.get('id') || params.get('name');

      if (paramValue) {
        // Verificamos si es un número o un texto (slug)
        if (!isNaN(Number(paramValue))) {
          this.loadTeamById(paramValue);
        } else {
          this.loadTeamBySlug(paramValue);
        }
      }
    });
  }

  loadTeamById(targetId: string) {
    this.teamService.getAllTeams().subscribe({
      next: (teams: Team[]) => {
        const foundTeam = teams.find((t: any) => String(t.id) === String(targetId));

        if (foundTeam) {
          console.log('¡Equipo encontrado por ID con éxito!', foundTeam);
          this.teamService.teamActual.set(foundTeam);
          if (foundTeam.id) {
            this.loadPlayers(foundTeam.id);
          }
        } else {
          console.warn(`No se encontró el equipo con ID: ${targetId}`);
        }
      },
      error: (err) => console.error('Error cargando equipos:', err),
    });
  }

  loadTeamBySlug(slug: string) {
    this.teamService.getAllTeams().subscribe({
      next: (teams: Team[]) => {
        // Limpiamos y comparamos el slug de la URL con el nombre del equipo transformado
        const foundTeam = teams.find(
          (t: any) =>
            t.name && t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug.toLowerCase(),
        );

        if (foundTeam) {
          console.log('¡Equipo encontrado por Slug con éxito!', foundTeam);
          this.teamService.teamActual.set(foundTeam);
          if (foundTeam.id) {
            this.loadPlayers(foundTeam.id);
          }
        } else {
          console.warn(`No se encontró el equipo con slug: ${slug}`);
        }
      },
      error: (err) => console.error('Error cargando equipos:', err),
    });
  }

  loadPlayers(teamId: any) {
    this.playerService.getAllPlayers().subscribe((players: Player[]) => {
      const filtered = players.filter(
        (p: any) => String(p.teamId) === String(teamId) || String(p.team) === String(teamId),
      );
      this.squadPlayers.set(filtered);
    });
  }
}
