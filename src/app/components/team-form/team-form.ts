import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
    yearOfFoundation: ['', [Validators.required, Validators.min(1800), Validators.max(2027)]],
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
}
