import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  HostListener,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TeamService } from '../../services/team-service';
import { ChampionshipService } from '../../services/championship-service';
import { PlayerService } from '../../services/player-service';
import { Team } from '../../models/Team';
import { Player } from '../../models/Player';

export interface PlayerItem {
  id: number;
  name: string;
  position: string;
  number?: number;
}

interface CalendarDay {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
}

@Component({
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  selector: 'app-team-form',
  standalone: true,
  styleUrl: './team-form.css',
  templateUrl: './team-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamForm implements OnInit {
  teamService = inject(TeamService);
  championshipService = inject(ChampionshipService);
  playerService = inject(PlayerService);
  fb = inject(FormBuilder);

  @Output() closePanel = new EventEmitter<void>();

  formulario = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    shield: ['', [Validators.required]],
    country: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    yearOfFoundation: ['', [Validators.required]],
    championshipsActive: [<number[]>[], [Validators.required]],
    stadiumID: ['', [Validators.required]],
  });

  // Controles para la gestión de jugadores
  playersList: PlayerItem[] = [];
  allSystemPlayers: Player[] = [];
  filteredPlayers: PlayerItem[] = [];
  playerSearchCtrl = new FormControl('');
  playerNumberCtrl = new FormControl<number | null>(null);
  selectedPlayerCandidate: PlayerItem | null = null;
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    if (this.championshipService.championships().length === 0) {
      this.championshipService.getAll();
    }
    this.playerService.getAll();

    this.playerService.getAllPlayers().subscribe({
      next: (players) => {
        this.allSystemPlayers = players;
      },
      error: (err) => console.error('Error al cargar jugadores:', err),
    });

    this.setupSearchFilters();

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
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      !target.closest('.custom-dropdown') &&
      !target.closest('.calendar-field-container') &&
      !target.closest('.search-tag-container') &&
      !target.closest('.search-player-group')
    ) {
      this.closeAllDropdowns();
    }
  }

  closeAllDropdowns(): void {
    if (this.isCountryOpen) {
      this.formulario.controls['country'].markAsTouched();
    }
    if (this.isCalendarOpen) {
      this.formulario.controls['yearOfFoundation'].markAsTouched();
    }

    this.isCountryOpen = false;
    this.isCalendarOpen = false;
    this.isMonthOpen = false;
    this.isYearOpen = false;
    this.isStadiumFocused.set(false);
    this.isChampionshipsFocused.set(false);
    this.filteredPlayers = [];
  }

  private toPlayerItem(p: Player): PlayerItem {
    return {
      id: p.id as number,
      name: p.name,
      position: p.position,
      number: undefined,
    };
  }

  private setupSearchFilters() {
    this.playerSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      if (this.selectedPlayerCandidate && this.selectedPlayerCandidate.name.toLowerCase() !== q) {
        this.selectedPlayerCandidate = null;
      }

      this.filteredPlayers = !q
        ? []
        : this.allSystemPlayers
            .filter((p) => {
              if (p.id === undefined) return false;

              const matchesQuery = p.name.toLowerCase().includes(q);
              const notInCurrentPlantel = !this.playersList.some(
                (x) => String(x.id) === String(p.id),
              );
              const hasNoTeamAssigned = !p.dorsals || Object.keys(p.dorsals).length === 0;

              return matchesQuery && notInCurrentPlantel && hasNoTeamAssigned;
            })
            .map((p) => this.toPlayerItem(p));
    });
  }

  isPlayerAdderValid(): boolean {
    const query = (this.playerSearchCtrl.value || '').trim().toLowerCase();

    const found =
      this.selectedPlayerCandidate ||
      this.allSystemPlayers.find(
        (p) =>
          p.name.toLowerCase() === query &&
          !this.playersList.some((x) => String(x.id) === String(p.id)) &&
          (!p.dorsals || Object.keys(p.dorsals).length === 0),
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

  selectPlayerSuggestion(fp: PlayerItem) {
    this.selectedPlayerCandidate = fp;
    this.playerSearchCtrl.setValue(fp.name, { emitEvent: false });
    this.filteredPlayers = [];
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

    this.selectedPlayerCandidate = null;
    this.playerSearchCtrl.setValue('', { emitEvent: false });
    this.playerNumberCtrl.setValue(null);
    this.filteredPlayers = [];
  }

  removePlayer(index: number) {
    this.playersList.splice(index, 1);
  }

  saveTeam() {
    let teamActual: Team = {
      name: this.formulario.controls['name'].value,
      shield: this.formulario.controls['shield'].value,
      country: this.formulario.controls['country'].value,
      yearOfFoundation: new Date(this.formulario.controls['yearOfFoundation'].value),
      championshipsActive: this.formulario.controls['championshipsActive'].value,
      stadiumID: Number(this.formulario.controls['stadiumID'].value),
      playerIDs: this.playersList.map((p) => p.id),
    };

    this.teamService.saveTeam(teamActual);
    this.resetFormState();
    this.closePanel.emit();
  }

  cancel() {
    this.resetFormState();
    this.closePanel.emit();
  }

  private resetFormState(): void {
    this.formulario.reset();
    this.selectedChampionshipIds.set([]);
    this.championshipSearchText.set('');
    this.stadiumSearchText.set('');
    this.playersList = [];
    this.playerSearchCtrl.setValue('');
    this.playerNumberCtrl.setValue(null);
  }

  // --- Función universal y robusta para banderas ---
  getCountryFlag(countryName: string | number): string {
    if (!countryName) return 'https://flagcdn.com/w40/xx.png';

    const strCountry = String(countryName)
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Limpia tildes y espacios

    // Diccionario universal exacto para evitar duplicaciones o errores
    const countryIsoMap: Record<string, string> = {
      afganistan: 'af',
      albania: 'al',
      alemania: 'de',
      andorra: 'ad',
      angola: 'ao',
      'antigua y barbuda': 'ag',
      'arabia saudita': 'sa',
      argelia: 'dz',
      argentina: 'ar',
      armenia: 'am',
      australia: 'au',
      austria: 'at',
      azerbaiyan: 'az',
      bahamas: 'bs',
      banglades: 'bd',
      barbados: 'bb',
      barein: 'bh',
      belgica: 'be',
      belice: 'bz',
      benin: 'bj',
      bielorrusia: 'by',
      birmania: 'mm',
      bolivia: 'bo',
      'bosnia y herzegovina': 'ba',
      botsuana: 'bw',
      brasil: 'br',
      brazil: 'br',
      brunei: 'bn',
      bulgaria: 'bg',
      'burkina faso': 'bf',
      burundi: 'bi',
      butan: 'bt',
      'cabo verde': 'cv',
      camboya: 'kh',
      camerun: 'cm',
      canada: 'ca',
      catar: 'qa',
      chad: 'td',
      chile: 'cl',
      china: 'cn',
      chipre: 'cy',
      colombia: 'co',
      comoras: 'km',
      congo: 'cg',
      'corea del norte': 'kp',
      'corea del sur': 'kr',
      'costa de marfil': 'ci',
      'costa rica': 'cr',
      croacia: 'hr',
      cuba: 'cu',
      dinamarca: 'dk',
      dominica: 'dm',
      ecuador: 'ec',
      egipto: 'eg',
      'el salvador': 'sv',
      'emiratos arabes unidos': 'ae',
      eritrea: 'er',
      eslovaquia: 'sk',
      eslovenia: 'si',
      espana: 'es',
      spain: 'es',
      'estados unidos': 'us',
      estonia: 'ee',
      esuatini: 'sz',
      etiopia: 'et',
      filipinas: 'ph',
      finlandia: 'fi',
      fiyi: 'fj',
      francia: 'fr',
      gabon: 'ga',
      gambia: 'gm',
      georgia: 'ge',
      ghana: 'gh',
      granada: 'gd',
      grecia: 'gr',
      guatemala: 'gt',
      guinea: 'gn',
      'guinea ecuatorial': 'gq',
      'guinea-bisau': 'gw',
      guyana: 'gy',
      haiti: 'ht',
      honduras: 'hn',
      hungria: 'hu',
      india: 'in',
      indonesia: 'id',
      irak: 'iq',
      iran: 'ir',
      irlanda: 'ie',
      islandia: 'is',
      'islas marshall': 'mh',
      'islas salomon': 'sb',
      israel: 'il',
      italia: 'it',
      italy: 'it',
      jamaica: 'jm',
      japon: 'jp',
      jordania: 'jo',
      kazajistan: 'kz',
      kenia: 'ke',
      kirguistan: 'kg',
      kiribati: 'ki',
      kuwait: 'kw',
      laos: 'la',
      lesoto: 'ls',
      letonia: 'lv',
      libano: 'lb',
      liberia: 'lr',
      libia: 'ly',
      liechtenstein: 'li',
      lituania: 'lt',
      luxemburgo: 'lu',
      madagascar: 'mg',
      malasia: 'my',
      malaui: 'mw',
      maldivas: 'mv',
      mali: 'ml',
      malta: 'mt',
      marruecos: 'ma',
      mauricio: 'mu',
      mauritania: 'mr',
      mexico: 'mx',
      micronesia: 'fm',
      moldavia: 'md',
      monaco: 'mc',
      mongolia: 'mn',
      montenegro: 'me',
      mozambique: 'mz',
      namibia: 'na',
      nauru: 'nr',
      nepal: 'np',
      nicaragua: 'ni',
      niger: 'ne',
      nigeria: 'ng',
      noruega: 'no',
      'nueva zelanda': 'nz',
      oman: 'om',
      'paises bajos': 'nl',
      pakistan: 'pk',
      palaos: 'pw',
      panama: 'pa',
      'papua nueva guinea': 'pg',
      paraguay: 'py',
      peru: 'pe',
      polonia: 'pl',
      portugal: 'pt',
      'reino unido': 'gb',
      inglaterra: 'gb-eng',
      'republica centroafricana': 'cf',
      'republica checa': 'cz',
      'republica democratica del congo': 'cd',
      'republica dominicana': 'do',
      ruanda: 'rw',
      rumania: 'ro',
      rusia: 'ru',
      samoa: 'ws',
      'san cristobal y nieves': 'kn',
      'san marino': 'sm',
      'san vicente y las granadinas': 'vc',
      'santa lucia': 'lc',
      'santo tome y principe': 'st',
      senegal: 'sn',
      serbia: 'rs',
      seychelles: 'sc',
      'sierra leona': 'sl',
      singapur: 'sg',
      siria: 'sy',
      somalia: 'so',
      'sri lanka': 'lk',
      sudafrica: 'za',
      sudan: 'sd',
      'sudan del sur': 'ss',
      suecia: 'se',
      suiza: 'ch',
      surinam: 'sr',
      tailandia: 'th',
      tanzania: 'tz',
      tayikistan: 'tj',
      'timor oriental': 'tl',
      togo: 'tg',
      tonga: 'to',
      'trinidad y tobago': 'tt',
      tunez: 'tn',
      turkmenistan: 'tm',
      turquia: 'tr',
      tuvalu: 'tv',
      ucrania: 'ua',
      uganda: 'ug',
      uruguay: 'uy',
      uzbekistan: 'uz',
      vanuatu: 'vu',
      vaticano: 'va',
      venezuela: 've',
      vietnam: 'vn',
      yemen: 'ye',
      yibuti: 'dj',
      zambia: 'zm',
      zimbabue: 'zw',
    };

    const isoCode = countryIsoMap[strCountry] || 'xx';
    return `https://flagcdn.com/w40/${isoCode}.png`;
  }
  // --- Países ---
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

  isCountryOpen = false;

  toggleCountryDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isCountryOpen = !this.isCountryOpen;
    this.isCalendarOpen = false;
    this.isMonthOpen = false;
    this.isYearOpen = false;
    this.isStadiumFocused.set(false);
    this.isChampionshipsFocused.set(false);

    if (!this.isCountryOpen) {
      this.formulario.controls['country'].markAsTouched();
    }
  }

  selectCountry(country: string) {
    this.formulario.controls['country'].setValue(country);
    this.formulario.controls['country'].markAsTouched();
    this.isCountryOpen = false;
  }

  removeShield(event: Event) {
    event.stopPropagation();
    this.formulario.patchValue({ shield: '' });
  }

  // --- Estadio ---
  stadiums = [
    { id: 1, name: 'Estadio Monumental' },
    { id: 2, name: 'La Bombonera' },
    { id: 3, name: 'Estadio Mario Alberto Kempes' },
  ];

  stadiumSearchText = signal<string>('');
  isStadiumFocused = signal<boolean>(false);

  filteredStadiums = computed(() => {
    const search = this.stadiumSearchText().toLowerCase().trim();
    if (!search) return [];
    return this.stadiums.filter((s) => s.name.toLowerCase().includes(search));
  });

  get selectedStadiumObject() {
    const selectedId = this.formulario.controls['stadiumID'].value;
    if (!selectedId) return null;
    return this.stadiums.find((s) => s.id.toString() === selectedId.toString()) || null;
  }

  selectStadiumFromSearch(stadiumId: number, event?: Event) {
    if (event) event.stopPropagation();
    this.formulario.controls['stadiumID'].setValue(stadiumId.toString());
    this.formulario.controls['stadiumID'].markAsTouched();
    this.stadiumSearchText.set('');
    this.isStadiumFocused.set(false);
  }

  removeStadium() {
    this.formulario.controls['stadiumID'].setValue('');
    this.formulario.controls['stadiumID'].markAsTouched();
    this.stadiumSearchText.set('');
  }

  // --- Campeonatos ---
  // Los ids se guardan tal cual vienen y se comparan como texto: hay campeonatos
  // con id alfanumérico (ej. "37Ug3LyjWg8") que con Number() quedaban en NaN.
  championships = this.championshipService.championships;
  championshipSearchText = signal<string>('');
  isChampionshipsFocused = signal<boolean>(false);
  selectedChampionshipIds = signal<(number | string)[]>([]);

  selectedChampionshipsCount = computed(() => this.selectedChampionshipIds().length);

  private isSelected(id: number | string | undefined): boolean {
    return this.selectedChampionshipIds().some((x) => String(x) === String(id));
  }

  selectedChampionshipsList = computed(() =>
    this.championships().filter((c) => c.id !== undefined && this.isSelected(c.id)),
  );

  filteredChampionships = computed(() => {
    const search = this.championshipSearchText().toLowerCase().trim();
    if (!search) return [];
    return this.championships().filter(
      (c) => c.id !== undefined && c.name.toLowerCase().includes(search) && !this.isSelected(c.id),
    );
  });

  /**
   * Un equipo juega una sola liga: si ya eligió un campeonato de tipo LIGA,
   * las demás ligas quedan bloqueadas (las copas no tienen límite).
   * Devuelve el nombre de la liga ya elegida, o null si se puede agregar.
   */
  blockingLeagueFor(champ: { type?: string; id?: number | string }): string | null {
    if (champ.type !== 'LIGA') return null;
    const chosen = this.selectedChampionshipsList().find(
      (c) => c.type === 'LIGA' && String(c.id) !== String(champ.id),
    );
    return chosen ? chosen.name : null;
  }

  addChampionship(championshipId: number | string | undefined, event?: Event) {
    if (event) event.stopPropagation();
    if (championshipId === undefined) return;

    const champ = this.championships().find((c) => String(c.id) === String(championshipId));
    if (champ && this.blockingLeagueFor(champ)) return;

    if (!this.isSelected(championshipId)) {
      const updated = [...this.selectedChampionshipIds(), championshipId];
      this.selectedChampionshipIds.set(updated);
      this.formulario.controls['championshipsActive'].setValue(updated as number[]);
      this.formulario.controls['championshipsActive'].markAsTouched();
    }
    this.championshipSearchText.set('');
    this.isChampionshipsFocused.set(false);
  }

  removeChampionship(championshipId: number | string | undefined) {
    if (championshipId === undefined) return;

    const updated = this.selectedChampionshipIds().filter(
      (x) => String(x) !== String(championshipId),
    );
    this.selectedChampionshipIds.set(updated);
    this.formulario.controls['championshipsActive'].setValue(updated as number[]);
    this.formulario.controls['championshipsActive'].markAsTouched();
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

  toggleCalendar(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isCalendarOpen = !this.isCalendarOpen;
    this.isCountryOpen = false;
    this.isStadiumFocused.set(false);
    this.isChampionshipsFocused.set(false);

    if (!this.isCalendarOpen) {
      this.isMonthOpen = false;
      this.isYearOpen = false;
      this.formulario.controls['yearOfFoundation'].markAsTouched();
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
    this.formulario.controls['yearOfFoundation'].setValue(`${year}-${month}-${day}`);
    this.formulario.controls['yearOfFoundation'].markAsTouched();
    this.isCalendarOpen = false;
    this.isMonthOpen = false;
    this.isYearOpen = false;
  }

  isDaySelected(date: Date): boolean {
    const currentValue = this.formulario.controls['yearOfFoundation'].value;
    if (!currentValue) return false;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return currentValue === `${year}-${month}-${day}`;
  }

  get formattedSelectedDate(): string {
    const val = this.formulario.controls['yearOfFoundation'].value;
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    const d = new Date(val);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
}
