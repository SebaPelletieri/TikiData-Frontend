import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  HostListener,
} from '@angular/core';
import { localizedMonths } from '../../i18n/months';
import { LanguageService } from '../../i18n/language-service';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslateOrOriginalPipe } from '../../i18n/data.pipes';
import { CommonModule, Location } from '@angular/common';
import { goBackOr } from '../../utils/navigation';
import {
  CountryOption,
  NATIONALITY_OPTIONS,
  filterCountries,
  getCountryFlag as countryFlagUrl,
} from '../../utils/countries';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlayerService } from '../../services/player-service';
import { uniqueCombinationValidator } from '../../validators/duplicate-validator';
import { Position } from '../../models/Player';

interface CalendarDay {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-player-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslocoPipe, TranslateOrOriginalPipe],
  templateUrl: './player-edit.html',
  styleUrl: './player-edit.css',
})
export class PlayerEdit implements OnInit {
  @Input() playerIdInput!: number | string;
  @Output() closePanel = new EventEmitter<void>();

  private language = inject(LanguageService);

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private playerService = inject(PlayerService);

  playerForm!: FormGroup;
  playerId: number | string | null = null;

  positions: { value: Position; label: string }[] = [
    { value: 'ARQ', label: 'Arquero (ARQ)' },
    { value: 'DEF', label: 'Defensor (DEF)' },
    { value: 'MED', label: 'Mediocampista (MED)' },
    { value: 'DEL', label: 'Delantero (DEL)' },
  ];

  footPreferences = ['Derecho', 'Izquierdo', 'Ambidiestro'];

  // Nacionalidad: lista de países del mundo con bandera y buscador (igual que PlayerForm)
  nationalitySearch = '';
  getCountryFlag = countryFlagUrl;

  get filteredNationalities(): CountryOption[] {
    return filterCountries(NATIONALITY_OPTIONS, this.nationalitySearch);
  }

  get selectedNationality(): string {
    return this.playerForm?.get('nationality')?.value || '';
  }

  get isKnownNationality(): boolean {
    return NATIONALITY_OPTIONS.some((c) => c.value === this.selectedNationality);
  }

  isPositionOpen = false;
  isFootOpen = false;
  isCountryOpen = false;
  isCalendarOpen = false;
  isMonthDropdownOpen = false;
  isYearDropdownOpen = false;

  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  yearsList: number[] = [];
  // Nombres de los meses en el idioma elegido (antes estaban fijos en español)
  get monthsNames(): string[] {
    return localizedMonths(this.language.locale());
  }

