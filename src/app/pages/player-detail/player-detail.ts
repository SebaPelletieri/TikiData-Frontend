import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PlayerDetail } from '../../components/player-detail/player-detail';
import { Player } from '../../models/Player';
import { Team } from '../../models/Team';
import { Match } from '../../models/Match';
import { PlayerService } from '../../services/player-service';
import { TeamService } from '../../services/team-service';
import { MatchService } from '../../services/match-service';

@Component({
  selector: 'app-player-detail-page',
  standalone: true,
  imports: [CommonModule, PlayerDetail],
  templateUrl: './player-detail.html',
  styleUrls: ['./player-detail.css'],
})
export class PlayerDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  public playerService = inject(PlayerService);
  private teamService = inject(TeamService);
  private matchService = inject(MatchService);

  playerActual = signal<Player | null>(null);
  playerTeam = signal<Team | null>(null);
  playerMatches = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const nameParam = params.get('name'); 
      if (nameParam) {
        this.loadPlayerByName(nameParam);
      }
    });
  }

  loadPlayerByName(nameSlug: string) {
    this.isLoading.set(true);
    this.playerActual.set(null);
    this.playerTeam.set(null);
    this.playerMatches.set([]);

    const cleanSearchName = nameSlug
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/-/g, ' ');

    this.playerService.getAllPlayers().subscribe({
      next: (players: Player[]) => {
        const found = players.find((p: any) => {
          if (!p.name) return false;
          const playerNameClean = p.name
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

          return playerNameClean === cleanSearchName;
        });

        if (found) {
          this.playerActual.set(found);
          this.playerService.playerActual.set(found);
          this.loadTeamData(found);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando jugador:', err);
        this.isLoading.set(false);
      },
    });
  }

  private loadTeamData(player: Player) {
    const teamId = player.currentTeamID;
    if (!teamId) return;

    this.teamService.getAllTeams().subscribe({
      next: (teams: Team[]) => {
        const team = teams.find((t) => String(t.id) === String(teamId)) ?? null;
        this.playerTeam.set(team);

        this.matchService.getAllMatches().subscribe({
          next: (matches: Match[]) => {
            const list = matches
              .filter(
                (m) =>
                  String(m.localTeamID) === String(teamId) ||
                  String(m.awayTeamID) === String(teamId),
              )
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((m) => {
                const local = teams.find((t) => String(t.id) === String(m.localTeamID));
                const away = teams.find((t) => String(t.id) === String(m.awayTeamID));
                const isPlayed = m.status === 'Finalizado' || m.status === 'En Vivo';

                return {
                  id: m.id,
                  date: m.date,
                  homeName: local?.name || `Equipo #${m.localTeamID}`,
                  homeShield: local?.shield || '',
                  awayName: away?.name || `Equipo #${m.awayTeamID}`,
                  awayShield: away?.shield || '',
                  score: isPlayed ? `${m.localGoals} - ${m.awayGoals}` : 'Por jugar',
                  tournament: m.championshipName || 'Torneo',
                };
              });

            this.playerMatches.set(list);
          },
          error: (err) => console.error('Error cargando partidos del jugador:', err),
        });
      },
      error: (err) => console.error('Error cargando el equipo del jugador:', err),
    });
  }
}