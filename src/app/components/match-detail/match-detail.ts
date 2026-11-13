import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Match, LineupPlayer, MatchLineups, H2HSummary } from '../../models/Match';
import { Team } from '../../models/Team';
import { Player } from '../../models/Player';
import { Championship } from '../../models/Championship';

export interface StandingRow {
  teamId: number;
  teamName: string;
  shield: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

@Component({
  selector: 'app-match-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './match-detail.html',
  styleUrl: './match-detail.css',
})
export class MatchDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  match = signal<Match | null>(null);
  localTeam = signal<Team | null>(null);
  awayTeam = signal<Team | null>(null);
  championship = signal<Championship | null>(null);
  dynamicLineups = signal<MatchLineups | null>(null);
  allTeams = signal<Team[]>([]);
  championshipMatches = signal<Match[]>([]);
  activeTab = signal<string>('Resumen');
  errorLoading = signal<boolean>(false);

  // Acceso tipado al historial cara a cara (h2h) del JSON
  h2hData = computed<H2HSummary | null>(() => {
    const m = this.match() as any;
    return m?.h2h ?? null;
  });

  // Cálculo automático y blindado de la tabla de posiciones del campeonato
  standings = computed<StandingRow[]>(() => {
    const currentMatch = this.match();
    if (!currentMatch) return [];

    const champId = Number(currentMatch.championshipID);
    const matchesInChamp = this.championshipMatches();

    // 1. Buscamos equipos inscritos en ese championshipID
    let teamsInChamp = this.allTeams().filter(
      (t: any) =>
        Array.isArray(t.championshipsActive) &&
        t.championshipsActive.map(Number).includes(champId)
    );

    // 2. Respaldo: si ningún equipo tiene ese ID en championshipsActive,
    // tomamos los equipos que disputan partidos en ese campeonato
    if (teamsInChamp.length === 0) {
      const teamIdsFromMatches = new Set<number>();
      matchesInChamp.forEach((m) => {
        teamIdsFromMatches.add(Number(m.localTeamID));
        teamIdsFromMatches.add(Number(m.awayTeamID));
      });
      teamsInChamp = this.allTeams().filter((t: any) => teamIdsFromMatches.has(Number(t.id)));
    }

    const tableMap = new Map<number, StandingRow>();
    teamsInChamp.forEach((t: any) => {
      const id = Number(t.id);
      tableMap.set(id, {
        teamId: id,
        teamName: t.name,
        shield: t.shield,
        pj: 0,
        pg: 0,
        pe: 0,
        pp: 0,
        gf: 0,
        gc: 0,
        dg: 0,
        pts: 0,
      });
    });

    // Procesamos partidos Finalizados o En Vivo de este campeonato
    matchesInChamp
      .filter((m) => m.status === 'Finalizado' || m.status === 'En Vivo')
      .forEach((m) => {
        const localId = Number(m.localTeamID);
        const awayId = Number(m.awayTeamID);
        const localRow = tableMap.get(localId);
        const awayRow = tableMap.get(awayId);

        if (localRow && awayRow) {
          localRow.pj++;
          awayRow.pj++;
          localRow.gf += m.localGoals;
          localRow.gc += m.awayGoals;
          awayRow.gf += m.awayGoals;
          awayRow.gc += m.localGoals;

          if (m.localGoals > m.awayGoals) {
            localRow.pg++;
            localRow.pts += 3;
            awayRow.pp++;
          } else if (m.localGoals < m.awayGoals) {
            awayRow.pg++;
            awayRow.pts += 3;
            localRow.pp++;
          } else {
            localRow.pe++;
            awayRow.pe++;
            localRow.pts += 1;
            awayRow.pts += 1;
          }

          localRow.dg = localRow.gf - localRow.gc;
          awayRow.dg = awayRow.gf - awayRow.gc;
        }
      });

    return Array.from(tableMap.values()).sort(
      (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.teamName.localeCompare(b.teamName)
    );
  });

  ngOnInit(): void {
  this.route.paramMap.subscribe((params) => {
    const matchId = params.get('id');
    if (matchId) {
      this.http.get<Match>(`http://localhost:3000/partidos/${matchId}?_expand=championship`).subscribe({
        next: (data) => {
          this.match.set(data);
          this.loadTeamDetails(data.localTeamID, data.awayTeamID);
          this.loadTeamPlayers(data);
          
          // Validación segura del ID del campeonato antes de invocar los métodos
          if (data.championshipID) {
            this.loadChampionshipDetails(data.championshipID);
            this.loadStandingsData(data.championshipID);
          }
        },
        error: (err) => {
          console.error('Error al cargar el partido:', err);
          this.errorLoading.set(true);
        },
      });
    }
  });
}

  setTab(tab: string): void {
    this.activeTab.set(tab);
  }

  isMatchTeam(teamId: number): boolean {
    const m = this.match();
    if (!m) return false;
    return Number(m.localTeamID) === Number(teamId) || Number(m.awayTeamID) === Number(teamId);
  }

  getCountryFlag(country?: string): string {
    if (!country) return '🏳️';
    const c = country.toUpperCase();
    if (c.includes('ARG') || c === 'AR') return '🇦🇷';
    if (c.includes('BRA') || c === 'BR') return '🇧🇷';
    if (c.includes('URU') || c === 'UY') return '🇺🇾';
    if (c.includes('COL') || c === 'CO') return '🇨🇴';
    if (c.includes('CHI') || c === 'CL') return '🇨🇱';
    return '🏳️';
  }

  private loadStandingsData(champId: number): void {
    this.http.get<Team[]>('http://localhost:3000/equipos').subscribe({
      next: (teams) => this.allTeams.set(teams),
      error: (err) => console.error('Error al cargar equipos para la tabla:', err),
    });

    this.http.get<Match[]>(`http://localhost:3000/partidos?championshipID=${champId}`).subscribe({
      next: (matches) => this.championshipMatches.set(matches),
      error: (err) => console.error('Error al cargar partidos para la tabla:', err),
    });
  }

  private loadTeamPlayers(matchData: Match): void {
    const localId = matchData.localTeamID;
    const awayId = matchData.awayTeamID;

    this.http.get<Player[]>(`http://localhost:3000/jugadores?currentTeamID=${localId}`).subscribe({
      next: (localPlayers) => {
        this.http.get<Player[]>(`http://localhost:3000/jugadores?currentTeamID=${awayId}`).subscribe({
          next: (awayPlayers) => {
            if (localPlayers.length > 0 || awayPlayers.length > 0) {
              const mapPlayer = (p: Player, idx: number): LineupPlayer => ({
                number: p.dorsals?.[localId] ?? p.dorsals?.[awayId] ?? idx + 1,
                name: p.name,
                position: p.position,
              });

              const mappedLocal = localPlayers.map((p, i) => mapPlayer(p, i));
              const mappedAway = awayPlayers.map((p, i) => mapPlayer(p, i));

              this.dynamicLineups.set({
                local: mappedLocal.slice(0, 11),
                localSubstitutes: mappedLocal.slice(11),
                away: mappedAway.slice(0, 11),
                awaySubstitutes: mappedAway.slice(11),
              });
            } else {
              this.dynamicLineups.set(matchData.lineups ?? null);
            }
          },
        });
      },
    });
  }

  private loadTeamDetails(localId: number, awayId: number): void {
    this.http.get<Team>(`http://localhost:3000/equipos/${localId}`).subscribe({
      next: (t) => this.localTeam.set(t),
      error: (err) => console.error('Error al cargar equipo local:', err),
    });

    this.http.get<Team>(`http://localhost:3000/equipos/${awayId}`).subscribe({
      next: (t) => this.awayTeam.set(t),
      error: (err) => console.error('Error al cargar equipo visitante:', err),
    });
  }

  private loadChampionshipDetails(champId: number): void {
    this.http.get<Championship>(`http://localhost:3000/campeonatos/${champId}`).subscribe({
      next: (c) => this.championship.set(c),
      error: (err) => console.error('Error al cargar campeonato:', err),
    });
  }
}