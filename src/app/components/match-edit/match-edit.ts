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

@Component({
  selector: 'app-match-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './match-edit.html',
  styleUrl: './match-edit.css',
})
export class MatchEdit implements OnInit {
  @Input() matchIdInput!: number | string;
  @Output() closePanel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private matchService = inject(MatchService);
  private teamService = inject(TeamService);
  private championshipService = inject(ChampionshipService);
  private cdr = inject(ChangeDetectorRef);

  matchForm!: FormGroup;
  matchId: number | null = null;
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

  localTeamRoster: any[] = [];
  awayTeamRoster: any[] = [];

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

  months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
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
      this.matchId = Number(this.matchIdInput);
      this.loadMatchData(this.matchId);
    } else {
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        if (id) {
          this.matchId = Number(id);
          this.loadMatchData(this.matchId);
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

  loadMatchData(id: number) {
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

  loadRosterForTeam(teamId: number | string | undefined, type: TeamSide) {
    if (!teamId) return;
    this.teamService.getById(Number(teamId)).subscribe({
      next: (teamData: any) => {
        const players = teamData?.players || teamData?.plantel || [];
        if (type === 'local') this.localTeamRoster = players;
        else this.awayTeamRoster = players;
        this.cdr.markForCheck();
      },
      error: () => {
        const found = this.allTeams.find((t) => String(t.id) === String(teamId));
        if (found && (found as any).players) {
          if (type === 'local') this.localTeamRoster = (found as any).players;
          else this.awayTeamRoster = (found as any).players;
        }
        this.cdr.markForCheck();
      },
    });
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

  private rosterOf(team: TeamSide): any[] {
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

  /** Expulsado: tiene roja, o ya acumuló 2 amarillas. */
  isSentOff(team: TeamSide, name: string): boolean {
    const mine = this.incidences.filter((i) => i.team === team && i.player === name);
    if (mine.some((i) => i.type === 'RED_CARD')) return true;
    return mine.filter((i) => i.type === 'YELLOW_CARD').length >= 2;
  }

  private hasLeftPitch(team: TeamSide, name: string): boolean {
    return this.incidences.some(
      (i) => i.type === 'SUBSTITUTION' && i.team === team && i.playerOut === name,
    );
  }

  private hasEnteredPitch(team: TeamSide, name: string): boolean {
    return this.incidences.some(
      (i) => i.type === 'SUBSTITUTION' && i.team === team && i.playerIn === name,
    );
  }

  private filterByQuery(items: PlayerOption[], selectedName: string, query: string | null) {
    // Si ya hay un jugador elegido se muestra la lista completa al volver a abrir
    const q = selectedName ? '' : (query || '').toLowerCase().trim();
    return q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
  }

  // Candidatos para Gol / Amarilla / Roja: plantel del equipo elegido, sin expulsados
  get incPlayerCandidates(): PlayerOption[] {
    const team = this.newIncidenceTeam;
    const items = this.rosterOf(team)
      .map((p) => ({ name: this.playerName(p), label: this.playerLabel(p) }))
      .filter((c) => c.name && !this.isSentOff(team, c.name));
    return this.filterByQuery(items, this.newIncidencePlayer, this.incPlayerSearchCtrl.value);
  }

  // Candidatos que SALEN: solo titulares, sin expulsados y sin haber salido ya
  get subOutCandidates(): PlayerOption[] {
    const team = this.newSubTeam;
    const items = this.startersOf(team)
      .map((p) => ({ name: this.playerName(p), label: this.playerLabel(p) }))
      .filter((c) => c.name && !this.isSentOff(team, c.name) && !this.hasLeftPitch(team, c.name));
    return this.filterByQuery(items, this.newSubOut, this.subOutSearchCtrl.value);
  }

  // Candidatos que ENTRAN: solo suplentes que todavía no ingresaron
  get subInCandidates(): PlayerOption[] {
    const team = this.newSubTeam;
    const items = this.substitutesOf(team)
      .map((p) => ({ name: this.playerName(p), label: this.playerLabel(p) }))
      .filter((c) => c.name && !this.hasEnteredPitch(team, c.name));
    return this.filterByQuery(items, this.newSubIn, this.subInSearchCtrl.value);
  }

  // Listados para el template (con el índice real dentro de this.incidences)
  get incidenceEntries() {
    return this.incidences
      .map((inc, index) => ({ inc, index }))
      .filter((e) => e.inc.type !== 'SUBSTITUTION');
  }

  get substitutionEntries() {
    return this.incidences
      .map((inc, index) => ({ inc, index }))
      .filter((e) => e.inc.type === 'SUBSTITUTION');
  }

  private validMinute(m: number | null): boolean {
    return m !== null && Number(m) >= 1 && Number(m) <= 120;
  }

  get canAddIncidence(): boolean {
    return this.validMinute(this.newIncidenceMinute) && !!this.newIncidencePlayer;
  }

  get canAddSubstitution(): boolean {
    return this.validMinute(this.newSubMinute) && !!this.newSubOut && !!this.newSubIn;
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
        return 'Tarjeta Amarilla';
      case 'RED_CARD':
        return 'Tarjeta Roja';
      case 'GOAL':
        return 'Gol';
      case 'SUBSTITUTION':
        return 'Sustitución';
      default:
        return 'Seleccionar tipo';
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

    // Si era un gol cargado desde acá, también se descuenta del marcador
    if (inc.type === 'GOAL' && inc.team && inc.player) {
      const list = inc.team === 'local' ? this.localGoalsDetail : this.awayGoalsDetail;
      const i = list.findIndex((g) => g.minute === inc.minute && g.player === inc.player);
      if (i > -1) {
        list.splice(i, 1);
        this.matchForm.patchValue(
          inc.team === 'local'
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
  addLineupPlayer(teamType: TeamSide, listType: 'starters' | 'substitutes', selected: any) {
    if (!selected) return;

    // El <select> entrega el texto de la opción: se busca el jugador en el plantel
    let playerObj = selected;
    if (typeof selected === 'string') {
      const text = selected.trim();
      playerObj = this.rosterOf(teamType).find(
        (p) => this.playerLabel(p) === text || this.playerName(p) === text,
      );
      if (!playerObj) return;
    }

    const item: LineupPlayer = {
      number: playerObj.number || playerObj.dorsal,
      name: playerObj.name || playerObj.nombre,
      position: playerObj.position || playerObj.posicion,
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
    this.matchForm.get('localTeamID')?.setValue(team.id);
    this.localSearchCtrl.setValue(team.name, { emitEvent: false });
    this.isLocalDropdownOpen = false;
    this.loadRosterForTeam(team.id, 'local');
  }

  selectVisitorTeam(team: Team) {
    if (!team.id) return;
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
