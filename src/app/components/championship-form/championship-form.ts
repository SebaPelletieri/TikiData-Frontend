import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Championship, ChampionshipType } from '../../models/Championship';
import { ChampionshipService } from '../../services/championship-service';

@Component({
  imports: [ReactiveFormsModule, FormsModule],
  selector: 'app-championship-form',
  styleUrl: './championship-form.css',
  templateUrl: './championship-form.html',
})
export class ChampionshipForm {
  championshipService = inject(ChampionshipService);
  fb = inject(FormBuilder);

  logoPreview: string | null = null;

  // Estados de los dropdowns
  isTypeOpen = false;
  isTeamsOpen = false;

  // Opciones estáticas
  types: ChampionshipType[] = ['League', 'Cup'];

  // Lista de equipos simulada (reemplazá esto con la carga de tu JSON)
  teams = [
    { id: 1, name: 'River Plate' },
    { id: 2, name: 'Boca Juniors' },
    { id: 3, name: 'Independiente' },
    { id: 4, name: 'Racing Club' },
    { id: 5, name: 'San Lorenzo' },
  ];

  formulario = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    logo: ['', [Validators.required]],
    type: ['', [Validators.required]],
    season: ['', [Validators.required, Validators.pattern(/^(20\d{2}|20\d{2}\/20\d{2})$/)]], // Acepta "2026" o "2026/2027"
    teamsIDs: [<number[]>[], [Validators.required, Validators.minLength(1)]], // Al menos 1 equipo
  });

  ngOnInit(): void {
    // Si obtenés los equipos desde un JSON por HTTP, inicializalos acá
  }

  saveChampionship() {
    const formValue = this.formulario.getRawValue();

    let championshipActual: Championship = {
      name: formValue.name,
      logo: formValue.logo,
      type: formValue.type as ChampionshipType,
      season: formValue.season,
      teamsIDs: formValue.teamsIDs,
    };

    this.championshipService.saveChampionship(championshipActual);
    this.formulario.reset();
    this.logoPreview = null;
  }

  cancel() {
    this.formulario.reset();
    this.logoPreview = null;
  }

  // --- CONTROL DE MENÚS DESPLEGABLES ---
  closeAllDropdowns() {
    this.isTypeOpen = false;
    this.isTeamsOpen = false;
  }

  // --- TIPO DE CAMPEONATO (Selección Única) ---
  toggleTypeDropdown(): void {
    this.isTypeOpen = !this.isTypeOpen;
    this.isTeamsOpen = false;

    // Si se cierra el desplegable sin elegir opción, se marca como tocado
    if (!this.isTypeOpen) {
      this.formulario.controls['type'].markAsTouched();
    }
  }

  selectType(type: string): void {
    this.formulario.controls['type'].setValue(type);
    this.formulario.controls['type'].markAsTouched();
    this.isTypeOpen = false;
  }

  // --- EQUIPOS PARTICIPANTES (Selección Múltiple) ---
  toggleTeamsDropdown() {
    const wasOpen = this.isTeamsOpen;
    this.closeAllDropdowns();
    this.isTeamsOpen = !wasOpen;
    if (!this.isTeamsOpen) this.formulario.controls.teamsIDs.markAsTouched();
  }

  toggleTeam(teamId: number) {
    const current: number[] = [...(this.formulario.controls.teamsIDs.value || [])];
    const index = current.indexOf(teamId);

    if (index > -1) {
      current.splice(index, 1); // Lo quita si ya estaba
    } else {
      current.push(teamId); // Lo agrega si no estaba
    }

    this.formulario.controls.teamsIDs.setValue(current);
    this.formulario.controls.teamsIDs.markAsTouched();
  }

  isTeamSelected(teamId: number): boolean {
    const current: number[] = this.formulario.controls.teamsIDs.value || [];
    return current.includes(teamId);
  }

  // --- LOGO (DRAG & DROP) ---
  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
        this.formulario.patchValue({ logo: this.logoPreview });
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(event: Event) {
    event.stopPropagation();
    this.logoPreview = null;
    this.formulario.patchValue({ logo: '' });
  }
}
