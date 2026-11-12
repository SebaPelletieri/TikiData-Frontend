import { Component, OnInit, Output, EventEmitter, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchService } from '../../services/match-service';
import { TeamService } from '../../services/team-service';
import { ChampionshipService } from '../../services/championship-service';
import { Match, Status } from '../../models/Match';

@Component({
  selector: 'app-match-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './match-form.html',
  styleUrls: ['./match-form.css'],
})
export class MatchForm implements OnInit {
  private matchService = inject(MatchService);
  public teamService = inject(TeamService);
  public championshipService = inject(ChampionshipService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @Output() closePanel = new EventEmitter<void>();

  matchIdInput = input<string | number>();

  isEditing = false;
  errorMessage = '';

  matchData: Match = {
    localTeamID: 0,
    awayTeamID: 0,
    championshipID: 0,
    date: '',
    localGoals: 0,
    awayGoals: 0,
    status: 'Programado' as Status,
    stadium: '',
  };

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
  weekDays = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SÁ'];
  yearsList: number[] = [];
  calendarDays: any[] = [];
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

  // --- BÚSQUEDAS DINÁMICAS ---
  championshipSearchQuery = '';
  showChampionshipDropdown = false;
  filteredChampionships = signal<any[]>([]);

  localTeamSearchQuery = '';
  showLocalDropdown = false;
  filteredLocalTeams = signal<any[]>([]);

  awayTeamSearchQuery = '';
  showAwayDropdown = false;
  filteredAwayTeams = signal<any[]>([]);

  stadiumSearchQuery = '';
  showStadiumDropdown = false;
  filteredStadiums = signal<string[]>([]);

  availableStadiums: string[] = [
    'Más Monumental',
    'La Bombonera',
    'Cilindro de Avellaneda',
    'Libertadores de América',
    'Estadio Único de La Plata',
    'Gigante de Arroyito',
  ];

  ngOnInit(): void {
    const currentY = new Date().getFullYear();
    for (let y = currentY; y <= currentY + 5; y++) {
      this.yearsList.push(y);
    }

    this.today.setHours(0, 0, 0, 0);
    this.generateCalendarDays();
    this.teamService.getAll();
    this.championshipService.getAll();

    const idFromRoute = this.route.snapshot.paramMap.get('id') || this.matchIdInput();

    if (idFromRoute) {
      this.isEditing = true;
      const numericId = Number(idFromRoute);

      this.matchService.getById(numericId).subscribe({
        next: (match) => {
          if (match && match.date) {
            this.matchData = { ...match };
            const d = new Date(match.date);
            if (!isNaN(d.getTime())) {
              this.selectedDate = d;
              this.currentMonth = d.getMonth();
              this.currentYear = d.getFullYear();
              this.selectedHour = String(d.getHours()).padStart(2, '0');
              this.selectedMinute = String(d.getMinutes()).padStart(2, '0');
              this.generateCalendarDays();
            }

            if (match.championshipID) {
              const champ = this.championshipService
                .championships()
                .find((c) => c.id === match.championshipID);
              if (champ) this.championshipSearchQuery = champ.name;
            }
            if (match.localTeamID) {
              const team = this.teamService.teams().find((t) => t.id === match.localTeamID);
              if (team) this.localTeamSearchQuery = team.name;
            }
            if (match.awayTeamID) {
              const team = this.teamService.teams().find((t) => t.id === match.awayTeamID);
              if (team) this.awayTeamSearchQuery = team.name;
            }
            if (match.stadium) {
              this.stadiumSearchQuery = match.stadium;
            }
          }
        },
        error: (err) => console.error('Error al cargar partido para editar:', err),
      });
    }
  }

  // --- MÉTODOS DEL CALENDARIO Y HORA ---
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
  }

  toggleMonthDropdown() {
    this.isMonthOpen = !this.isMonthOpen;
    this.isYearOpen = false;
    this.isTimeOpen = false;
  }

  toggleYearDropdown() {
    this.isYearOpen = !this.isYearOpen;
    this.isMonthOpen = false;
    this.isTimeOpen = false;
  }

  toggleTimeDropdown() {
    this.isTimeOpen = !this.isTimeOpen;
    this.isMonthOpen = false;
    this.isYearOpen = false;
  }

  selectMonth(monthIndex: number) {
    this.currentMonth = monthIndex;
    this.isMonthOpen = false;
    this.generateCalendarDays();
  }

  selectYear(year: number) {
    this.currentYear = year;
    this.isYearOpen = false;
    this.generateCalendarDays();
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
    this.generateCalendarDays();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendarDays();
  }

