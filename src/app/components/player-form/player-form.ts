import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { PlayerService } from '../../services/player-service';
import { Player, Position } from '../../models/Player';

@Component({
  imports: [ReactiveFormsModule, FormsModule],
  selector: 'app-player-form',
  styleUrl: './player-form.css',
  templateUrl: './player-form.html',
})
export class PlayerForm {

  playerService = inject(PlayerService)
  fb = inject(FormBuilder);

  photoPreview: string | null = null;
  isNationalityOpen = false;
  isPositionOpen = false;
  isFootOpen = false;
  isTeamOpen = false;
  isCalendarOpen = false;
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();

  nationalities = ['Argentina', 'Brasil', 'Uruguay', 'Colombia', 'Chile', 'Paraguay'];
  positions = ['ARQ', 'DEF', 'MED', 'DEL'];
  footOptions = ['Derecho', 'Izquierdo', 'Ambidiestro'];
  teams = [
    { id: 1, name: 'River Plate' },
    { id: 2, name: 'Boca Juniors' },
    { id: 3, name: 'Independiente' },
  ];
  months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  formulario = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    photo: ['', [Validators.required]],
    age: [{ value: 0, disabled: true }, [Validators.required, Validators.min(15)]],
    position: ['', [Validators.required]],
    currentTeamID: [''], 
    bithDate: ['', [Validators.required]], // Escrito exactamente en la interfaz
    nacionality: ['', [Validators.required]],
    preferredFoot: ['', [Validators.required]],
    matchesPlayed: [0, [Validators.required, Validators.min(0)]],
    goals: [0, [Validators.required, Validators.min(0)]],
    assists: [0, [Validators.required, Validators.min(0)]],
    yellowCards: [0, [Validators.required, Validators.min(0)]],
    redCards: [0, [Validators.required, Validators.min(0)]],
  });

  savePlayer() {
    const formValue = this.formulario.getRawValue(); 
    
    let playerActual: Player = {
      name: formValue.name,
      photo: formValue.photo,
      age: formValue.age,
      position: formValue.position as Position,
      currentTeamID: formValue.currentTeamID ? Number(formValue.currentTeamID) : undefined,
      bithDate: formValue.bithDate,
      nacionality: formValue.nacionality,
      preferredFoot: formValue.preferredFoot,
      matchesPlayed: formValue.matchesPlayed,
      goals: formValue.goals,
      assists: formValue.assists,
      yellowCards: formValue.yellowCards,
      redCards: formValue.redCards,
    };

    this.playerService.savePlayer(playerActual);
    this.formulario.reset();
    this.photoPreview = null;
  }

  cancel() {
    this.formulario.reset();
    this.photoPreview = null;
  }

  // --- CONTROL DE MENÚS DESPLEGABLES ---
  closeAllDropdowns() {
    this.isNationalityOpen = false;
    this.isPositionOpen = false;
    this.isFootOpen = false;
    this.isTeamOpen = false;
    this.isCalendarOpen = false;
  }

  toggleNationalityDropdown() {
    const wasOpen = this.isNationalityOpen;
    this.closeAllDropdowns();
    this.isNationalityOpen = !wasOpen;
  }

  selectNationality(country: string) {
    this.formulario.controls.nacionality.setValue(country);
    this.formulario.controls.nacionality.markAsTouched();
    this.isNationalityOpen = false;
  }

  togglePositionDropdown() {
    const wasOpen = this.isPositionOpen;
    this.closeAllDropdowns();
    this.isPositionOpen = !wasOpen;
    if (!this.isPositionOpen) this.formulario.controls.position.markAsTouched();
  }

  selectPosition(pos: string) {
    this.formulario.controls.position.setValue(pos);
    this.formulario.controls.position.markAsTouched();
    this.isPositionOpen = false;
  }

  toggleFootDropdown() {
    const wasOpen = this.isFootOpen;
    this.closeAllDropdowns();
    this.isFootOpen = !wasOpen;
    if (!this.isFootOpen) this.formulario.controls.preferredFoot.markAsTouched();
  }

  selectFoot(foot: string) {
    this.formulario.controls.preferredFoot.setValue(foot);
    this.formulario.controls.preferredFoot.markAsTouched();
    this.isFootOpen = false;
  }

  toggleTeamDropdown() {
    const wasOpen = this.isTeamOpen;
    this.closeAllDropdowns();
    this.isTeamOpen = !wasOpen;
  }

  selectTeam(teamId: number) {
    this.formulario.controls.currentTeamID.setValue(teamId.toString());
    this.formulario.controls.currentTeamID.markAsTouched();
    this.isTeamOpen = false;
  }

  get selectedTeamName(): string | undefined {
    const selectedId = this.formulario.controls.currentTeamID.value;
    return this.teams.find((t) => t.id.toString() === selectedId?.toString())?.name;
  }

  // --- FOTO (DRAG & DROP) ---
  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
        this.formulario.patchValue({ photo: this.photoPreview });
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(event: Event) {
    event.stopPropagation();
    this.photoPreview = null;
    this.formulario.patchValue({ photo: '' });
  }

  // --- CALENDARIO (FECHA DE NACIMIENTO) ---
  toggleCalendar(): void {
    const wasOpen = this.isCalendarOpen;
    this.closeAllDropdowns();
    this.isCalendarOpen = !wasOpen;
    if (!this.isCalendarOpen) this.formulario.controls.bithDate.markAsTouched();
  }

  get calendarDays(): { day: number; date: Date; isCurrentMonth: boolean }[] {
    const days: { day: number; date: Date; isCurrentMonth: boolean }[] = [];
    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const lastDateCurrentMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const lastDatePrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

    for (let i = firstDayIndex; i > 0; i--) {
      const day = lastDatePrevMonth - i + 1;
      days.push({ day, date: new Date(this.currentYear, this.currentMonth - 1, day), isCurrentMonth: false });
    }

    for (let i = 1; i <= lastDateCurrentMonth; i++) {
      days.push({ day: i, date: new Date(this.currentYear, this.currentMonth, i), isCurrentMonth: true });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, date: new Date(this.currentYear, this.currentMonth + 1, i), isCurrentMonth: false });
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

    this.formulario.controls.bithDate.setValue(formattedDate);
    this.formulario.controls.bithDate.markAsTouched();
    
    // Cálculo automático de la edad
    const ageDifMs = Date.now() - date.getTime();
    const ageDate = new Date(ageDifMs); 
    const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
    this.formulario.controls.age.setValue(calculatedAge);

    this.isCalendarOpen = false;
  }

  isDaySelected(date: Date): boolean {
    const currentVal = this.formulario.controls.bithDate.value;
    if (!currentVal) return false;
    const d = new Date(currentVal + 'T00:00:00'); 
    return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
  }

  get formattedSelectedDate(): string {
    const val = this.formulario.controls.bithDate.value;
    if (!val) return '';
    const [year, month, day] = val.split('-');
    return `${day}/${month}/${year}`;
  }
}

