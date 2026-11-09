import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Championship, ChampionshipType } from '../../models/Championship';
import { ChampionshipService } from '../../services/championship-service';
import { TeamService } from '../../services/team-service';

interface CountryOption {
  value: string;
  label: string;
}

@Component({
  imports: [ReactiveFormsModule, FormsModule],
  selector: 'app-championship-form',
  styleUrl: './championship-form.css',
  templateUrl: './championship-form.html',
})
export class ChampionshipForm implements OnInit {
  private championshipService = inject(ChampionshipService);
  private teamService = inject(TeamService);
  private fb = inject(FormBuilder);

  logoPreview: string | null = null;
  isTypeOpen = false;
  isCountryOpen = false; // 👈 Estado para el desplegable de país en el formulario

  // Búsqueda
  teamSearchQuery = signal<string>('');
  isTeamSearchOpen = signal<boolean>(false);

  // Señal pura para los IDs seleccionados
  selectedTeamIds = signal<number[]>([]);

  // Equipos cargados desde db.json
  teams = this.teamService.teams;

  types: ChampionshipType[] = ['LIGA', 'COPA'];

  countryOptions: CountryOption[] = [
    { value: 'Internacional', label: 'Internacional / Global' },
    { value: 'Argentina', label: 'Argentina' },
    { value: 'Brasil', label: 'Brasil' },
    { value: 'España', label: 'España' },
    { value: 'Inglaterra', label: 'Inglaterra' },
  ];

  formulario = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\.]+$/),
      ],
    ],
    logo: ['', [Validators.required]],
    type: ['', [Validators.required]],
    country: ['', [Validators.required]], // 👈 Añadido al formulario
    season: ['', [Validators.required, Validators.pattern(/^\d{4}(\/\d{4})?$/)]],
    teamsIDs: [<number[]>[], [Validators.required, Validators.minLength(1)]],
  });

  // Equipos que coinciden con el texto y que NO están seleccionados todavía
  filteredAvailableTeams = computed(() => {
    const query = this.teamSearchQuery().trim().toLowerCase();
    const selected = this.selectedTeamIds();

    return this.teams().filter((team) => {
      const id = Number(team.id);
      const isAlreadySelected = selected.includes(id);
      const matches =
        team.name.toLowerCase().includes(query) ||
        (team.country && team.country.toLowerCase().includes(query));
      return !isAlreadySelected && matches;
    });
  });

  // Lista de objetos Team para renderizar los chips
  selectedTeamsList = computed(() => {
    const selected = this.selectedTeamIds();
    return this.teams().filter(
      (team) => team.id !== undefined && selected.includes(Number(team.id)),
    );
  });

  ngOnInit(): void {
    if (this.teams().length === 0) {
      this.teamService.getAll();
    }
  }

  getCountryCode(countryName?: string): string {
    const norm = (countryName || '').trim().toLowerCase();
    switch (norm) {
      case 'argentina':
        return 'ar';
      case 'brasil':
      case 'brazil':
        return 'br';
      case 'uruguay':
        return 'uy';
      case 'chile':
        return 'cl';
      case 'colombia':
        return 'co';
      case 'paraguay':
        return 'py';
      case 'peru':
      case 'perú':
        return 'pe';
      case 'ecuador':
        return 'ec';
      case 'bolivia':
        return 'bo';
      case 'venezuela':
        return 've';
      case 'españa':
      case 'spain':
        return 'es';
      case 'inglaterra':
      case 'england':
        return 'gb-eng';
      case 'italia':
      case 'italy':
        return 'it';
      case 'alemania':
      case 'germany':
        return 'de';
      case 'francia':
      case 'france':
        return 'fr';
      default:
        return 'ar';
    }
  }

  saveChampionship(): void {
    const formValue = this.formulario.getRawValue();

    const championshipActual: Championship = {
      name: formValue.name.trim(),
      logo: formValue.logo,
      type: formValue.type as ChampionshipType,
      season: formValue.season.trim(),
      teamsIDs: this.selectedTeamIds(),
      country: formValue.country, // 👈 Ahora toma correctamente el valor del formulario
    };

    this.championshipService.saveChampionship(championshipActual);
    this.cancel();
  }

  cancel(): void {
    this.formulario.reset();
    this.selectedTeamIds.set([]);
    this.logoPreview = null;
    this.teamSearchQuery.set('');
    this.isTeamSearchOpen.set(false);
    this.isTypeOpen = false;
    this.isCountryOpen = false;
  }

  toggleTypeDropdown(): void {
    this.isTypeOpen = !this.isTypeOpen;
    this.isCountryOpen = false;
    this.isTeamSearchOpen.set(false);
    if (!this.isTypeOpen) {
      this.formulario.controls.type.markAsTouched();
    }
  }

  selectType(type: string): void {
    this.formulario.controls.type.setValue(type);
    this.formulario.controls.type.markAsTouched();
    this.isTypeOpen = false;
  }

  toggleCountryDropdown(): void {
    this.isCountryOpen = !this.isCountryOpen;
    this.isTypeOpen = false;
    this.isTeamSearchOpen.set(false);
    if (!this.isCountryOpen) {
      this.formulario.controls.country.markAsTouched();
    }
  }

  selectCountry(country: string): void {
    this.formulario.controls.country.setValue(country);
    this.formulario.controls.country.markAsTouched();
    this.isCountryOpen = false;
  }

  onTeamSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    this.teamSearchQuery.set(value);
    this.isTeamSearchOpen.set(value.trim().length > 0);
  }

  selectTeamFromSearch(teamId: number | undefined, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (teamId === undefined || teamId === null) return;

    const numericId = Number(teamId);
    const current = this.selectedTeamIds();

    if (!current.includes(numericId)) {
      const updated = [...current, numericId];
      this.selectedTeamIds.set(updated);
      this.formulario.controls.teamsIDs.setValue(updated);
      this.formulario.controls.teamsIDs.markAsDirty();
      this.formulario.controls.teamsIDs.markAsTouched();
    }

    this.teamSearchQuery.set('');
    this.isTeamSearchOpen.set(false);
  }

  removeSelectedTeam(teamId: number | undefined): void {
    if (teamId === undefined || teamId === null) return;
    const numericId = Number(teamId);
    const updated = this.selectedTeamIds().filter((id) => id !== numericId);
    this.selectedTeamIds.set(updated);
    this.formulario.controls.teamsIDs.setValue(updated);
    this.formulario.controls.teamsIDs.markAsDirty();
    this.formulario.controls.teamsIDs.markAsTouched();
  }

  closeTeamSearch(): void {
    setTimeout(() => {
      this.isTeamSearchOpen.set(false);
    }, 200);
  }

  onFileSelected(event: Event): void {
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

  removeLogo(event: Event): void {
    event.stopPropagation();
    this.logoPreview = null;
    this.formulario.patchValue({ logo: '' });
  }

  onlyLetters(event: KeyboardEvent): void {
    if (
      event.ctrlKey ||
      event.metaKey ||
      ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter', 'Home', 'End'].includes(
        event.key,
      )
    ) {
      return;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\.]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onlySeasonChars(event: KeyboardEvent): void {
    if (
      event.ctrlKey ||
      event.metaKey ||
      ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter', 'Home', 'End'].includes(
        event.key,
      )
    ) {
      return;
    }
    if (!/^[0-9\/]$/.test(event.key)) {
      event.preventDefault();
    }
  }
}
