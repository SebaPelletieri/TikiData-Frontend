import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export type Position = 'ARQ' | 'DEF' | 'MED' | 'DEL';

export interface Player {
  id?: number;
  name: string;
  photo: string;
  age: number;
  position: Position;
  currentTeamID?: number;
  bithDate: string;
  nacionality: string;
  preferredFoot: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

interface CalendarDay {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-player-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './player-form.html',
  styleUrls: ['./player-form.css'],
})
export class PlayerForm implements OnInit {
  private fb = inject(FormBuilder);
  formulario!: FormGroup;

  positions: { value: Position; label: string }[] = [
    { value: 'ARQ', label: 'Arquero (ARQ)' },
    { value: 'DEF', label: 'Defensor (DEF)' },
    { value: 'MED', label: 'Mediocampista (MED)' },
    { value: 'DEL', label: 'Delantero (DEL)' },
  ];

  preferredFeet: string[] = ['Derecho', 'Izquierdo', 'Ambidiestro'];

  isPositionOpen: boolean = false;
  isFootOpen: boolean = false;

  isCalendarOpen: boolean = false;
  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  yearsList: number[] = [];
  monthsNames: string[] = [
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

  photoPreview: string | null = null;

  ngOnInit(): void {
    this.initForm();
    this.generateYearsList();
    this.generateCalendar();
  }

  initForm(): void {
    this.formulario = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      photo: ['', [Validators.required]],
      age: [{ value: '', disabled: true }, [Validators.required, Validators.min(10)]],
      position: ['', [Validators.required]],
      currentTeamID: [null],
      bithDate: ['', [Validators.required]],
      nacionality: ['', [Validators.required, Validators.minLength(3)]],
      preferredFoot: ['', [Validators.required]],

      matchesPlayed: [0, [Validators.required, Validators.min(0)]],
      goals: [0, [Validators.required, Validators.min(0)]],
      assists: [0, [Validators.required, Validators.min(0)]],
      yellowCards: [0, [Validators.required, Validators.min(0)]],
      redCards: [0, [Validators.required, Validators.min(0)]],
    });
  }

  cancel(): void {
    this.formulario.reset({
      name: '',
      photo: '',
      age: '',
      position: '',
      currentTeamID: null,
      bithDate: '',
      nacionality: '',
      preferredFoot: '',
      matchesPlayed: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
    });
    this.photoPreview = null;
    this.isCalendarOpen = false;
    this.isPositionOpen = false;
    this.isFootOpen = false;
  }

  generateYearsList(): void {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear; y >= 1950; y--) {
      years.push(y);
    }
    this.yearsList = years;
  }

  // --- CALENDARIO & EDAD ---
  toggleCalendar(): void {
    this.isCalendarOpen = !this.isCalendarOpen;
    this.isPositionOpen = false;
    this.isFootOpen = false;

    if (!this.isCalendarOpen) {
      this.formulario.controls['bithDate'].markAsTouched();
    }
  }

  selectDate(date: Date): void {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const today = new Date();
    let calculatedAge = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      calculatedAge--;
    }

    this.formulario.patchValue({
      bithDate: formattedDate,
      age: calculatedAge,
    });
    this.formulario.controls['bithDate'].markAsTouched();
    this.isCalendarOpen = false;
  }

  isSelected(date: Date): boolean {
    const val = this.formulario.controls['bithDate'].value;
    if (!val) return false;
    const [y, m, d] = val.split('-').map(Number);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  }

  get formattedBirthDate(): string {
    const val = this.formulario.controls['bithDate'].value;
    if (!val) return '';
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
  }

  onMonthChange(monthIndex: any): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), Number(monthIndex), 1);
    this.generateCalendar();
  }

  onYearChange(year: any): void {
    this.currentDate = new Date(Number(year), this.currentDate.getMonth(), 1);
    this.generateCalendar();
  }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysPrevMonth = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    // Días del mes anterior para alinear con Domingo como primer día
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: totalDaysPrevMonth - i,
        date: new Date(year, month - 1, totalDaysPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Días del mes corriente
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        day: i,
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Días del mes siguiente para completar la cuadrícula de 42 días (6 filas x 7 cols)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    this.calendarDays = days;
  }

  // --- DROPDOWNS ---
  togglePositionDropdown(): void {
    this.isPositionOpen = !this.isPositionOpen;
    this.isFootOpen = false;
    this.isCalendarOpen = false;
    if (!this.isPositionOpen) {
      this.formulario.controls['position'].markAsTouched();
    }
  }

  selectPosition(pos: Position): void {
    this.formulario.controls['position'].setValue(pos);
    this.formulario.controls['position'].markAsTouched();
    this.isPositionOpen = false;
  }

  get selectedPositionLabel(): string {
    const val = this.formulario.controls['position'].value;
    return this.positions.find((p) => p.value === val)?.label || '';
  }

  toggleFootDropdown(): void {
    this.isFootOpen = !this.isFootOpen;
    this.isPositionOpen = false;
    this.isCalendarOpen = false;
    if (!this.isFootOpen) {
      this.formulario.controls['preferredFoot'].markAsTouched();
    }
  }

  selectFoot(foot: string): void {
    this.formulario.controls['preferredFoot'].setValue(foot);
    this.formulario.controls['preferredFoot'].markAsTouched();
    this.isFootOpen = false;
  }

  // --- FOTO ---
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
        this.formulario.patchValue({ photo: this.photoPreview });
        this.formulario.controls['photo'].markAsTouched();
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(event: Event): void {
    event.stopPropagation();
    this.photoPreview = null;
    this.formulario.patchValue({ photo: '' });
  }

  savePlayer(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const raw = this.formulario.getRawValue();
    const newPlayer: Player = {
      ...raw,
      name: raw.name.trim(),
      nacionality: raw.nacionality.trim(),
      matchesPlayed: Number(raw.matchesPlayed) || 0,
      goals: Number(raw.goals) || 0,
      assists: Number(raw.assists) || 0,
      yellowCards: Number(raw.yellowCards) || 0,
      redCards: Number(raw.redCards) || 0,
    };

    console.log('Jugador a guardar:', newPlayer);
  }

  onNumericInput(controlName: string, event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const onlyDigits = inputEl.value.replace(/\D/g, '');
    const numValue = onlyDigits === '' ? 0 : Number(onlyDigits);
    inputEl.value = onlyDigits;
    this.formulario.get(controlName)?.setValue(numValue);
  }

  onNameInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const onlyLetters = inputEl.value.replace(/[0-9]/g, '');
    inputEl.value = onlyLetters;
    this.formulario.get('name')?.setValue(onlyLetters);
  }
}
