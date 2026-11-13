import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlayerService } from '../../services/player-service';
import { Player, Position } from '../../models/Player';

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
  public playerService = inject(PlayerService);

  @Output() closePanel = new EventEmitter<void>();

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
      birthDate: ['', [Validators.required]],
      nationality: ['', [Validators.required, Validators.minLength(3)]],
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
      birthDate: '',
      nationality: '',
      preferredFoot: '',
      matchesPlayed: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
    });
    this.isCalendarOpen = false;
    this.isPositionOpen = false;
    this.isFootOpen = false;
    this.closePanel.emit();
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
      this.formulario.controls['birthDate'].markAsTouched();
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
      birthDate: formattedDate,
      age: calculatedAge,
    });
    this.formulario.controls['birthDate'].markAsTouched();
    this.isCalendarOpen = false;
  }

  isSelected(date: Date): boolean {
    const val = this.formulario.controls['birthDate'].value;
    if (!val) return false;
    const [y, m, d] = val.split('-').map(Number);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  }

  get formattedBirthDate(): string {
    const val = this.formulario.controls['birthDate'].value;
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

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysPrevMonth = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: totalDaysPrevMonth - i,
        date: new Date(year, month - 1, totalDaysPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        day: i,
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

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

  // --- FOTO (URL) ---
  removePhoto(event: Event): void {
    event.stopPropagation();
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
      nationality: raw.nationality.trim(),
      birthDate: raw.birthDate,
      matchesPlayed: Number(raw.matchesPlayed) || 0,
      goals: Number(raw.goals) || 0,
      assists: Number(raw.assists) || 0,
      yellowCards: Number(raw.yellowCards) || 0,
      redCards: Number(raw.redCards) || 0,
    };

    this.playerService.savePlayer(newPlayer);
    this.cancel();
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
