import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { TeamService } from '../../services/team-service';
import { Team } from '../../models/Team';

@Component({
  imports: [ReactiveFormsModule, FormsModule],
  selector: 'app-team-form',
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
  }

  cancel() {
    this.formulario.reset();
  }

  // Define las opciones de países en tu clase
  countries = ['Argentina', 'Brasil', 'Uruguay', 'Chile'];
  isCountryOpen = false;

  toggleCountryDropdown() {
    this.isCountryOpen = !this.isCountryOpen;
  }

  selectCountry(country: string) {
    this.formulario.get('country')?.setValue(country);
    this.formulario.get('country')?.markAsTouched();
    this.isCountryOpen = false;
  }

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
  }

  // --- ESTADOS Y MÉTODOS PARA ESTADIO ---
  // Lista de ejemplo si aún no la recibes desde un servicio:
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
    if (!this.isStadiumOpen) {
      this.formulario.controls.stadiumID.markAsTouched();
    }
  }

  selectStadium(stadiumId: number) {
    this.formulario.controls.stadiumID.setValue(stadiumId.toString());
    this.formulario.controls.stadiumID.markAsTouched();
    this.isStadiumOpen = false;
  }

  get selectedStadiumName(): string | undefined {
    const selectedId = this.formulario.controls.stadiumID.value;
    return this.stadiums.find((s) => s.id.toString() === selectedId.toString())?.name;
  }

  // --- ESTADOS Y MÉTODOS PARA CAMPEONATOS ACTIVOS ---
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
    if (!this.isChampionshipsOpen) {
      this.formulario.controls.championshipsActive.markAsTouched();
    }
  }

  toggleChampionship(championshipId: number) {
    const current: number[] = [...(this.formulario.controls.championshipsActive.value || [])];
    const index = current.indexOf(championshipId);

    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(championshipId);
    }

    this.formulario.controls.championshipsActive.setValue(current);
    this.formulario.controls.championshipsActive.markAsTouched();
  }

  isChampionshipSelected(championshipId: number): boolean {
    const current: number[] = this.formulario.controls.championshipsActive.value || [];
    return current.includes(championshipId);
  }

  // Agrega estas propiedades y métodos en tu clase TeamForm:

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

  toggleCalendar(): void {
    this.isCalendarOpen = !this.isCalendarOpen;
    this.isCountryOpen = false;
    this.isStadiumOpen = false;
    this.isChampionshipsOpen = false;
    if (!this.isCalendarOpen) {
      this.formulario.controls.yearOfFoundation.markAsTouched();
    }
  }

  // Genera los días correspondientes al mes y año actuales
  get calendarDays(): { day: number; date: Date; isCurrentMonth: boolean }[] {
    const days: { day: number; date: Date; isCurrentMonth: boolean }[] = [];
    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const lastDateCurrentMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const lastDatePrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

    // Días del mes previo para rellenar la primera semana
    for (let i = firstDayIndex; i > 0; i--) {
      const day = lastDatePrevMonth - i + 1;
      days.push({
        day,
        date: new Date(this.currentYear, this.currentMonth - 1, day),
        isCurrentMonth: false,
      });
    }

    // Días del mes actual
    for (let i = 1; i <= lastDateCurrentMonth; i++) {
      days.push({
        day: i,
        date: new Date(this.currentYear, this.currentMonth, i),
        isCurrentMonth: true,
      });
    }

    // Completar hasta la cuadrícula de 35 o 42 casillas
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

    this.formulario.controls.yearOfFoundation.setValue(formattedDate);
    this.formulario.controls.yearOfFoundation.markAsTouched();
    this.isCalendarOpen = false;
  }

  isSelectedDate(date: Date): boolean {
    const currentVal = this.formulario.controls.yearOfFoundation.value;
    if (!currentVal) return false;
    const d = new Date(currentVal);
    return (
      d.getDate() === date.getDate() &&
      d.getMonth() === date.getMonth() &&
      d.getFullYear() === date.getFullYear()
    );
  }

  get formattedSelectedDate(): string {
    const val = this.formulario.controls.yearOfFoundation.value;
    if (!val) return '';
    const d = new Date(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  }

  isDaySelected(date: Date): boolean {
    const currentValue = this.formulario.controls.yearOfFoundation.value;
    if (!currentValue) return false;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;

    return currentValue === formatted;
  }
}