  generateCalendarDays() {
    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const prevTotalDays = new Date(this.currentYear, this.currentMonth, 0).getDate();

    let days = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevTotalDays - i;
      const prevMonth_ = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
      const prevYear_ = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
      days.push({
        day: dayNum,
        date: new Date(prevYear_, prevMonth_, dayNum),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        date: new Date(this.currentYear, this.currentMonth, i),
        isCurrentMonth: true,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonth_ = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
      const nextYear_ = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
      days.push({ day: i, date: new Date(nextYear_, nextMonth_, i), isCurrentMonth: false });
    }

    this.calendarDays = days;
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
    if (this.isDayDisabled(date)) return;
    this.selectedDate = new Date(date);
    this.updateMatchDateTimeString();
  }

  updateMatchDateTimeString() {
    if (!this.selectedDate) return;
    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(this.selectedDate.getDate()).padStart(2, '0');
    this.matchData.date = `${year}-${month}-${day}T${this.selectedHour}:${this.selectedMinute}`;
  }

  // --- BÚSQUEDAS DINÁMICAS ---
  onSearchChampionships() {
    const query = this.championshipSearchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredChampionships.set([]);
      this.showChampionshipDropdown = false;
      return;
    }
    const matches = this.championshipService
      .championships()
      .filter((c) => c.name.toLowerCase().includes(query));
    this.filteredChampionships.set(matches);
    this.showChampionshipDropdown = matches.length > 0;
  }

  selectChampionship(champ: any) {
    this.matchData.championshipID = champ.id;
    this.championshipSearchQuery = champ.name;
    this.showChampionshipDropdown = false;
  }

  onSearchLocalTeam() {
    const query = this.localTeamSearchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredLocalTeams.set([]);
      this.showLocalDropdown = false;
      return;
    }
    const matches = this.teamService.teams().filter((t) => t.name.toLowerCase().includes(query));
    this.filteredLocalTeams.set(matches);
    this.showLocalDropdown = matches.length > 0;
  }

  selectLocalTeam(team: any) {
    this.matchData.localTeamID = team.id;
    this.localTeamSearchQuery = team.name;
    this.showLocalDropdown = false;
  }

  onSearchAwayTeam() {
    const query = this.awayTeamSearchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredAwayTeams.set([]);
      this.showAwayDropdown = false;
      return;
    }
    const matches = this.teamService.teams().filter((t) => t.name.toLowerCase().includes(query));
    this.filteredAwayTeams.set(matches);
    this.showAwayDropdown = matches.length > 0;
  }

  selectAwayTeam(team: any) {
    this.matchData.awayTeamID = team.id;
    this.awayTeamSearchQuery = team.name;
    this.showAwayDropdown = false;
  }

  onSearchStadiums() {
    const query = this.stadiumSearchQuery.toLowerCase().trim();
    this.matchData.stadium = this.stadiumSearchQuery;
    if (!query) {
      this.filteredStadiums.set([]);
      this.showStadiumDropdown = false;
      return;
    }
    const matches = this.availableStadiums.filter((s) => s.toLowerCase().includes(query));
    this.filteredStadiums.set(matches);
    this.showStadiumDropdown = matches.length > 0;
  }

  selectStadium(stadiumName: string) {
    this.matchData.stadium = stadiumName;
    this.stadiumSearchQuery = stadiumName;
    this.showStadiumDropdown = false;
  }

  saveMatch(): void {
    if (
      !this.matchData.localTeamID ||
      !this.matchData.awayTeamID ||
      !this.matchData.championshipID ||
      !this.matchData.date
    ) {
      this.errorMessage =
        'Por favor completa los campos obligatorios (Campeonato, Fecha y Equipos).';
      return;
    }

    if (this.matchData.localTeamID === this.matchData.awayTeamID) {
      this.errorMessage = 'El equipo local y visitante no pueden ser el mismo.';
      return;
    }

    this.matchData.status = 'Programado' as Status;

    if (this.isEditing && this.matchData.id) {
      this.matchService.updateMatch(Number(this.matchData.id), this.matchData).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => {
          console.error('Error al actualizar:', err);
          this.errorMessage = 'Error al actualizar el partido.';
        },
      });
    } else {
      this.matchService.createMatch(this.matchData).subscribe({
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
    this.closePanel.emit();
    if (this.isEditing && this.route.snapshot.paramMap.get('id')) {
      this.router.navigate(['/admin']);
    }
  }
}
