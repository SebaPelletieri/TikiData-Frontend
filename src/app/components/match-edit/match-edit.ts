import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { localizedMonths } from '../../i18n/months';
import { LanguageService } from '../../i18n/language-service';
import { TranslocoService } from '@jsverse/transloco';
import { TranslocoPipe } from '@jsverse/transloco';
import { IncidencePipe } from '../../i18n/data.pipes';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchService } from '../../services/match-service';
import { TeamService } from '../../services/team-service';
import { ChampionshipService } from '../../services/championship-service';
import { PlayerService } from '../../services/player-service';
import { Player } from '../../models/Player';
import { Team } from '../../models/Team';
import { Championship } from '../../models/Championship';
import { GoalDetail, LineupPlayer, MatchLineups } from '../../models/Match';

interface CalendarDay {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
}

type TeamSide = 'local' | 'away';
type IncidenceKind = 'YELLOW_CARD' | 'RED_CARD' | 'GOAL';

// Incidencia con los datos extra necesarios para validar reglas (equipo y jugador)
interface MatchIncidence {
  minute: number;
  type: string; // YELLOW_CARD | RED_CARD | GOAL | SUBSTITUTION
  text: string;
  team?: TeamSide;
  player?: string;
  playerOut?: string;
  playerIn?: string;
}

interface PlayerOption {
  name: string;
  label: string;
}

// Jugador del plantel ya normalizado (dorsal según el equipo)
interface RosterPlayer {
  id?: number | string;
  name: string;
  number?: number;
  position?: string;
}

// Incidencia lista para mostrar en la columna de su equipo
interface TeamEvent {
  index: number; // posición real dentro de this.incidences (para poder borrarla)
  inc: MatchIncidence;
  team: TeamSide | null;
  player: string;
  playerOut: string;
  playerIn: string;
  score?: string; // solo goles: cómo queda el resultado
}

const POSITION_ORDER: Record<string, number> = { ARQ: 0, POR: 0, DEF: 1, MED: 2, DEL: 3 };

@Component({
  selector: 'app-match-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslocoPipe, IncidencePipe],
  templateUrl: './match-edit.html',
  styleUrl: './match-edit.css',
})
export class MatchEdit implements OnInit {
  @Input() matchIdInput!: number | string;
  @Output() closePanel = new EventEmitter<void>();

  private language = inject(LanguageService);

  private i18n = inject(TranslocoService);

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private matchService = inject(MatchService);
  private teamService = inject(TeamService);
  private championshipService = inject(ChampionshipService);
  private playerService = inject(PlayerService);
  private cdr = inject(ChangeDetectorRef);

  // Todos los jugadores (se piden una sola vez y se filtran por equipo)
  private allPlayers: Player[] | null = null;
  private pendingRosters: { teamId: number | string; type: TeamSide }[] = [];

  matchForm!: FormGroup;
  matchId: number | string | null = null;
  loadedMatchData: any = null;

  allTeams: Team[] = [];
  allChampionships: Championship[] = [];
  allStadiums: string[] = [
    'Estadio Monumental',
    'La Bombonera',
    'Estadio Libertadores de América',
    'Estadio Cilindro de Avellaneda',
    'Estadio Único Diego Armando Maradona',
    'Estadio Mario Alberto Kempes',
    'Estadio José Amalfitani',
    'Estadio Monumental de Victoria',
    'Estadio Maracaná',
  ];

  localTeamRoster: RosterPlayer[] = [];
  awayTeamRoster: RosterPlayer[] = [];
  readonly MAX_STARTERS = 11;
  readonly sides: TeamSide[] = ['local', 'away'];

  // Desplegable de jugadores del plantel (Formaciones)
  openRosterMenu: TeamSide | null = null;
  rosterSelection: Record<TeamSide, string> = { local: '', away: '' };

  localGoalsDetail: GoalDetail[] = [];
  awayGoalsDetail: GoalDetail[] = [];
  incidences: MatchIncidence[] = [];

  lineups: MatchLineups = {
    local: [],
    away: [],
    localSubstitutes: [],
    awaySubstitutes: [],
  };

  // Menús desplegables personalizados de las cajas de Sustituciones e Incidencias
  openMenu: 'incType' | 'incTeam' | 'subTeam' | null = null;

  // --- Incidencias (Tarjeta amarilla, Tarjeta roja, Gol) ---
  newIncidenceType: IncidenceKind = 'YELLOW_CARD';
  newIncidenceTeam: TeamSide = 'local';
  newIncidenceMinute: number | null = null;
  newIncidencePlayer = '';
  incPlayerSearchCtrl = new FormControl('');
  isIncPlayerOpen = false;

  // --- Sustituciones ---
  newSubTeam: TeamSide = 'local';
  newSubMinute: number | null = null;
  newSubOut = '';
  newSubIn = '';
  subOutSearchCtrl = new FormControl('');
  subInSearchCtrl = new FormControl('');
  isSubOutOpen = false;
  isSubInOpen = false;

  // Calendario
  isCalendarOpen = false;
  isMonthOpen = false;
  isYearOpen = false;
  isTimeOpen = false;

  selectedDate: Date | null = null;
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  selectedHour: string = '12';
  selectedMinute: string = '00';
  today: Date = new Date();

