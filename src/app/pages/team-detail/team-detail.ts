import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TeamDetail } from '../../components/team-detail/team-detail';
import { Team } from '../../models/Team';
import { Player } from '../../models/Player';
import { TeamService } from '../../services/team-service';
import { PlayerService } from '../../services/player-service';
import { MatchService } from '../../services/match-service';
import { Match } from '../../models/Match';
import { ChampionshipService } from '../../services/championship-service';
import { Championship } from '../../models/Championship';

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
  private matchService = inject(MatchService);
  private championshipService = inject(ChampionshipService);

  squadPlayers = signal<Player[]>([]);
  teamMatches = signal<any[]>([]);
  teamChampionships = signal<any[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      // Limpiamos el estado anterior al cambiar de equipo
      this.teamService.teamActual.set(null);
      this.squadPlayers.set([]);
      this.teamMatches.set([]);
      this.teamChampionships.set([]);

      const paramValue = params.get('id') || params.get('name');

      if (paramValue) {
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
          this.teamService.teamActual.set(foundTeam);
          if (foundTeam.id) {
            this.loadPlayers(foundTeam);
            this.loadMatches(foundTeam.id, teams);
            this.loadChampionships(foundTeam);
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
        const cleanSlug = this.toSlug(decodeURIComponent(slug));

        const foundTeam = teams.find(
          (t: any) => t.name && this.toSlug(t.name) === cleanSlug,
        );

        if (foundTeam) {
          this.teamService.teamActual.set(foundTeam);
          if (foundTeam.id) {
            this.loadPlayers(foundTeam);
            this.loadMatches(foundTeam.id, teams);
            this.loadChampionships(foundTeam);
          }
        } else {
          console.warn(`No se encontró el equipo con slug: ${slug}`);
        }
      },
      error: (err) => console.error('Error cargando equipos:', err),
    });
  }

  loadPlayers(team: Team) {
    this.playerService.getAllPlayers().subscribe({
      next: (players: Player[]) => {
        const teamIdStr = String(team.id ?? '').trim();
        const teamNameClean = (team.name || '').trim().toLowerCase();
        const teamPlayerIds = (team.playerIDs || []).map((id) => String(id).trim());

        const filtered = players.filter((p: Player) => {
          const matchByTeamId =
            p.currentTeamID !== undefined &&
            p.currentTeamID !== null &&
            String(p.currentTeamID).trim() === teamIdStr;

          const matchByArray =
            p.id !== undefined &&
            p.id !== null &&
            teamPlayerIds.includes(String(p.id).trim());

          const matchByName =
            p.teamName && p.teamName.trim().toLowerCase() === teamNameClean;

          return matchByTeamId || matchByArray || matchByName;
        });

        this.squadPlayers.set(filtered);
      },
      error: (err) => console.error('Error cargando jugadores:', err),
    });
  }

  loadMatches(teamId: any, allTeams: Team[]) {
    this.matchService.getAllMatches().subscribe({
      next: (matches: Match[]) => {
        const filtered = matches
          .filter(
            (m) =>
              String(m.localTeamID) === String(teamId) ||
              String(m.awayTeamID) === String(teamId),
          )
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((m) => {
            const local = allTeams.find((t) => String(t.id) === String(m.localTeamID));
            const away = allTeams.find((t) => String(t.id) === String(m.awayTeamID));
            const isPlayed = m.status === 'Finalizado' || m.status === 'En Vivo';

            const matchDate = new Date(m.date);
            const timeStr = matchDate.toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return {
              ...m,
              homeName: local?.name || `Equipo #${m.localTeamID}`,
              homeShield: local?.shield || '',
              awayName: away?.name || `Equipo #${m.awayTeamID}`,
              awayShield: away?.shield || '',
              score: isPlayed ? `${m.localGoals} - ${m.awayGoals}` : `${timeStr} hs`,
              tournament: m.championshipName || 'Torneo',
            };
          });

        this.teamMatches.set(filtered);
      },
      error: (err) => console.error('Error cargando partidos del equipo:', err),
    });
  }

  loadChampionships(team: Team) {
    this.championshipService.getAllChampionships().subscribe({
      next: (championships: Championship[]) => {
        const activeIds = (team.championshipsActive || []).map(String);
        const teamIdStr = String(team.id ?? '');

        const filtered = championships
          .filter((c) => {
            const matchByTeamArray = c.id !== undefined && activeIds.includes(String(c.id));
            const matchByChampArray = (c.teamsIDs || []).map(String).includes(teamIdStr);
            return matchByTeamArray || matchByChampArray;
          })
          .map((c) => ({
            ...c,
            category: c.type || 'AFA',
          }));

        this.teamChampionships.set(filtered);
      },
      error: (err) => console.error('Error cargando campeonatos del equipo:', err),
    });
  }

  private toSlug(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
