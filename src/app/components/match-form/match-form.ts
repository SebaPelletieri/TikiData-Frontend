import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  inject,
  input,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchService } from '../../services/match-service';
import { TeamService } from '../../services/team-service';
import { ChampionshipService } from '../../services/championship-service';
import { Match, Status } from '../../models/Match';

interface CalendarDay {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-match-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './match-form.html',
  styleUrls: ['./match-form.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchForm implements OnInit {
  private fb = inject(FormBuilder);
  private matchService = inject(MatchService);
  public teamService = inject(TeamService);
  public championshipService = inject(ChampionshipService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @Output() closePanel = new EventEmitter<void>();
  matchIdInput = input<string | number>();

  isEditing = false;
  errorMessage = '';

  matchForm: FormGroup = this.fb.group({
    championshipID: [null, [Validators.required]],
    localTeamID: [null, [Validators.required]],
    awayTeamID: [null, [Validators.required]],
    date: ['', [Validators.required]],
    stadium: ['', [Validators.required]],
    localGoals: [0],
    awayGoals: [0],
    status: ['Programado'],
  });

  // --- LÓGICA DEL CALENDARIO Y HORA ---
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
    for (let y = current; y <= current + 5; y++) {
      years.push(y);
    }
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

  // --- BÚSQUEDAS DINÁMICAS (Señales) ---
  championshipSearchText = signal<string>('');
  isChampionshipFocused = signal<boolean>(false);

  localTeamSearchText = signal<string>('');
  isLocalFocused = signal<boolean>(false);

  awayTeamSearchText = signal<string>('');
  isAwayFocused = signal<boolean>(false);

  stadiumSearchText = signal<string>('');
  isStadiumFocused = signal<boolean>(false);

  availableStadiums: string[] = [
    'Más Monumental',
    'La Bombonera',
    'Cilindro de Avellaneda',
    'Libertadores de América',
    'Estadio Único de La Plata',
    'Gigante de Arroyito',
  ];

  get selectedChampionshipObject() {
    const id = this.matchForm.controls['championshipID'].value;
    if (!id) return null;
    return this.championshipService.championships().find((c) => c.id === id);
  }

  get selectedLocalObject() {
    const id = this.matchForm.controls['localTeamID'].value;
    if (!id) return null;
    return this.teamService.teams().find((t) => t.id === id);
  }

  get selectedAwayObject() {
    const id = this.matchForm.controls['awayTeamID'].value;
    if (!id) return null;
    return this.teamService.teams().find((t) => t.id === id);
  }

  filteredChampionships = signal<any[]>([]);
  filteredLocalTeams = signal<any[]>([]);
  filteredAwayTeams = signal<any[]>([]);

  filteredStadiums = computed(() => {
    const search = this.stadiumSearchText().toLowerCase().trim();
    if (!search) return [];
    return this.availableStadiums.filter((s) => s.toLowerCase().includes(search));
  });

  ngOnInit(): void {
    this.today.setHours(0, 0, 0, 0);
    this.teamService.getAll();
    this.championshipService.getAll();

    // Actualizar filtros al escribir en campeonatos
    this.matchForm.controls['championshipID'].valueChanges.subscribe(() => {
      const search = this.championshipSearchText().toLowerCase().trim();
      const matches = this.championshipService
        .championships()
        .filter((c) => c.name.toLowerCase().includes(search));
      this.filteredChampionships.set(matches);
    });

    const idFromRoute = this.route.snapshot.paramMap.get('id') || this.matchIdInput();
    if (idFromRoute) {
      this.isEditing = true;
      const numericId = Number(idFromRoute);

      this.matchService.getById(numericId).subscribe({
        next: (match) => {
          if (match) {
            this.matchForm.patchValue({
              championshipID: match.championshipID,
              localTeamID: match.localTeamID,
              awayTeamID: match.awayTeamID,
              date: match.date,
              stadium: match.stadium || '',
              localGoals: match.localGoals || 0,
              awayGoals: match.awayGoals || 0,
              status: match.status || 'Programado',
            });

            if (match.date) {
              const d = new Date(match.date);
              if (!isNaN(d.getTime())) {
                this.selectedDate = d;
                this.currentMonth = d.getMonth();
                this.currentYear = d.getFullYear();
                this.selectedHour = String(d.getHours()).padStart(2, '0');
                this.selectedMinute = String(d.getMinutes()).padStart(2, '0');
              }
            }
          }
        },
        error: (err) => console.error('Error al cargar partido:', err),
      });
    }
  }

  // --- CALENDARIO Y HORA ---
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
    this.isMonthOpen = false;
    this.isYearOpen = false;
    this.isTimeOpen = false;
    if (!this.isCalendarOpen) {
      this.matchForm.controls['date'].markAsTouched();
    }
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

  isDayDisabled(date: Date): boolean {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < this.today;
  }

  isDaySelected(date: Date): boolean {
    if (!this.selectedDate) return false;
    return (
      date.getDate() === this.selectedDate.getDate() &&
      date.getMonth() === this.selectedDate.getMonth() &&
      date.getFullYear() === this.selectedDate.getFullYear()
    );
  }

  selectDate(date: Date) {
    this.selectedDate = new Date(date);
    this.updateMatchDateTimeString();
    this.isCalendarOpen = false;
  }

  updateMatchDateTimeString() {
    if (!this.selectedDate) return;
    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(this.selectedDate.getDate()).padStart(2, '0');
    const dateTimeStr = `${year}-${month}-${day}T${this.selectedHour}:${this.selectedMinute}`;

    this.matchForm.controls['date'].setValue(dateTimeStr);
    this.matchForm.controls['date'].markAsTouched();
  }

  // --- SELECCIONES Y BÚSQUEDAS ---
  selectChampionship(champ: any) {
    this.matchForm.controls['championshipID'].setValue(champ.id);
    this.matchForm.controls['championshipID'].markAsTouched();
    this.championshipSearchText.set('');
    this.isChampionshipFocused.set(false);
  }

  removeChampionship() {
    this.matchForm.controls['championshipID'].setValue(null);
    this.matchForm.controls['championshipID'].markAsTouched();
    this.championshipSearchText.set('');
  }

  selectLocalTeam(team: any) {
    this.matchForm.controls['localTeamID'].setValue(team.id);
    this.matchForm.controls['localTeamID'].markAsTouched();
    this.localTeamSearchText.set('');
    this.isLocalFocused.set(false);
  }

  removeLocalTeam() {
    this.matchForm.controls['localTeamID'].setValue(null);
    this.matchForm.controls['localTeamID'].markAsTouched();
    this.localTeamSearchText.set('');
  }

  selectAwayTeam(team: any) {
    this.matchForm.controls['awayTeamID'].setValue(team.id);
    this.matchForm.controls['awayTeamID'].markAsTouched();
    this.awayTeamSearchText.set('');
    this.isAwayFocused.set(false);
  }

  removeAwayTeam() {
    this.matchForm.controls['awayTeamID'].setValue(null);
    this.matchForm.controls['awayTeamID'].markAsTouched();
    this.awayTeamSearchText.set('');
  }

  onStadiumInputChange(value: string) {
    this.stadiumSearchText.set(value);
    this.isStadiumFocused.set(true);
    this.matchForm.controls['stadium'].setValue(value);
    this.matchForm.controls['stadium'].markAsTouched();
  }

  selectStadium(stadiumName: string) {
    this.matchForm.controls['stadium'].setValue(stadiumName);
    this.matchForm.controls['stadium'].markAsTouched();
    this.stadiumSearchText.set('');
    this.isStadiumFocused.set(false);
  }

  removeStadium() {
    this.matchForm.controls['stadium'].setValue('');
    this.matchForm.controls['stadium'].markAsTouched();
    this.stadiumSearchText.set('');
  }

  saveMatch(): void {
    if (this.matchForm.invalid) {
      this.matchForm.markAllAsTouched();
      this.errorMessage = 'Por favor completa los campos obligatorios.';
      return;
    }

    const formValues = this.matchForm.value;

    if (formValues.localTeamID === formValues.awayTeamID) {
      this.errorMessage = 'El equipo local y visitante no pueden ser el mismo.';
      return;
    }

    if (this.isEditing && formValues.id) {
      this.matchService.updateMatch(Number(formValues.id), formValues).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => {
          console.error('Error al actualizar:', err);
          this.errorMessage = 'Error al actualizar el partido.';
        },
      });
    } else {
      this.matchService.createMatch(formValues).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => {
          console.error('Error al crear:', err);
          this.errorMessage = 'Error al registrar el partido.';
        },
      });
    }
  }

  handleSuccess(): void {
    this.closePanel.emit();
    if (this.isEditing && this.route.snapshot.paramMap.get('id')) {
      this.router.navigate(['/admin']);
    }
  }

  onCancel(): void {
    this.matchForm.reset({
      championshipID: null,
      localTeamID: null,
      awayTeamID: null,
      date: '',
      stadium: '',
      localGoals: 0,
      awayGoals: 0,
      status: 'Programado',
    });

    this.championshipSearchText.set('');
    this.isChampionshipFocused.set(false);

    this.localTeamSearchText.set('');
    this.isLocalFocused.set(false);

    this.awayTeamSearchText.set('');
    this.isAwayFocused.set(false);

    this.stadiumSearchText.set('');
    this.isStadiumFocused.set(false);

    this.selectedDate = null;
    this.selectedHour = '12';
    this.selectedMinute = '00';
    this.isCalendarOpen = false;
    this.errorMessage = '';

    this.closePanel.emit();

    if (this.isEditing && this.route.snapshot.paramMap.get('id')) {
      this.router.navigate(['/admin']);
    }
  }
}
