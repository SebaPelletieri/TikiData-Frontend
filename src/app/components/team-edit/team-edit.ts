import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { TeamService } from '../../services/team-service';
import { PlayerService } from '../../services/player-service';
import { Player } from '../../models/Player';
import { Team } from '../../models/Team';

export interface PlayerItem {
  id: number;
  name: string;
  position: string;
  number?: number;
}

interface StadiumOption {
  id: number;
  name: string;
}

interface CalendarDay {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
}

const STADIUMS_URL = 'http://localhost:3000/estadios';

@Component({
  selector: 'app-team-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './team-edit.html',
  styleUrl: './team-edit.css',
})
export class TeamEdit implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private teamService = inject(TeamService);
  private playerService = inject(PlayerService);

  teamId: number | string | null = null;
  private originalTeam: Team | null = null;

  isLoading = signal(true);
  loadError = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  teamForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    country: ['', [Validators.required]],
    shield: ['', [Validators.required]],
    yearOfFoundation: ['', [Validators.required]],
    championshipsActive: [<number[]>[], [Validators.required]],
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      !target.closest('.custom-dropdown') &&
      !target.closest('.calendar-field-container') &&
      !target.closest('.search-tag-container') &&
      !target.closest('.direct-search-input-box') &&
      !target.closest('.search-player-group')
    ) {
      this.closeAllDropdowns();
    }
  }

  closeAllDropdowns(): void {
    if (this.teamForm.get('country')?.value === '') {
      this.teamForm.get('country')?.markAsTouched();
    }
    if (this.teamForm.get('yearOfFoundation')?.value === '') {
      this.teamForm.get('yearOfFoundation')?.markAsTouched();
    }

    this.isCountryOpen.set(false);
    this.isStadiumDropdownOpen.set(false);
    this.isCalendarOpen = false;
    this.isMonthOpen = false;
    this.isYearOpen = false;
    this.isChampionshipsFocused.set(false);
  }

  countries = [
    'Afganistán',
    'Albania',
    'Alemania',
    'Andorra',
    'Angola',
    'Antigua y Barbuda',
    'Arabia Saudita',
    'Argelia',
    'Argentina',
    'Armenia',
    'Australia',
    'Austria',
    'Azerbaiyán',
    'Bahamas',
    'Bangladés',
    'Barbados',
    'Baréin',
    'Bélgica',
    'Belice',
    'Benín',
    'Bielorrusia',
    'Birmania',
    'Bolivia',
    'Bosnia y Herzegovina',
    'Botsuana',
    'Brasil',
    'Brunéi',
    'Bulgaria',
    'Burkina Faso',
    'Burundi',
    'Bután',
    'Cabo Verde',
    'Camboya',
    'Camerún',
    'Canadá',
    'Catar',
    'Chad',
    'Chile',
    'China',
    'Chipre',
    'Colombia',
    'Comoras',
    'Congo',
    'Corea del Norte',
    'Corea del Sur',
    'Costa de Marfil',
    'Costa Rica',
    'Croacia',
    'Cuba',
    'Dinamarca',
    'Dominica',
    'Ecuador',
    'Egipto',
    'El Salvador',
    'Emiratos Árabes Unidos',
    'Eritrea',
    'Eslovaquia',
    'Eslovenia',
    'España',
    'Estados Unidos',
    'Estonia',
    'Esuatini',
    'Etiopía',
    'Filipinas',
    'Finlandia',
    'Fiyi',
    'Francia',
    'Gabón',
    'Gambia',
    'Georgia',
    'Ghana',
    'Granada',
    'Grecia',
    'Guatemala',
    'Guinea',
    'Guinea Ecuatorial',
    'Guinea-Bisáu',
    'Guyana',
    'Haití',
    'Honduras',
    'Hungría',
    'India',
    'Indonesia',
    'Irak',
    'Irán',
    'Irlanda',
    'Islandia',
    'Islas Marshall',
    'Islas Salomón',
    'Israel',
    'Italia',
    'Jamaica',
    'Japón',
    'Jordania',
    'Kazajistán',
    'Kenia',
    'Kirguistán',
    'Kiribati',
    'Kuwait',
    'Laos',
    'Lesoto',
    'Letonia',
    'Líbano',
    'Liberia',
    'Libia',
    'Liechtenstein',
    'Lituania',
    'Luxemburgo',
    'Madagascar',
    'Malasia',
    'Malaui',
    'Maldivas',
    'Malí',
    'Malta',
    'Marruecos',
    'Mauricio',
    'Mauritania',
    'México',
    'Micronesia',
    'Moldavia',
    'Mónaco',
    'Mongolia',
    'Montenegro',
    'Mozambique',
    'Namibia',
    'Nauru',
    'Nepal',
    'Nicaragua',
    'Níger',
    'Nigeria',
    'Noruega',
    'Nueva Zelanda',
    'Omán',
    'Países Bajos',
    'Pakistán',
    'Palaos',
    'Panamá',
    'Papúa Nueva Guinea',
    'Paraguay',
    'Perú',
    'Polonia',
    'Portugal',
    'Reino Unido',
    'República Centroafricana',
    'República Checa',
    'República Democrática del Congo',
    'República Dominicana',
    'Ruanda',
    'Rumanía',
    'Rusia',
    'Samoa',
    'San Cristóbal y Nieves',
    'San Marino',
    'San Vicente y las Granadinas',
    'Santa Lucía',
    'Santo Tomé y Príncipe',
    'Senegal',
    'Serbia',
    'Seychelles',
    'Sierra Leona',
    'Singapur',
    'Siria',
    'Somalia',
    'Sri Lanka',
    'Sudáfrica',
    'Sudán',
    'Sudán del Sur',
    'Suecia',
    'Suiza',
    'Surinam',
    'Tailandia',
    'Tanzania',
    'Tayikistán',
    'Timor Oriental',
    'Togo',
    'Tonga',
    'Trinidad y Tobago',
    'Túnez',
    'Turkmenistán',
    'Turquía',
    'Tuvalu',
    'Ucrania',
    'Uganda',
    'Uruguay',
    'Uzbekistán',
    'Vanuatu',
    'Vaticano',
    'Venezuela',
    'Vietnam',
    'Yemen',
    'Yibuti',
    'Zambia',
    'Zimbabue',
  ].sort();

  isCountryOpen = signal(false);

  stadiums: StadiumOption[] = [];
  stadiumSearchCtrl = new FormControl('');
  selectedStadiumId: number | null = null;
  isStadiumDropdownOpen = signal(false);
  filteredStadiums: StadiumOption[] = [];
  stadiumError = signal(false);

  // --- Campeonatos ---
  championships = [
    { id: 1, name: 'Liga Profesional' },
    { id: 2, name: 'Copa Libertadores' },
    { id: 3, name: 'Copa Argentina' },
  ];
  championshipSearchText = signal<string>('');
  isChampionshipsFocused = signal<boolean>(false);

  filteredChampionships = computed(() => {
    const search = this.championshipSearchText().toLowerCase().trim();
    const selectedIds = this.teamForm.get('championshipsActive')?.value || [];
    if (!search) return [];
    return this.championships.filter(
      (c) => c.name.toLowerCase().includes(search) && !selectedIds.includes(c.id),
    );
  });

  get selectedChampionshipsList() {
    const selectedIds = this.teamForm.get('championshipsActive')?.value || [];
    return this.championships.filter((c) => selectedIds.includes(c.id));
  }

  addChampionship(championshipId: number) {
    const current: number[] = [...(this.teamForm.get('championshipsActive')?.value || [])];
    if (!current.includes(championshipId)) {
      current.push(championshipId);
      this.teamForm.get('championshipsActive')?.setValue(current);
      this.teamForm.get('championshipsActive')?.markAsTouched();
    }
    this.championshipSearchText.set('');
  }

  removeChampionship(championshipId: number) {
    const current: number[] = [...(this.teamForm.get('championshipsActive')?.value || [])];
    const updated = current.filter((id) => id !== championshipId);
    this.teamForm.get('championshipsActive')?.setValue(updated);
    this.teamForm.get('championshipsActive')?.markAsTouched();
  }

  playersList: PlayerItem[] = [];
  allSystemPlayers: Player[] = [];
  filteredPlayers: PlayerItem[] = [];
  playerSearchCtrl = new FormControl('');
  playerNumberCtrl = new FormControl<number | null>(null);
  selectedPlayerCandidate: PlayerItem | null = null;

  isPlayerAdderValid(): boolean {
    const query = (this.playerSearchCtrl.value || '').trim().toLowerCase();

    const found =
      this.selectedPlayerCandidate ||
      this.allSystemPlayers.find(
        (p) =>
          p.name.toLowerCase() === query &&
          !this.playersList.some((x) => String(x.id) === String(p.id)),
      );

    const dorsalVal = this.playerNumberCtrl.value;
    const hasValidDorsal =
      dorsalVal !== null &&
      dorsalVal !== undefined &&
      dorsalVal !== ('' as any) &&
      !isNaN(Number(dorsalVal)) &&
      Number(dorsalVal) >= 1 &&
      Number(dorsalVal) <= 99;

    return !!found && hasValidDorsal;
  }

  // --- Calendario ---
  isCalendarOpen = false;
  isMonthOpen = false;
  isYearOpen = false;

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();

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
    for (let y = current; y >= 1850; y--) {
      years.push(y);
    }
    return years;
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.setupSearchFilters();

    // Sanitizar dorsal en tiempo real (1 al 99)
    this.playerNumberCtrl.valueChanges.subscribe((val) => {
      if (val !== null && val !== undefined && val !== ('' as any)) {
        const num = Number(val);
        if (num < 1) {
          this.playerNumberCtrl.setValue(1, { emitEvent: false });
        } else if (num > 99) {
          this.playerNumberCtrl.setValue(99, { emitEvent: false });
        }
      }
    });

    this.route.paramMap.subscribe((params) => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const raw = params.get('id');
      if (!raw) return;
      this.teamId = raw !== '' && !isNaN(Number(raw)) ? Number(raw) : raw;
      this.loadAll(this.teamId);
    });
  }

  private loadAll(id: number | string) {
    this.isLoading.set(true);
    this.loadError.set(null);

    forkJoin({
      team: this.teamService.getById(id as any),
      stadiums: this.http.get<StadiumOption[]>(STADIUMS_URL),
      players: this.playerService.getAllPlayers(),
    }).subscribe({
      next: ({ team, stadiums, players }) => {
        this.originalTeam = team;
        this.stadiums = stadiums;
        this.allSystemPlayers = players;

        let foundationStr = '';
        if (team.yearOfFoundation) {
          const d = new Date(team.yearOfFoundation);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            foundationStr = `${y}-${m}-${day}`;
          }
        }

        this.teamForm.patchValue({
          name: team.name,
          country: team.country,
          shield: team.shield,
          yearOfFoundation: foundationStr,
          championshipsActive: team.championshipsActive || [],
        });

        const stadium = stadiums.find((s) => String(s.id) === String(team.stadiumID));
        this.selectedStadiumId = stadium ? stadium.id : null;
        this.stadiumSearchCtrl.setValue(stadium?.name ?? '', { emitEvent: false });

        const ids = (team.playerIDs ?? []).map(String);
        this.playersList = players
          .filter((p) => p.id !== undefined && ids.includes(String(p.id)))
          .map((p) => this.toPlayerItem(p, team));

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar los datos del equipo:', err);
        this.loadError.set('No se pudieron cargar los datos del equipo.');
        this.isLoading.set(false);
      },
    });
  }

  private toPlayerItem(p: Player, team?: Team): PlayerItem {
    const teamKey = team?.id ?? this.teamId;
    return {
      id: p.id as number,
      name: p.name,
      position: p.position,
      number: teamKey !== null && teamKey !== undefined ? p.dorsals?.[Number(teamKey)] : undefined,
    };
  }

  private setupSearchFilters() {
    this.stadiumSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      this.selectedStadiumId = null;
      this.stadiumError.set(false);
      this.filteredStadiums = q
        ? this.stadiums.filter((s) => s.name.toLowerCase().includes(q))
        : [];
      this.isStadiumDropdownOpen.set(this.filteredStadiums.length > 0);
    });

    this.playerSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      if (this.selectedPlayerCandidate && this.selectedPlayerCandidate.name.toLowerCase() !== q) {
        this.selectedPlayerCandidate = null;
      }
      this.filteredPlayers = !q
        ? []
        : this.allSystemPlayers
            .filter(
              (p) =>
                p.id !== undefined &&
                p.name.toLowerCase().includes(q) &&
                !this.playersList.some((x) => String(x.id) === String(p.id)),
            )
            .map((p) => this.toPlayerItem(p));
    });
  }

  toggleCountryDropdown(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.isCountryOpen.set(!this.isCountryOpen());
    this.isStadiumDropdownOpen.set(false);
    this.isCalendarOpen = false;
    this.isMonthOpen = false;
    this.isYearOpen = false;
    this.isChampionshipsFocused.set(false);
  }

  selectCountry(countryName: string, event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.teamForm.get('country')?.setValue(countryName);
    this.teamForm.get('country')?.markAsTouched();
    this.isCountryOpen.set(false);
  }

  selectStadium(stadium: StadiumOption) {
    this.stadiumSearchCtrl.setValue(stadium.name, { emitEvent: false });
    this.selectedStadiumId = stadium.id;
    this.stadiumError.set(false);
    this.isStadiumDropdownOpen.set(false);
  }

  selectPlayerSuggestion(fp: PlayerItem) {
    this.selectedPlayerCandidate = fp;
    this.playerSearchCtrl.setValue(fp.name, { emitEvent: false });
    this.filteredPlayers = [];
  }

  // --- Métodos del Calendario ---
  toggleCalendar(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isCalendarOpen = !this.isCalendarOpen;
    this.isCountryOpen.set(false);
    this.isStadiumDropdownOpen.set(false);
    this.isChampionshipsFocused.set(false);
    if (!this.isCalendarOpen) {
      this.isMonthOpen = false;
      this.isYearOpen = false;
      this.teamForm.get('yearOfFoundation')?.markAsTouched();
    }
  }

  toggleMonthDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isMonthOpen = !this.isMonthOpen;
    this.isYearOpen = false;
  }

  selectMonth(index: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.currentMonth = index;
    this.isMonthOpen = false;
  }

  toggleYearDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isYearOpen = !this.isYearOpen;
    this.isMonthOpen = false;
  }

  selectYear(year: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.currentYear = year;
    this.isYearOpen = false;
  }

  get calendarDays(): CalendarDay[] {
    const days: CalendarDay[] = [];
    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const lastDateCurrentMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const lastDatePrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

    for (let i = firstDayIndex; i > 0; i--) {
      const day = lastDatePrevMonth - i + 1;
      days.push({
        day,
        date: new Date(this.currentYear, this.currentMonth - 1, day),
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
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        date: new Date(this.currentYear, this.currentMonth + 1, i),
        isCurrentMonth: false,
      });
    }
    return days;
  }

  prevMonth(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  selectDate(date: Date, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    this.teamForm.get('yearOfFoundation')?.setValue(`${year}-${month}-${day}`);
    this.teamForm.get('yearOfFoundation')?.markAsTouched();
    this.isCalendarOpen = false;
    this.isMonthOpen = false;
    this.isYearOpen = false;
  }

  isDaySelected(date: Date): boolean {
    const currentValue = this.teamForm.get('yearOfFoundation')?.value;
    if (!currentValue) return false;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return currentValue === `${year}-${month}-${day}`;
  }

  get formattedSelectedDate(): string {
    const val = this.teamForm.get('yearOfFoundation')?.value;
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  addPlayer() {
    let toAdd: PlayerItem | undefined = this.selectedPlayerCandidate || undefined;

    if (!toAdd) {
      const query = (this.playerSearchCtrl.value || '').trim().toLowerCase();
      const found = this.allSystemPlayers.find((p) => p.name.toLowerCase() === query);
      if (!found) return;
      toAdd = this.toPlayerItem(found);
    }

    if (!this.isPlayerAdderValid()) return;

    toAdd = {
      ...toAdd,
      number: Number(this.playerNumberCtrl.value),
    };

    if (this.playersList.some((p) => String(p.id) === String(toAdd!.id))) {
      this.errorMessage.set('Este jugador ya forma parte del plantel.');
      return;
    }

    this.errorMessage.set(null);
    this.playersList.push(toAdd);

    // Limpiar campos
    this.selectedPlayerCandidate = null;
    this.playerSearchCtrl.setValue('', { emitEvent: false });
    this.playerNumberCtrl.setValue(null);
    this.filteredPlayers = [];
  }

  removePlayer(index: number) {
    this.playersList.splice(index, 1);
  }

  onSubmit() {
    if (this.teamForm.invalid || this.teamId === null || !this.originalTeam) {
      this.teamForm.markAllAsTouched();
      return;
    }

    if (this.selectedStadiumId === null) {
      const typed = (this.stadiumSearchCtrl.value || '').trim().toLowerCase();
      const match = this.stadiums.find((s) => s.name.toLowerCase() === typed);
      this.selectedStadiumId = match ? match.id : null;
    }
    if (this.selectedStadiumId === null) {
      this.stadiumError.set(true);
      return;
    }

    const formRaw = this.teamForm.getRawValue();
    const teamKey = Number(this.teamId);

    const currentPlantelIds = new Set(this.playersList.map((p) => p.id));
    const originalPlayerIds = new Set((this.originalTeam.playerIDs || []).map(Number));

    const playersToUpdate = this.allSystemPlayers.filter((player) => {
      if (player.id === undefined) return false;
      const isInCurrent = currentPlantelIds.has(player.id);
      const wasInOriginal = originalPlayerIds.has(player.id);
      const hasDorsalForTeam = player.dorsals && player.dorsals[teamKey] !== undefined;
      return isInCurrent || (wasInOriginal && hasDorsalForTeam);
    });

    const playerUpdates = playersToUpdate.map((player) => {
      const itemInList = this.playersList.find((p) => p.id === player.id);
      const existingDorsals = { ...(player.dorsals || {}) };

      if (itemInList && itemInList.number) {
        existingDorsals[teamKey] = itemInList.number;
      } else {
        delete existingDorsals[teamKey];
      }

      const updatedPlayer: Player = {
        ...player,
        dorsals: existingDorsals,
      };

      return this.playerService.updatePlayer(player.id!, updatedPlayer);
    });

    const updatedTeam: Team = {
      ...this.originalTeam,
      name: formRaw.name,
      country: formRaw.country,
      shield: formRaw.shield,
      yearOfFoundation: formRaw.yearOfFoundation ? new Date(formRaw.yearOfFoundation) : new Date(),
      championshipsActive: formRaw.championshipsActive || [],
      stadiumID: this.selectedStadiumId,
      playerIDs: this.playersList.map((p) => p.id),
    };

    forkJoin([
      this.teamService.updateTeam(this.teamId as any, updatedTeam),
      ...(playerUpdates.length > 0 ? playerUpdates : [of(null)]),
    ]).subscribe({
      next: () => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        this.router.navigate(['/admin']);
      },
      error: (err: any) => {
        console.error('Error al actualizar:', err);
        this.errorMessage.set('No se pudieron guardar los cambios.');
      },
    });
  }

  onCancel() {
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.router.navigate(['/admin']);
  }
}