  // Nombres de los meses en el idioma elegido (antes estaban fijos en español)

  get months(): string[] {

    return localizedMonths(this.language.locale());

  }
  weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  get yearsList(): number[] {
    const current = new Date().getFullYear();
    const years: number[] = [];
    for (let y = current; y <= current + 5; y++) years.push(y);
    return years;
  }

  hoursList: string[] = [
    '00',
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
  ];

  // Buscadores
  championshipSearchCtrl = new FormControl('');
  filteredChampionships: Championship[] = [];
  isChampDropdownOpen = false;

  localSearchCtrl = new FormControl('');
  filteredLocalTeams: Team[] = [];
  isLocalDropdownOpen = false;

  visitorSearchCtrl = new FormControl('');
  filteredVisitorTeams: Team[] = [];
  isVisitorDropdownOpen = false;

  stadiumSearchCtrl = new FormControl('');
  filteredStadiums: string[] = [];
  isStadiumDropdownOpen = false;

  statuses = ['Programado', 'En Vivo', 'Finalizado'];
  isStatusOpen = false;

  ngOnInit(): void {
    this.today.setHours(0, 0, 0, 0);
    this.initForm();

    this.playerService.getAllPlayers().subscribe({
      next: (players: Player[]) => {
        this.allPlayers = players || [];
        // Planteles que se pidieron antes de que llegaran los jugadores
        this.pendingRosters.forEach((r) => this.loadRosterForTeam(r.teamId, r.type));
        this.pendingRosters = [];
      },
      error: (err) => console.error('Error al cargar jugadores:', err),
    });

    this.teamService.getAllTeams().subscribe({
      next: (teams: Team[]) => {
        this.allTeams = teams;
        this.tryResolveNames();
      },
    });

    this.championshipService.getAllChampionships().subscribe({
      next: (champs: Championship[]) => {
        this.allChampionships = champs;
        this.tryResolveNames();
      },
    });

    if (this.matchIdInput) {
      this.matchId = this.matchIdInput;
      this.loadMatchData(this.matchId);
    } else {
      this.route.data.subscribe((data) => {
        const id = data['id'] ?? this.route.snapshot.paramMap.get('id');
        if (id) {
          this.matchId = id;
          this.loadMatchData(id);
        }
      });
    }

    this.championshipSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      this.filteredChampionships = q
        ? this.allChampionships.filter((c) => c.name.toLowerCase().includes(q))
        : [];
      this.isChampDropdownOpen = this.filteredChampionships.length > 0;
    });

    this.localSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      this.filteredLocalTeams = q
        ? this.allTeams.filter((t) => t.name.toLowerCase().includes(q))
        : [];
      this.isLocalDropdownOpen = this.filteredLocalTeams.length > 0;
    });

    this.visitorSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      this.filteredVisitorTeams = q
        ? this.allTeams.filter((t) => t.name.toLowerCase().includes(q))
        : [];
      this.isVisitorDropdownOpen = this.filteredVisitorTeams.length > 0;
    });

    this.stadiumSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      this.matchForm.get('stadium')?.setValue(query);
      this.filteredStadiums = q ? this.allStadiums.filter((s) => s.toLowerCase().includes(q)) : [];
      this.isStadiumDropdownOpen = this.filteredStadiums.length > 0;
    });

    // Si el usuario escribe en un buscador de jugadores, se descarta la selección anterior:
    // solo se puede confirmar un jugador eligiéndolo de la lista (así no se puede escribir
    // a mano el nombre de alguien excluido).
    this.incPlayerSearchCtrl.valueChanges.subscribe(() => {
      this.newIncidencePlayer = '';
      this.isIncPlayerOpen = true;
    });
    this.subOutSearchCtrl.valueChanges.subscribe(() => {
      this.newSubOut = '';
      this.isSubOutOpen = true;
    });
    this.subInSearchCtrl.valueChanges.subscribe(() => {
      this.newSubIn = '';
      this.isSubInOpen = true;
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.championship-group')) this.isChampDropdownOpen = false;
    if (!target.closest('.local-group')) this.isLocalDropdownOpen = false;
    if (!target.closest('.visitor-group')) this.isVisitorDropdownOpen = false;
    if (!target.closest('.stadium-group')) this.isStadiumDropdownOpen = false;
    if (!target.closest('.status-group')) this.isStatusOpen = false;
    if (!target.closest('.menu-dropdown')) this.openMenu = null;
    if (!target.closest('.roster-dropdown')) this.openRosterMenu = null;
    if (!target.closest('.inc-player-group')) this.isIncPlayerOpen = false;
    if (!target.closest('.sub-out-group')) this.isSubOutOpen = false;
    if (!target.closest('.sub-in-group')) this.isSubInOpen = false;
    if (!target.closest('.calendar-field-container')) {
      this.isCalendarOpen = this.isMonthOpen = this.isYearOpen = this.isTimeOpen = false;
    }
  }

  initForm() {
    this.matchForm = this.fb.group({
      championshipID: [null, Validators.required],
      date: ['', Validators.required],
      localTeamID: [null, Validators.required],
      awayTeamID: [null, Validators.required],
      stadium: ['', Validators.required],
      status: ['Programado', Validators.required],
      localGoals: [0, [Validators.required, Validators.min(0)]],
      awayGoals: [0, [Validators.required, Validators.min(0)]],
    });
  }

  loadMatchData(id: number | string) {
    this.matchService.getById(id).subscribe({
      next: (match: any) => {
        if (match) {
          this.loadedMatchData = match;
          const rawDate = match.date || match.matchDate || '';
          const formattedDate = rawDate ? String(rawDate).substring(0, 16) : '';

          this.matchForm.patchValue({
            championshipID: match.championshipID || match.championshipId,
            date: formattedDate,
            localTeamID: match.localTeamID,
            awayTeamID: match.awayTeamID,
            stadium: match.stadium || '',
            status: match.status || 'Programado',
            localGoals: match.localGoals ?? 0,
            awayGoals: match.awayGoals ?? 0,
          });

          this.localGoalsDetail = match.localGoalsDetail || [];
          this.awayGoalsDetail = match.awayGoalsDetail || [];
          this.incidences = match.incidences || [];
          this.lineups = match.lineups || {
            local: [],
            away: [],
            localSubstitutes: [],
            awaySubstitutes: [],
          };

          if (match.localTeamID) this.loadRosterForTeam(match.localTeamID, 'local');
          if (match.awayTeamID) this.loadRosterForTeam(match.awayTeamID, 'away');

          if (formattedDate) {
            const d = new Date(formattedDate);
            if (!isNaN(d.getTime())) {
              this.selectedDate = d;
              this.currentMonth = d.getMonth();
              this.currentYear = d.getFullYear();
              this.selectedHour = String(d.getHours()).padStart(2, '0');
              this.selectedMinute = String(d.getMinutes()).padStart(2, '0');
            }
          }
          this.tryResolveNames();
          this.cdr.markForCheck();
        }
      },
    });
  }

  // Los equipos no guardan sus jugadores: cada jugador apunta a su equipo con currentTeamID
  loadRosterForTeam(teamId: number | string | undefined, type: TeamSide) {
    if (!teamId) return;

    if (!this.allPlayers) {
      this.pendingRosters = this.pendingRosters.filter((r) => r.type !== type);
      this.pendingRosters.push({ teamId, type });
      return;
    }

    const roster: RosterPlayer[] = this.allPlayers
      .filter((p) => String(p.currentTeamID) === String(teamId))
      .map((p) => ({
        id: p.id,
        name: p.name,
        number: p.dorsals?.[Number(teamId)] ?? undefined,
        position: p.position,
      }))
      .sort(
        (a, b) =>
          (POSITION_ORDER[a.position || ''] ?? 9) - (POSITION_ORDER[b.position || ''] ?? 9) ||
          (a.number ?? 999) - (b.number ?? 999) ||
          a.name.localeCompare(b.name, 'es'),
      );

    if (type === 'local') this.localTeamRoster = roster;
    else this.awayTeamRoster = roster;
    this.cdr.markForCheck();
  }

  // Jugadores del plantel que todavía no están en la formación (para el selector)
  availableRoster(team: TeamSide): RosterPlayer[] {
    const used = new Set(
      [...this.startersOf(team), ...this.substitutesOf(team)].map((p) => this.playerName(p)),
    );
    return this.rosterOf(team).filter((p) => !used.has(p.name));
  }

  toggleRosterMenu(side: TeamSide, event: MouseEvent) {
    event.stopPropagation();
    this.openRosterMenu = this.openRosterMenu === side ? null : side;
    this.openMenu = null;
  }

  selectRosterPlayer(side: TeamSide, name: string) {
    this.rosterSelection[side] = name;
    this.openRosterMenu = null;
  }

  rosterSelectionLabel(side: TeamSide): string {
    const name = this.rosterSelection[side];
    if (!name) {
      return this.availableRoster(side).length
        ? this.i18n.translate('ui.seleccionarJugadorDelPlantel')
        : this.i18n.translate('ui.noQuedanJugadoresDisponibles');
    }
    const p = this.rosterOf(side).find((r) => r.name === name);
    return (p?.number ? `#${p.number} · ` : '') + name + (p?.position ? ` (${p.position})` : '');
  }

  addSelectedToLineup(side: TeamSide, listType: 'starters' | 'substitutes') {
    const name = this.rosterSelection[side];
    if (!name) return;
    this.addLineupPlayer(side, listType, name);
    this.rosterSelection[side] = '';
  }

  startersList(team: TeamSide): LineupPlayer[] {
    return this.startersOf(team);
  }

  substitutesList(team: TeamSide): LineupPlayer[] {
    return this.substitutesOf(team);
  }

  hasRosterTeam(team: TeamSide): boolean {
    return !!(team === 'local'
      ? this.matchForm.get('localTeamID')?.value
      : this.matchForm.get('awayTeamID')?.value);
  }

  displayTeamName(team: TeamSide): string {
    return this.teamName(team) || (team === 'local' ? this.i18n.translate('ui.equipoLocal2') : this.i18n.translate('ui.equipoVisitante2'));
  }

  teamShield(team: TeamSide): string {
    const id = this.matchForm.get(team === 'local' ? 'localTeamID' : 'awayTeamID')?.value;
    return this.allTeams.find((t) => String(t.id) === String(id))?.shield || '';
  }

  tryResolveNames() {
    if (!this.loadedMatchData) return;
    const match = this.loadedMatchData;
    const champId = match.championshipID || match.championshipId;
    if (champId && this.allChampionships.length) {
      const found = this.allChampionships.find((c) => c.id == champId);
      if (found) this.championshipSearchCtrl.setValue(found.name, { emitEvent: false });
    }
    const homeId = match.localTeamID;
    if (homeId && this.allTeams.length) {
      const found = this.allTeams.find((t) => t.id == homeId);
      if (found) this.localSearchCtrl.setValue(found.name, { emitEvent: false });
    }
    const awayId = match.awayTeamID;
    if (awayId && this.allTeams.length) {
      const found = this.allTeams.find((t) => t.id == awayId);
      if (found) this.visitorSearchCtrl.setValue(found.name, { emitEvent: false });
    }
    if (match.stadium) this.stadiumSearchCtrl.setValue(match.stadium, { emitEvent: false });
  }

  // =====================================================================
  // Helpers de jugadores y reglas
  // =====================================================================
  private playerName(p: any): string {
    return String(p?.name || p?.nombre || '').trim();
  }

  private playerLabel(p: any): string {
    const n = p?.number || p?.dorsal;
    return (n ? `#${n} - ` : '') + this.playerName(p);
  }

  private rosterOf(team: TeamSide): RosterPlayer[] {
    return (team === 'local' ? this.localTeamRoster : this.awayTeamRoster) || [];
  }

  private startersOf(team: TeamSide): LineupPlayer[] {
    return (team === 'local' ? this.lineups.local : this.lineups.away) || [];
  }

  private substitutesOf(team: TeamSide): LineupPlayer[] {
    return (team === 'local' ? this.lineups.localSubstitutes : this.lineups.awaySubstitutes) || [];
  }

  private teamName(team: TeamSide): string {
    return (team === 'local' ? this.localSearchCtrl.value : this.visitorSearchCtrl.value) || '';
  }

  // =====================================================================
  // Lectura de incidencias (las cargadas antes solo tienen "text")
  // =====================================================================
  private normalize(s: string): string {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9' ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** "M. Falcón" coincide con "Matías Falcón" (mismo apellido e inicial). */
  private nameMatches(a: string, b: string): boolean {
    const na = this.normalize(a);
    const nb = this.normalize(b);
    if (!na || !nb) return false;
    if (na === nb) return true;
    const pa = na.split(' ');
    const pb = nb.split(' ');
    const sameSurname = pa[pa.length - 1] === pb[pb.length - 1];
    const sameInitial = pa[0][0] === pb[0][0];
    return (
      sameSurname &&
      sameInitial &&
      (pa.length === 1 || pb.length === 1 || pa[0].length <= 2 || pb[0].length <= 2)
    );
  }

  /** "Vélez" coincide con "Vélez Sarsfield", "Newell's" con "Newell's Old Boys", etc. */
  private sideByTeamName(name: string): TeamSide | null {
    const n = this.normalize(name);
    if (!n) return null;
    for (const side of this.sides) {
      const t = this.normalize(this.teamName(side));
      if (t && (t === n || t.includes(n) || n.includes(t))) return side;
    }
    return null;
  }

  private sideByPlayer(name: string): TeamSide | null {
    if (!name) return null;
    for (const side of this.sides) {
      const pool = [...this.startersOf(side), ...this.substitutesOf(side), ...this.rosterOf(side)];
      if (pool.some((p) => this.nameMatches(this.playerName(p), name))) return side;
    }
    return null;
  }

  /** Datos de la incidencia: los campos propios o, si no están, sacados del texto. */
  private parseIncidence(inc: MatchIncidence): {
    team: TeamSide | null;
    player: string;
    playerOut: string;
    playerIn: string;
  } {
    const text = (inc.text || '').trim();
    let player = inc.player || '';
    let playerOut = inc.playerOut || '';
    let playerIn = inc.playerIn || '';
    let teamHint = '';
    let m: RegExpMatchArray | null;

    if (inc.type === 'GOAL' && !player) {
      if ((m = text.match(/^Gol de (.+?)\s*\(/i)) || (m = text.match(/^Gol de (.+)$/i)))
        player = m[1];
    } else if (inc.type === 'YELLOW_CARD' || inc.type === 'RED_CARD') {
      if (!player) {
        if ((m = text.match(/^Tarjeta \w+ (?:a|para) (.+?)\s*\((.+)\)$/i))) {
          player = m[1];
          teamHint = m[2];
        } else if ((m = text.match(/^Tarjeta \w+ (?:a|para) (.+)$/i))) {
          player = m[1];
        } else if ((m = text.match(/^Tarjeta \w+ en (.+)$/i))) {
          teamHint = m[1];
        }
      }
    } else if (inc.type === 'SUBSTITUTION' && (!playerOut || !playerIn)) {
      if ((m = text.match(/^Cambio en (.+?):\s*Entra (.+?),\s*sale (.+)$/i))) {
        teamHint = m[1];
        playerIn = m[2];
        playerOut = m[3];
      } else if ((m = text.match(/^Sale (.+?),\s*entra (.+)$/i))) {
        playerOut = m[1];
        playerIn = m[2];
      }
    }

    let team: TeamSide | null = inc.team || null;
    if (!team && teamHint) team = this.sideByTeamName(teamHint);
    if (!team && inc.type === 'GOAL' && player) {
      const inLocal = this.localGoalsDetail.some(
        (g) => g.minute === inc.minute && this.nameMatches(g.player, player),
      );
      const inAway = this.awayGoalsDetail.some(
        (g) => g.minute === inc.minute && this.nameMatches(g.player, player),
      );
      if (inLocal !== inAway) team = inLocal ? 'local' : 'away';
    }
    if (!team) team = this.sideByPlayer(player || playerOut || playerIn);

    return { team, player, playerOut, playerIn };
  }

  /** Expulsado: tiene roja, o ya acumuló 2 amarillas. */
  isSentOff(team: TeamSide, name: string): boolean {
    const mine = this.incidences
      .map((i) => ({ i, d: this.parseIncidence(i) }))
      .filter((x) => x.d.team === team && this.nameMatches(x.d.player, name));
    if (mine.some((x) => x.i.type === 'RED_CARD')) return true;
    return mine.filter((x) => x.i.type === 'YELLOW_CARD').length >= 2;
  }

  private hasLeftPitch(team: TeamSide, name: string): boolean {
    return this.incidences.some((i) => {
      if (i.type !== 'SUBSTITUTION') return false;
      const d = this.parseIncidence(i);
      return d.team === team && this.nameMatches(d.playerOut, name);
    });
  }

  private hasEnteredPitch(team: TeamSide, name: string): boolean {
    return this.incidences.some((i) => {
      if (i.type !== 'SUBSTITUTION') return false;
      const d = this.parseIncidence(i);
      return d.team === team && this.nameMatches(d.playerIn, name);
    });
  }

  // =====================================================================
  // Eventos agrupados por equipo (para las listas de Incidencias y Sustituciones)
  // =====================================================================
  private get allEvents(): TeamEvent[] {
    const events: TeamEvent[] = this.incidences.map((inc, index) => {
      const d = this.parseIncidence(inc);
      return { index, inc, ...d };
    });

    // Resultado parcial de cada gol, recorriendo los goles en orden de minuto
    let local = 0;
    let away = 0;
    events
      .filter((e) => e.inc.type === 'GOAL')
      .sort((a, b) => a.inc.minute - b.inc.minute || a.index - b.index)
      .forEach((e) => {
        if (e.team === 'local') local++;
        else if (e.team === 'away') away++;
        else {
          // Sin equipo conocido: se usa el resultado que traía el texto, si lo tiene
          const m = (e.inc.text || '').match(/\((\d+)\s*[-–]\s*(\d+)\)/);
          if (m) {
            local = Number(m[1]);
            away = Number(m[2]);
          }
        }
        e.score = `${local} - ${away}`;
      });

    return events.sort((a, b) => a.inc.minute - b.inc.minute || a.index - b.index);
  }

  teamIncidenceEvents(side: TeamSide): TeamEvent[] {
    return this.allEvents.filter((e) => e.inc.type !== 'SUBSTITUTION' && e.team === side);
  }

  teamSubstitutionEvents(side: TeamSide): TeamEvent[] {
    return this.allEvents.filter((e) => e.inc.type === 'SUBSTITUTION' && e.team === side);
  }

  get unassignedIncidenceEvents(): TeamEvent[] {
    return this.allEvents.filter((e) => e.inc.type !== 'SUBSTITUTION' && !e.team);
  }

  get unassignedSubstitutionEvents(): TeamEvent[] {
    return this.allEvents.filter((e) => e.inc.type === 'SUBSTITUTION' && !e.team);
  }

  private filterByQuery(items: PlayerOption[], selectedName: string, query: string | null) {
    // Si ya hay un jugador elegido se muestra la lista completa al volver a abrir
    const q = selectedName ? '' : (query || '').toLowerCase().trim();
    return q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
  }

  private toOption(p: LineupPlayer): PlayerOption {
    return { name: this.playerName(p), label: this.playerLabel(p) };
  }

  /** Citados: titulares + suplentes, sin expulsados (roja o doble amarilla). */
  private calledUpOptions(team: TeamSide): PlayerOption[] {
    return [...this.startersOf(team), ...this.substitutesOf(team)]
      .map((p) => this.toOption(p))
      .filter((c) => c.name && !this.isSentOff(team, c.name));
  }

  /**
   * En cancha: titulares que no salieron + suplentes que entraron y no volvieron a salir,
   * sin expulsados.
   */
  private onPitchOptions(team: TeamSide): PlayerOption[] {
    const starters = this.startersOf(team)
      .map((p) => this.toOption(p))
      .filter((c) => c.name && !this.hasLeftPitch(team, c.name));
    const enteredSubs = this.substitutesOf(team)
      .map((p) => this.toOption(p))
      .filter(
        (c) => c.name && this.hasEnteredPitch(team, c.name) && !this.hasLeftPitch(team, c.name),
      );
    return [...starters, ...enteredSubs].filter((c) => !this.isSentOff(team, c.name));
  }

  /** En el banco: suplentes que nunca entraron, sin expulsados. */
  private benchOptions(team: TeamSide): PlayerOption[] {
    return this.substitutesOf(team)
      .map((p) => this.toOption(p))
      .filter(
        (c) =>
          c.name &&
          !this.hasEnteredPitch(team, c.name) &&
          !this.hasLeftPitch(team, c.name) &&
          !this.isSentOff(team, c.name),
      );
  }

  // Amarilla / Roja: todos los citados. Gol: solo los que están en cancha.
  private incPlayerPool(): PlayerOption[] {
    const team = this.newIncidenceTeam;
    return this.newIncidenceType === 'GOAL'
      ? this.onPitchOptions(team)
      : this.calledUpOptions(team);
  }

  get incPlayerCandidates(): PlayerOption[] {
    return this.filterByQuery(
      this.incPlayerPool(),
      this.newIncidencePlayer,
      this.incPlayerSearchCtrl.value,
    );
  }

  // Sale: jugadores que están en cancha en este momento
  get subOutCandidates(): PlayerOption[] {
    return this.filterByQuery(
      this.onPitchOptions(this.newSubTeam),
      this.newSubOut,
      this.subOutSearchCtrl.value,
    );
  }

  // Entra: suplentes que siguen en el banco (nunca entraron ni salieron)
  get subInCandidates(): PlayerOption[] {
    return this.filterByQuery(
      this.benchOptions(this.newSubTeam),
      this.newSubIn,
      this.subInSearchCtrl.value,
    );
  }

  get incPlayerEmptyText(): string {
    if (
      !this.startersOf(this.newIncidenceTeam).length &&
      !this.substitutesOf(this.newIncidenceTeam).length
    ) {
      return this.i18n.translate('ui.primeroCargaLaFormacionDeEste');
    }
    return this.newIncidenceType === 'GOAL'
      ? this.i18n.translate('ui.noHayJugadoresEnCanchaDisponibles')
      : this.i18n.translate('ui.noHayJugadoresCitadosDisponibles');
  }

  private validMinute(m: number | null): boolean {
    return m !== null && Number(m) >= 1 && Number(m) <= 120;
  }

  // Además de estar elegido, el jugador tiene que seguir siendo válido
  // (por ejemplo, si lo expulsaron después de elegirlo)
  get canAddIncidence(): boolean {
    return (
      this.validMinute(this.newIncidenceMinute) &&
      !!this.newIncidencePlayer &&
      this.incPlayerPool().some((c) => c.name === this.newIncidencePlayer)
    );
  }

  get canAddSubstitution(): boolean {
    const team = this.newSubTeam;
    return (
      this.validMinute(this.newSubMinute) &&
      !!this.newSubOut &&
      !!this.newSubIn &&
      this.onPitchOptions(team).some((c) => c.name === this.newSubOut) &&
      this.benchOptions(team).some((c) => c.name === this.newSubIn)
    );
  }

  // =====================================================================
  // Menús (tipo de incidencia, equipo)
  // =====================================================================
  toggleMenu(menu: 'incType' | 'incTeam' | 'subTeam', event: MouseEvent) {
    event.stopPropagation();
    this.openMenu = this.openMenu === menu ? null : menu;
    this.isIncPlayerOpen = this.isSubOutOpen = this.isSubInOpen = false;
  }

  selectIncidenceType(type: IncidenceKind) {
    this.newIncidenceType = type;
    this.openMenu = null;
    // Al cambiar a Gol la lista se achica: si el elegido ya no está en cancha se descarta
    if (
      this.newIncidencePlayer &&
      !this.incPlayerPool().some((c) => c.name === this.newIncidencePlayer)
    ) {
      this.resetIncidencePlayer();
    }
  }

  selectIncidenceTeam(team: TeamSide) {
    this.newIncidenceTeam = team;
    this.openMenu = null;
    this.resetIncidencePlayer();
  }

  selectSubTeam(team: TeamSide) {
    this.newSubTeam = team;
    this.openMenu = null;
    this.resetSubPlayers();
  }

  getIncidenceTypeLabel(type: string): string {
    switch (type) {
      case 'YELLOW_CARD':
        return this.i18n.translate('ui.tarjetaAmarilla');
      case 'RED_CARD':
        return this.i18n.translate('ui.tarjetaRoja');
      case 'GOAL':
        return this.i18n.translate('ui.gol');
      case 'SUBSTITUTION':
        return this.i18n.translate('ui.sustitucion');
      default:
        return this.i18n.translate('ui.seleccionarTipo2');
    }
  }

  private resetIncidencePlayer() {
    this.newIncidencePlayer = '';
    this.incPlayerSearchCtrl.setValue('', { emitEvent: false });
    this.isIncPlayerOpen = false;
  }

  private resetSubPlayers() {
    this.newSubOut = '';
    this.newSubIn = '';
    this.subOutSearchCtrl.setValue('', { emitEvent: false });
    this.subInSearchCtrl.setValue('', { emitEvent: false });
    this.isSubOutOpen = this.isSubInOpen = false;
  }

  // =====================================================================
  // Selección desde las listas de búsqueda
  // =====================================================================
  selectIncPlayer(c: PlayerOption) {
    this.newIncidencePlayer = c.name;
    this.incPlayerSearchCtrl.setValue(c.label, { emitEvent: false });
    this.isIncPlayerOpen = false;
  }

  selectSubOut(c: PlayerOption) {
    this.newSubOut = c.name;
    this.subOutSearchCtrl.setValue(c.label, { emitEvent: false });
    this.isSubOutOpen = false;
  }

  selectSubIn(c: PlayerOption) {
    this.newSubIn = c.name;
    this.subInSearchCtrl.setValue(c.label, { emitEvent: false });
    this.isSubInOpen = false;
  }

  // =====================================================================
  // Alta y baja de incidencias / sustituciones
  // =====================================================================
  addIncidence() {
    if (!this.canAddIncidence) return;

    const team = this.newIncidenceTeam;
    const player = this.newIncidencePlayer;
    const minute = Number(this.newIncidenceMinute);
    let text = `${player} (${this.teamName(team)})`;

    if (this.newIncidenceType === 'GOAL') {
      const goal: GoalDetail = { minute, player };
      if (team === 'local') {
        this.localGoalsDetail.push(goal);
        this.matchForm.patchValue({ localGoals: this.localGoalsDetail.length });
      } else {
        this.awayGoalsDetail.push(goal);
        this.matchForm.patchValue({ awayGoals: this.awayGoalsDetail.length });
      }
      text = `Gol de ${player} (${this.localGoalsDetail.length}–${this.awayGoalsDetail.length})`;
    }

    this.incidences.push({ minute, type: this.newIncidenceType, text, team, player });

    this.newIncidenceMinute = null;
    this.resetIncidencePlayer();
    this.cdr.markForCheck();
  }

  addSubstitution() {
    if (!this.canAddSubstitution) return;

    this.incidences.push({
      minute: Number(this.newSubMinute),
      type: 'SUBSTITUTION',
      team: this.newSubTeam,
      playerOut: this.newSubOut,
      playerIn: this.newSubIn,
      text: `Sale ${this.newSubOut}, entra ${this.newSubIn}`,
    });

    this.newSubMinute = null;
    this.resetSubPlayers();
    this.cdr.markForCheck();
  }

  removeIncidenceAt(index: number) {
    const inc = this.incidences[index];
    if (!inc) return;

    // Si era un gol, también se descuenta del marcador
    const d = this.parseIncidence(inc);
    if (inc.type === 'GOAL' && d.team && d.player) {
      const list = d.team === 'local' ? this.localGoalsDetail : this.awayGoalsDetail;
      const i = list.findIndex(
        (g) => g.minute === inc.minute && this.nameMatches(g.player, d.player),
      );
      if (i > -1) {
        list.splice(i, 1);
        this.matchForm.patchValue(
          d.team === 'local'
            ? { localGoals: this.localGoalsDetail.length }
            : { awayGoals: this.awayGoalsDetail.length },
        );
      }
    }

    this.incidences.splice(index, 1);
    this.cdr.markForCheck();
  }

  // =====================================================================
  // Alineaciones
  // =====================================================================
  addLineupPlayer(teamType: TeamSide, listType: 'starters' | 'substitutes', selectedName: string) {
    if (!selectedName) return;

    // El <select> entrega el nombre del jugador: se busca en el plantel
    const playerObj = this.rosterOf(teamType).find((p) => p.name === selectedName);
    if (!playerObj) return;

    if (listType === 'starters' && this.startersOf(teamType).length >= this.MAX_STARTERS) return;

    const item: LineupPlayer = {
      number: playerObj.number,
      name: playerObj.name,
      position: playerObj.position,
    };

    // Un jugador no puede estar dos veces en la alineación del mismo equipo
    const all = [...this.startersOf(teamType), ...this.substitutesOf(teamType)];
    if (all.some((p) => this.playerName(p) === this.playerName(item))) return;

    if (teamType === 'local') {
      if (listType === 'starters') {
        if (!this.lineups.local) this.lineups.local = [];
        this.lineups.local.push(item);
      } else {
        if (!this.lineups.localSubstitutes) this.lineups.localSubstitutes = [];
        this.lineups.localSubstitutes.push(item);
      }
    } else {
      if (listType === 'starters') {
        if (!this.lineups.away) this.lineups.away = [];
        this.lineups.away.push(item);
      } else {
        if (!this.lineups.awaySubstitutes) this.lineups.awaySubstitutes = [];
        this.lineups.awaySubstitutes.push(item);
      }
    }
    this.cdr.markForCheck();
  }

  removeLineupPlayer(teamType: TeamSide, listType: 'starters' | 'substitutes', index: number) {
    if (teamType === 'local') {
      if (listType === 'starters') this.lineups.local.splice(index, 1);
      else this.lineups.localSubstitutes?.splice(index, 1);
    } else {
      if (listType === 'starters') this.lineups.away.splice(index, 1);
      else this.lineups.awaySubstitutes?.splice(index, 1);
    }
    this.cdr.markForCheck();
  }

  // =====================================================================
  // Calendario
  // =====================================================================
  get formattedSelectedDateTime(): string {
    if (!this.selectedDate) return '';
    const day = String(this.selectedDate.getDate()).padStart(2, '0');
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const year = this.selectedDate.getFullYear();
    return `${day}/${month}/${year} - ${this.selectedHour}:${this.selectedMinute} hs`;
  }

  toggleCalendar(event: Event) {
    event.stopPropagation();
    this.isCalendarOpen = !this.isCalendarOpen;
    this.isMonthOpen = this.isYearOpen = this.isTimeOpen = false;
  }

  toggleMonthDropdown() {
    this.isMonthOpen = !this.isMonthOpen;
    this.isYearOpen = false;
  }
  toggleYearDropdown() {
    this.isYearOpen = !this.isYearOpen;
    this.isMonthOpen = false;
  }
  toggleTimeDropdown() {
    this.isTimeOpen = !this.isTimeOpen;
  }
  selectMonth(index: number) {
    this.currentMonth = index;
    this.isMonthOpen = false;
  }
  selectYear(year: number) {
    this.currentYear = year;
    this.isYearOpen = false;
  }
  selectHour(h: string) {
    this.selectedHour = h;
    this.updateMatchDateTimeString();
  }
  selectMinute(m: string) {
    this.selectedMinute = m;
    this.isTimeOpen = false;
    this.updateMatchDateTimeString();
  }
  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }
  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  get calendarDays(): CalendarDay[] {
    const days: CalendarDay[] = [];
    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const lastDateCurrentMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const lastDatePrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

    for (let i = firstDayIndex; i > 0; i--) {
      days.push({
        day: lastDatePrevMonth - i + 1,
        date: new Date(this.currentYear, this.currentMonth - 1, lastDatePrevMonth - i + 1),
        isCurrentMonth: false,
      });
    }
    for (let i = 1; i <= lastDateCurrentMonth; i++) {
      days.push({
        day: i,
        date: new Date(this.currentYear, this.currentMonth, i),
        isCurrentMonth: true,
      });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        date: new Date(this.currentYear, this.currentMonth + 1, i),
        isCurrentMonth: false,
      });
    }
    return days;
  }

  isDayDisabled(date: Date): boolean {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    return d < todayMidnight;
  }

  isDaySelected(date: Date): boolean {
    if (!this.selectedDate) return false;
    return (
      date.getDate() === this.selectedDate.getDate() &&
      date.getMonth() === this.selectedDate.getMonth() &&
      date.getFullYear() === this.selectedDate.getFullYear()
    );
  }

  selectDate(date: Date, event?: Event) {
    if (event) event.stopPropagation();
    this.selectedDate = new Date(date);
    this.updateMatchDateTimeString();
    this.isCalendarOpen = false;
  }

  updateMatchDateTimeString() {
    if (!this.selectedDate) return;
    const y = this.selectedDate.getFullYear();
    const m = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(this.selectedDate.getDate()).padStart(2, '0');
    this.matchForm.controls['date'].setValue(
      `${y}-${m}-${d}T${this.selectedHour}:${this.selectedMinute}`,
    );
  }

  // =====================================================================
  // Selección de campeonato / equipos / estadio / estado
  // =====================================================================
  selectChampionship(champ: Championship) {
    this.matchForm.get('championshipID')?.setValue(champ.id);
    this.championshipSearchCtrl.setValue(champ.name, { emitEvent: false });
    this.isChampDropdownOpen = false;
  }

  selectLocalTeam(team: Team) {
    if (!team.id) return;
    // Si cambia el equipo, la formación anterior ya no corresponde
    if (String(this.matchForm.get('localTeamID')?.value) !== String(team.id)) {
      this.lineups.local = [];
      this.lineups.localSubstitutes = [];
      this.rosterSelection.local = '';
    }
    this.matchForm.get('localTeamID')?.setValue(team.id);
    this.localSearchCtrl.setValue(team.name, { emitEvent: false });
    this.isLocalDropdownOpen = false;
    this.loadRosterForTeam(team.id, 'local');
  }

  selectVisitorTeam(team: Team) {
    if (!team.id) return;
    if (String(this.matchForm.get('awayTeamID')?.value) !== String(team.id)) {
      this.lineups.away = [];
      this.lineups.awaySubstitutes = [];
      this.rosterSelection.away = '';
    }
    this.matchForm.get('awayTeamID')?.setValue(team.id);
    this.visitorSearchCtrl.setValue(team.name, { emitEvent: false });
    this.isVisitorDropdownOpen = false;
    this.loadRosterForTeam(team.id, 'away');
  }

  selectStadium(stadiumName: string) {
    this.matchForm.get('stadium')?.setValue(stadiumName);
    this.stadiumSearchCtrl.setValue(stadiumName, { emitEvent: false });
    this.isStadiumDropdownOpen = false;
  }

  toggleStatusDropdown(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.isStatusOpen = !this.isStatusOpen;
  }

  selectStatus(status: string) {
    this.matchForm.get('status')?.setValue(status);
    this.isStatusOpen = false;
  }

  onSubmit() {
    if (this.matchForm.valid && this.matchId !== null) {
      const formValue = this.matchForm.value;
      const payload = {
        ...this.loadedMatchData,
        championshipID: formValue.championshipID,
        date: formValue.date,
        localTeamID: formValue.localTeamID,
        awayTeamID: formValue.awayTeamID,
        stadium: formValue.stadium,
        status: formValue.status,
        localGoals: Number(formValue.localGoals),
        awayGoals: Number(formValue.awayGoals),
        localGoalsDetail: this.localGoalsDetail,
        awayGoalsDetail: this.awayGoalsDetail,
        incidences: this.incidences,
        lineups: this.lineups,
      };

      this.matchService.update(this.matchId, payload).subscribe({
        next: () => this.closePanel.emit(),
        error: (err) => console.error('Error al actualizar:', err),
      });
    } else {
      this.matchForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.closePanel.emit();
  }
}