  ngOnInit(): void {
    if (this.playerService.players().length === 0) {
      this.playerService.getAll();
    }
    this.initForm();
    this.generateYearsList();
    this.generateCalendar();

    if (this.playerIdInput) {
      this.playerId = this.playerIdInput;
      this.loadPlayerData(this.playerId);
    } else {
      // La URL trae el nombre del jugador; el resolver de la ruta deja el id en data
      this.route.data.subscribe((data) => {
        const id = data['id'] ?? this.route.snapshot.paramMap.get('id');
        if (id) {
          this.playerId = id;
          this.loadPlayerData(id);
        }
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown') && !target.closest('.calendar-field-container')) {
      this.closeAllDropdowns();
    }
  }

  closeAllDropdowns(): void {
    this.isPositionOpen = false;
    this.isFootOpen = false;
    this.isCountryOpen = false;
    this.isCalendarOpen = false;
    this.isMonthDropdownOpen = false;
    this.isYearDropdownOpen = false;
  }

  initForm() {
    this.playerForm = this.fb.group(
      {
        name: ['', Validators.required],
        nationality: ['', Validators.required],
        position: ['', Validators.required],
        birthDate: ['', Validators.required],
        age: [{ value: '', disabled: true }],
        preferredFoot: [''],
        photo: [''],
      },
      {
        validators: [
          uniqueCombinationValidator(
            ['name', 'birthDate'],
            () => this.playerService.players(),
            () => this.playerId,
          ),
        ],
      },
    );
  }

  generateYearsList(): void {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear; y >= 1950; y--) {
      years.push(y);
    }
    this.yearsList = years;
  }

  toggleCalendar(): void {
    this.isCalendarOpen = !this.isCalendarOpen;
    this.isPositionOpen = false;
    this.isFootOpen = false;
    this.isCountryOpen = false;
    this.isMonthDropdownOpen = false;
    this.isYearDropdownOpen = false;

    if (this.isCalendarOpen) {
      const val = this.playerForm.controls['birthDate'].value;
      if (val) {
        const [y, m, d] = val.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m)) {
          this.currentDate = new Date(y, m - 1, 1);
          this.generateCalendar();
        }
      }
    } else {
      this.playerForm.controls['birthDate'].markAsTouched();
    }
  }

  toggleMonthDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isMonthDropdownOpen = !this.isMonthDropdownOpen;
    this.isYearDropdownOpen = false;
  }

  selectMonth(monthIndex: number): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), monthIndex, 1);
    this.generateCalendar();
    this.isMonthDropdownOpen = false;
  }

  toggleYearDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isYearDropdownOpen = !this.isYearDropdownOpen;
    this.isMonthDropdownOpen = false;
  }

  selectYear(year: number): void {
    this.currentDate = new Date(year, this.currentDate.getMonth(), 1);
    this.generateCalendar();
    this.isYearDropdownOpen = false;
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

    this.playerForm.patchValue({
      birthDate: formattedDate,
      age: calculatedAge,
    });

    this.currentDate = new Date(year, date.getMonth(), 1);
    this.generateCalendar();

    this.playerForm.controls['birthDate'].markAsTouched();
    this.isCalendarOpen = false;
  }

  isSelected(date: Date): boolean {
    const val = this.playerForm.controls['birthDate'].value;
    if (!val) return false;
    const [y, m, d] = val.split('-').map(Number);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  }

  get formattedBirthDate(): string {
    const val = this.playerForm.controls['birthDate'].value;
    if (!val) return '';
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
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

  loadPlayerData(id: number | string) {
    this.playerService.getByID(id).subscribe({
      next: (player: any) => {
        if (player) {
          const rawDate = player.birthDate || player.fechaNacimiento || '';
          const formattedDate = rawDate ? rawDate.substring(0, 10) : '';

          let calculatedAge = player.age || '';
          if (formattedDate) {
            const [y, m, d] = formattedDate.split('-').map(Number);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
              const birthDateObj = new Date(y, m - 1, d);
              const today = new Date();
              calculatedAge = today.getFullYear() - birthDateObj.getFullYear();
              const diffM = today.getMonth() - birthDateObj.getMonth();
              if (diffM < 0 || (diffM === 0 && today.getDate() < birthDateObj.getDate())) {
                calculatedAge--;
              }
              this.currentDate = new Date(y, m - 1, 1);
              this.generateCalendar();
            }
          }

          this.playerForm.patchValue({
            name: player.name || '',
            nationality: player.nationality || player.nacionalidad || '',
            position: player.position || player.posicion || '',
            birthDate: formattedDate,
            age: calculatedAge,
            preferredFoot: player.preferredFoot || player.pieHabil || '',
            photo: player.photo || player.foto || '',
          });
        }
      },
      error: (err) => console.error('Error al cargar jugador:', err),
    });
  }

  togglePositionDropdown(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.isPositionOpen = !this.isPositionOpen;
    this.isFootOpen = false;
    this.isCountryOpen = false;
    this.isCalendarOpen = false;
    this.isMonthDropdownOpen = false;
    this.isYearDropdownOpen = false;
  }

  selectPosition(pos: string) {
    this.playerForm.get('position')?.setValue(pos);
    this.isPositionOpen = false;
  }

  get selectedPositionLabel(): string {
    const val = this.playerForm.get('position')?.value;
    return this.positions.find((p) => p.value === val)?.label || val || '';
  }

  toggleFootDropdown(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.isFootOpen = !this.isFootOpen;
    this.isPositionOpen = false;
    this.isCountryOpen = false;
    this.isCalendarOpen = false;
    this.isMonthDropdownOpen = false;
    this.isYearDropdownOpen = false;
  }

  selectFoot(foot: string) {
    this.playerForm.get('preferredFoot')?.setValue(foot);
    this.isFootOpen = false;
  }

  toggleCountryDropdown(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.isCountryOpen = !this.isCountryOpen;
    this.nationalitySearch = '';
    this.isPositionOpen = false;
    this.isFootOpen = false;
    this.isCalendarOpen = false;
    this.isMonthDropdownOpen = false;
    this.isYearDropdownOpen = false;
  }

  selectCountry(country: string) {
    this.playerForm.get('nationality')?.setValue(country);
    this.playerForm.get('nationality')?.markAsTouched();
    this.isCountryOpen = false;
    this.nationalitySearch = '';
  }

  onSubmit() {
    if (this.playerForm.valid && this.playerId !== null) {
      const raw = this.playerForm.getRawValue();
      const updatedData = {
        ...raw,
        age: raw.age !== '' ? Number(raw.age) : undefined,
      };
      this.playerService.updatePlayer(this.playerId, updatedData).subscribe({
        next: () => {
          this.closePanel.emit();
          goBackOr(this.location, this.router);
        },
        error: (err: any) => console.error('Error al actualizar:', err),
      });
    } else {
      this.playerForm.markAllAsTouched();
    }
  }

  // Vuelve a donde estaba el usuario (misma página y posición del scroll)
  onCancel() {
    this.closePanel.emit();
    goBackOr(this.location, this.router);
  }
}