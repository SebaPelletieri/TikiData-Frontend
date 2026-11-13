import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-championship-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './championship-detail.html',
  styleUrls: ['./championship-detail.css'],
})
export class ChampionshipDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  public authService = inject(AuthService);

  private apiUrl = 'http://localhost:3000';

  championship = signal<any | null>(null);
  activeTab = signal<'general' | 'table' | 'matches' | 'scorers' | 'cards'>('general');

  // Datos completos del torneo
  fullStandings = signal<any[]>([]);
  allTournamentMatches = signal<any[]>([]);
  allScorers = signal<any[]>([]);
  allCards = signal<any[]>([]);

  // Vistas resumidas para la pestaña "Vista general"
  standings = computed(() => this.fullStandings().slice(0, 5));
  upcomingMatches = computed(() =>
    this.allTournamentMatches()
      .filter((m) => m.status !== 'Finalizado')
      .slice(0, 5),
  );
  topScorers = computed(() => this.allScorers().slice(0, 5));

  // Soporte para torneos con Zonas / Grupos (Copa de la Liga, Copa Libertadores, etc.)
  hasZones = computed(() => {
    const zones = this.championship()?.zones;
    return Array.isArray(zones) && zones.length > 0;
  });

  zoneTables = computed(() => {
    const zones = this.championship()?.zones;
    const allRows = this.fullStandings();

    if (!Array.isArray(zones) || zones.length === 0) return [];

    return zones.map((zone: any) => {
      const zoneIds = new Set((zone.teamIDs || []).map(String));

      const rows = allRows
        .filter((row) => zoneIds.has(String(row.teamId)))
        .map((row, idx) => ({
          ...row,
          position: idx + 1,
        }));

      return {
        zoneName: zone.name,
        rows,
      };
    });
  });

  // Filtro de zona en la pestaña "Tabla" ('ALL' muestra todas las zonas/grupos)
  selectedZone = signal<string>('ALL');

  filteredZoneTables = computed(() => {
    const selected = this.selectedZone();
    const tables = this.zoneTables();
    if (selected === 'ALL') return tables;
    return tables.filter((z) => z.zoneName === selected);
  });

  // Partidos agrupados por fecha/jornada (jugados y por jugar)
  // Partidos agrupados por fecha/jornada (jugados y por jugar)
  matchesByRound = computed(() => {
    const allMatches = this.allTournamentMatches();
    const groupsMap = new Map<string, { roundNum: number; matches: any[] }>();

    allMatches.forEach((m) => {
      let roundLabel = 'Sin fecha asignada';
      let roundNum = 999;

      // Intentamos obtener el número de fecha de múltiples propiedades posibles
      const rawRound = m.round ?? m.matchday ?? m.jornada ?? m.fecha;
      if (rawRound !== undefined && rawRound !== null && String(rawRound).trim() !== '') {
        const parsed = parseInt(String(rawRound).replace(/\D/g, ''), 10);
        if (!isNaN(parsed)) {
          roundNum = parsed;
          roundLabel = `Fecha ${roundNum}`;
        } else {
          roundLabel = String(rawRound);
        }
      } else if (m.championshipName) {
        // Buscar patrón tipo "Fecha X" o "Jornada X" en el nombre del campeonato o del partido
        const matchText = m.championshipName.match(/(?:fecha|jornada)\s*(\d+)/i);
        if (matchText && matchText[1]) {
          roundNum = parseInt(matchText[1], 10);
          roundLabel = `Fecha ${roundNum}`;
        }
      }

      if (!groupsMap.has(roundLabel)) {
        groupsMap.set(roundLabel, { roundNum, matches: [] });
      }
      groupsMap.get(roundLabel)!.matches.push(m);
    });

    return Array.from(groupsMap.entries())
      .map(([roundTitle, data]) => ({
        roundTitle,
        roundNum: data.roundNum,
        matches: data.matches,
      }))
      .sort((a, b) => a.roundNum - b.roundNum || a.roundTitle.localeCompare(b.roundTitle));
  });

  // Control del acordeón de fechas desplegadas
  expandedRounds = signal<Set<string>>(new Set());

  isFollowing = signal<boolean>(false);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const nameParam = params.get('name');
      if (nameParam) {
        const formattedName = nameParam.replace(/-/g, ' ');
        this.selectedZone.set('ALL');
        this.activeTab.set('general');
        this.loadChampionshipByName(formattedName);
      }
    });
  }

  openZoneTable(zoneName: string) {
    this.selectedZone.set(zoneName);
    this.activeTab.set('table');
  }

  toggleRound(roundTitle: string) {
    const current = new Set(this.expandedRounds());
    if (current.has(roundTitle)) {
      current.delete(roundTitle);
    } else {
      current.add(roundTitle);
    }
    this.expandedRounds.set(current);
  }

  isRoundExpanded(roundTitle: string): boolean {
    return this.expandedRounds().has(roundTitle);
  }

  private toSlug(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private loadChampionshipByName(searchName: string) {
    this.http.get<any[]>(`${this.apiUrl}/campeonatos`).subscribe({
      next: (champs) => {
        const targetSlug = this.toSlug(decodeURIComponent(searchName));
        const found = champs.find(
          (c) =>
            this.toSlug(c.name) === targetSlug ||
            this.toSlug(c.name).includes(targetSlug),
        );

        const champData = found || {
          id: 1,
          name: searchName.toUpperCase(),
          logo: 'https://via.placeholder.com/24',
          country: 'Argentina',
          type: 'LIGA',
          season: '2026',
        };

        this.championship.set(champData);

        const currentUser = (this.authService.currentUser as any)();
        if (currentUser && currentUser.favoriteChampionships) {
          const isFav = currentUser.favoriteChampionships.some(
            (id: any) => Number(id) === Number(champData.id),
          );
          this.isFollowing.set(isFav);
        }

        this.loadTournamentData(champData);
      },
      error: (err) => console.error('Error cargando campeonato:', err),
    });
  }

  private loadTournamentData(champ: any) {
    forkJoin({
      teams: this.http.get<any[]>(`${this.apiUrl}/equipos`),
      matches: this.http.get<any[]>(`${this.apiUrl}/partidos`),
      players: this.http.get<any[]>(`${this.apiUrl}/jugadores`),
    }).subscribe({
      next: ({ teams, matches, players }) => {
        const champIdStr = String(champ.id);
        const champNameClean = (champ.name || '').trim().toLowerCase();

        // 1. Filtrar partidos que pertenecen a este campeonato
        const champMatches = matches.filter((m) => {
          const byId =
            m.championshipID !== undefined &&
            String(m.championshipID) === champIdStr;
          const byName =
            m.championshipName &&
            m.championshipName.trim().toLowerCase() === champNameClean;
          return byId || byName;
        });

        // 2. Juntar todos los IDs explícitos (teamsIDs + los teamIDs adentro de cada zona/grupo)
        const zoneTeamIds = (champ.zones || []).flatMap((z: any) =>
          (z.teamIDs || []).map(String),
        );
        const explicitTeamIds = new Set([
          ...(champ.teamsIDs || []).map(String),
          ...zoneTeamIds,
        ]);

        const matchTeamIds = new Set<string>();
        champMatches.forEach((m) => {
          matchTeamIds.add(String(m.localTeamID));
          matchTeamIds.add(String(m.awayTeamID));
        });

        const participatingTeams = teams.filter((t) => {
          const tId = String(t.id);
          const inActiveArray = (t.championshipsActive || [])
            .map(String)
            .includes(champIdStr);
          return (
            inActiveArray ||
            explicitTeamIds.has(tId) ||
            matchTeamIds.has(tId)
          );
        });

        // 3. Filtrar partidos que suman para tabla (excluye cruces de eliminación directa si existen)
        const knockoutStages = ['octavos', 'cuartos', 'semifinal', 'final', 'playoff'];
        const tableMatches = champMatches.filter((m) => {
          if (!m.stage) return true;
          const stageLower = String(m.stage).toLowerCase();
          return !knockoutStages.some((k) => stageLower.includes(k));
        });

        // 4. Calcular Tabla de Posiciones
        this.buildStandingsTable(participatingTeams, tableMatches);

        // 5. Formatear lista completa de partidos del torneo
        this.buildMatchesList(champMatches, teams);

        // 6. Calcular Goleadores y Tarjetas aislados para ESTE campeonato
        const participatingIdsSet = new Set(participatingTeams.map((t) => String(t.id)));
        this.buildPlayerStats(players, participatingIdsSet, teams, champMatches, champ);
      },
      error: (err) => console.error('Error cargando datos del torneo:', err),
    });
  }

  private buildStandingsTable(teams: any[], champMatches: any[]) {
    const tableMap = new Map<string, any>();

    teams.forEach((t) => {
      tableMap.set(String(t.id), {
        teamId: t.id,
        name: t.name,
        shield: t.shield,
        pj: 0,
        g: 0,
        e: 0,
        p: 0,
        gf: 0,
        gc: 0,
        dg: 0,
        pts: 0,
      });
    });

    champMatches
      .filter((m) => m.status === 'Finalizado')
      .forEach((m) => {
        const localRow = tableMap.get(String(m.localTeamID));
        const awayRow = tableMap.get(String(m.awayTeamID));
        const localGoals = Number(m.localGoals ?? 0);
        const awayGoals = Number(m.awayGoals ?? 0);

        if (localRow && awayRow) {
          localRow.pj += 1;
          awayRow.pj += 1;

          localRow.gf += localGoals;
          localRow.gc += awayGoals;
          awayRow.gf += awayGoals;
          awayRow.gc += localGoals;

          if (localGoals > awayGoals) {
            localRow.g += 1;
            localRow.pts += 3;
            awayRow.p += 1;
          } else if (awayGoals > localGoals) {
            awayRow.g += 1;
            awayRow.pts += 3;
            localRow.p += 1;
          } else {
            localRow.e += 1;
            localRow.pts += 1;
            awayRow.e += 1;
            awayRow.pts += 1;
          }

          localRow.dg = localRow.gf - localRow.gc;
          awayRow.dg = awayRow.gf - awayRow.gc;
        }
      });

    const sorted = Array.from(tableMap.values())
      .sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.name.localeCompare(b.name);
      })
      .map((row, index) => ({
        ...row,
        position: index + 1,
      }));

    this.fullStandings.set(sorted);
  }

  private buildMatchesList(champMatches: any[], allTeams: any[]) {
    const formatted = [...champMatches]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((m) => {
        const local = allTeams.find((t) => String(t.id) === String(m.localTeamID));
        const away = allTeams.find((t) => String(t.id) === String(m.awayTeamID));
        const d = new Date(m.date);
        const dateFormatted = d.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'short',
        });

        return {
          ...m,
          date: dateFormatted,
          homeName: local?.name || `Equipo #${m.localTeamID}`,
          homeShield: local?.shield || '',
          awayName: away?.name || `Equipo #${m.awayTeamID}`,
          awayShield: away?.shield || '',
          score:
            m.status === 'Finalizado' || m.status === 'En Vivo'
              ? `${m.localGoals} - ${m.awayGoals}`
              : 'vs',
        };
      });

    this.allTournamentMatches.set(formatted);

    const groups = this.matchesByRound();
    if (groups.length > 0) {
      const defaultOpen = groups[groups.length - 1].roundTitle;
      this.expandedRounds.set(new Set([defaultOpen]));
    }
  }

  private buildPlayerStats(
    players: any[],
    participatingIdsSet: Set<string>,
    allTeams: any[],
    champMatches: any[],
    champ: any,
  ) {
    this.allScorers.set([]);
    this.allCards.set([]);

    const champIdStr = String(champ.id);
    const leaguePlayers = players.filter((p) =>
      participatingIdsSet.has(String(p.currentTeamID)),
    );

    const scorersMap = new Map<string, { name: string; teamName: string; photo?: string; goals: number }>();
    const cardsMap = new Map<string, { name: string; teamName: string; photo?: string; yellowCards: number; redCards: number }>();

    const findPlayerPhoto = (playerName: string, teamId: string): string | undefined => {
      const clean = playerName.trim().toLowerCase();
      const found = leaguePlayers.find(
        (p) =>
          String(p.currentTeamID) === teamId &&
          (p.name.toLowerCase() === clean || p.name.toLowerCase().includes(clean.split(' ').pop() || '')),
      );
      return found?.photo;
    };

    const addGoal = (playerName: string, teamId: string) => {
      if (!playerName) return;
      const team = allTeams.find((t) => String(t.id) === teamId);
      const teamName = team?.name || '';
      const key = `${playerName.trim().toLowerCase()}_${teamId}`;
      const existing = scorersMap.get(key);
      if (existing) {
        existing.goals += 1;
      } else {
        scorersMap.set(key, {
          name: playerName.trim(),
          teamName,
          photo: findPlayerPhoto(playerName, teamId),
          goals: 1,
        });
      }
    };

    const addCard = (playerName: string, teamId: string, cardType: 'YELLOW' | 'RED') => {
      if (!playerName) return;
      const team = allTeams.find((t) => String(t.id) === teamId);
      const teamName = team?.name || '';
      const key = `${playerName.trim().toLowerCase()}_${teamId}`;
      const existing = cardsMap.get(key) || {
        name: playerName.trim(),
        teamName,
        photo: findPlayerPhoto(playerName, teamId),
        yellowCards: 0,
        redCards: 0,
      };
      if (cardType === 'YELLOW') existing.yellowCards += 1;
      if (cardType === 'RED') existing.redCards += 1;
      cardsMap.set(key, existing);
    };

    champMatches.forEach((m) => {
      const localId = String(m.localTeamID);
      const awayId = String(m.awayTeamID);

      // 1. Goles desde localGoalsDetail y awayGoalsDetail
      (m.localGoalsDetail || []).forEach((g: any) => addGoal(g.player, localId));
      (m.awayGoalsDetail || []).forEach((g: any) => addGoal(g.player, awayId));

      // 2. Tarjetas desde incidences (ej: "Tarjeta Amarilla a G. Cano" o "Tarjeta Roja a M. Rojo")
      (m.incidences || []).forEach((inc: any) => {
        if (inc.type === 'YELLOW_CARD' || inc.type === 'RED_CARD') {
          const text: string = inc.text || '';
          const matchPlayer = text.match(/(?:a|para)\s+([^(]+)/i);
          if (matchPlayer && matchPlayer[1]) {
            const playerName = matchPlayer[1].trim();
            // Determinamos el equipo buscando en alineaciones o asignando al local por defecto
            const inAway = (m.lineups?.away || []).some((p: any) =>
              p.name.toLowerCase().includes(playerName.toLowerCase()),
            );
            const teamId = inAway ? awayId : localId;
            addCard(playerName, teamId, inc.type === 'YELLOW_CARD' ? 'YELLOW' : 'RED');
          }
        }
      });
    });

    // Respaldo para Liga Profesional (id "1") si aún no tiene goles cargados en partidos
    if (scorersMap.size === 0 && champIdStr === '1') {
      leaguePlayers
        .filter((p) => (p.goals || 0) > 0)
        .forEach((p) => {
          const team = allTeams.find((t) => String(t.id) === String(p.currentTeamID));
          scorersMap.set(`${p.id}`, {
            name: p.name,
            teamName: team?.name || p.teamName || '',
            photo: p.photo,
            goals: p.goals,
          });
        });
    }

    if (cardsMap.size === 0 && champIdStr === '1') {
      leaguePlayers
        .filter((p) => (p.yellowCards || 0) > 0 || (p.redCards || 0) > 0)
        .forEach((p) => {
          const team = allTeams.find((t) => String(t.id) === String(p.currentTeamID));
          cardsMap.set(`${p.id}`, {
            name: p.name,
            teamName: team?.name || p.teamName || '',
            photo: p.photo,
            yellowCards: p.yellowCards || 0,
            redCards: p.redCards || 0,
          });
        });
    }

    const scorers = Array.from(scorersMap.values())
      .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
      .map((item, idx) => ({
        position: idx + 1,
        ...item,
      }));

    const cards = Array.from(cardsMap.values())
      .sort(
        (a, b) =>
          b.redCards * 3 + b.yellowCards - (a.redCards * 3 + a.yellowCards) ||
          a.name.localeCompare(b.name),
      )
      .map((item, idx) => ({
        position: idx + 1,
        ...item,
      }));

    this.allScorers.set(scorers);
    this.allCards.set(cards);
  }

  setTab(tab: 'general' | 'table' | 'matches' | 'scorers' | 'cards') {
    if (tab === 'table') {
      this.selectedZone.set('ALL');
    }
    this.activeTab.set(tab);
  }

  toggleFollow() {
    const user = (this.authService.currentUser as any)();
    const champ = this.championship();

    if (!user || !user.id || !champ) return;

    const champId = Number(champ.id);
    const currentFavs: number[] = user.favoriteChampionships
      ? user.favoriteChampionships.map((id: any) => Number(id))
      : [];

    const updatedFavorites = this.isFollowing()
      ? currentFavs.filter((id) => id !== champId)
      : [...currentFavs, champId];

    this.isFollowing.set(!this.isFollowing());

    this.authService.updateUser(user.id, { favoriteChampionships: updatedFavorites }).subscribe({
      next: () => {
        console.log('Campeonatos favoritos actualizados en el servidor correctamente.');
      },
      error: (err) => {
        console.error('Error al actualizar campeonatos favoritos:', err);
        this.isFollowing.set(!this.isFollowing());
      },
    });
  }
}