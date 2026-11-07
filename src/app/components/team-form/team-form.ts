import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TeamService } from '../../services/team-service';
import { Team } from '../../models/Team';

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
})
export class TeamForm {
  teamService = inject(TeamService);
  fb = inject(FormBuilder);

  formulario = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    shield: ['', [Validators.required]],
    country: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    yearOfFoundation: ['', [Validators.required]],
    championshipsActive: [<number[]>[], [Validators.required]],
    stadiumID: ['', [Validators.required]],
  });

  saveTeam() {
    let teamActual: Team = {
      name: this.formulario.controls['name'].value,
      shield: this.formulario.controls['shield'].value,
      country: this.formulario.controls['country'].value,
      yearOfFoundation: new Date(this.formulario.controls['yearOfFoundation'].value),
      championshipsActive: this.formulario.controls['championshipsActive'].value,
      stadiumID: Number(this.formulario.controls['stadiumID'].value),
      playerIDs: [],
    };
    this.teamService.saveTeam(teamActual);
    this.formulario.reset();
    this.shieldPreview = null;
  }

  cancel() {
    this.formulario.reset();
    this.shieldPreview = null;
  }

  // --- PAÍSES ---
  countries = ['Argentina', 'Brasil', 'Uruguay', 'Chile'];
  isCountryOpen = false;

  // En tu clase TeamForm:
  isCountryInvalid(): boolean {
    const control = this.formulario.controls['country'];
    return !!(control.touched && control.invalid);
  }

  toggleCountryDropdown(): void {
    this.isCountryOpen = !this.isCountryOpen;
    this.isStadiumOpen = false;
    this.isChampionshipsOpen = false;
    this.isCalendarOpen = false;

    // Si se cierra sin elegir opción, marca el error
    if (!this.isCountryOpen) {
      this.formulario.controls['country'].markAsTouched();
    }
  }

  selectCountry(country: string) {
    this.formulario.controls['country'].setValue(country);
    this.formulario.controls['country'].markAsTouched();
    this.isCountryOpen = false;
  }

  // --- ESCUDO ---
  shieldPreview: string | null = null;

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.shieldPreview = reader.result as string;
        this.formulario.patchValue({ shield: this.shieldPreview });
      };
      reader.readAsDataURL(file);
    }
  }

  removeShield(event: Event) {
    event.stopPropagation();
    this.shieldPreview = null;
    this.formulario.patchValue({ shield: '' });
  }

  // --- ESTADIO ---
  stadiums = [
    { id: 1, name: 'Estadio Monumental' },
    { id: 2, name: 'La Bombonera' },
    { id: 3, name: 'Estadio Mario Alberto Kempes' },
  ];
  isStadiumOpen = false;

  toggleStadiumDropdown() {
    this.isStadiumOpen = !this.isStadiumOpen;
    this.isCountryOpen = false;
    this.isChampionshipsOpen = false;
    this.isCalendarOpen = false;
    if (!this.isStadiumOpen) {
      this.formulario.controls['stadiumID'].markAsTouched();
    }
  }

  selectStadium(stadiumId: number) {
    this.formulario.controls['stadiumID'].setValue(stadiumId.toString());
    this.formulario.controls['stadiumID'].markAsTouched();
    this.isStadiumOpen = false;
  }

  get selectedStadiumName(): string | undefined {
    const selectedId = this.formulario.controls['stadiumID'].value;
    return this.stadiums.find((s) => s.id.toString() === selectedId.toString())?.name;
  }

  // --- CAMPEONATOS ACTIVOS ---
  championships = [
    { id: 1, name: 'Liga Profesional' },
    { id: 2, name: 'Copa Libertadores' },
    { id: 3, name: 'Copa Argentina' },
  ];
  isChampionshipsOpen = false;

  toggleChampionshipsDropdown() {
    this.isChampionshipsOpen = !this.isChampionshipsOpen;
    this.isCountryOpen = false;
    this.isStadiumOpen = false;
    this.isCalendarOpen = false;
    if (!this.isChampionshipsOpen) {
      this.formulario.controls['championshipsActive'].markAsTouched();
    }
  }

  toggleChampionship(championshipId: number) {
    const current: number[] = [...(this.formulario.controls['championshipsActive'].value || [])];
    const index = current.indexOf(championshipId);

    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(championshipId);
    }

    this.formulario.controls['championshipsActive'].setValue(current);
    this.formulario.controls['championshipsActive'].markAsTouched();
  }

  isChampionshipSelected(championshipId: number): boolean {
    const current: number[] = this.formulario.controls['championshipsActive'].value || [];
    return current.includes(championshipId);
  }

  // --- CALENDARIO INTERACTIVO ---
  isCalendarOpen = false;
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

  toggleCalendar(): void {
    this.isCalendarOpen = !this.isCalendarOpen;
    this.isCountryOpen = false;
    this.isStadiumOpen = false;
    this.isChampionshipsOpen = false;
    if (!this.isCalendarOpen) {
      this.formulario.controls['yearOfFoundation'].markAsTouched();
    }
  }

  onMonthChange(monthIndex: any): void {
    this.currentMonth = Number(monthIndex);
  }

  onYearChange(year: any): void {
    this.currentYear = Number(year);
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

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  selectDate(date: Date): void {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    this.formulario.controls['yearOfFoundation'].setValue(formattedDate);
    this.formulario.controls['yearOfFoundation'].markAsTouched();
    this.isCalendarOpen = false;
  }

  isDaySelected(date: Date): boolean {
    const currentValue = this.formulario.controls['yearOfFoundation'].value;
    if (!currentValue) return false;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;

    return currentValue === formatted;
  }

  get formattedSelectedDate(): string {
    const val = this.formulario.controls['yearOfFoundation'].value;
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  }
}
