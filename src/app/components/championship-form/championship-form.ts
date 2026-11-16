import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Championship, ChampionshipType } from '../../models/Championship';
import { ChampionshipService } from '../../services/championship-service';
import { TeamService } from '../../services/team-service';
import {
  COUNTRY_OPTIONS,
  CountryOption,
  getCountryFlag as countryFlagUrl,
} from '../../utils/countries';
import {
  uniqueCombinationValidator,
  uniqueValueValidator,
} from '../../validators/duplicate-validator';

@Component({
  selector: 'app-championship-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslocoPipe],
  styleUrl: './championship-form.css',
  templateUrl: './championship-form.html',
})
export class ChampionshipForm implements OnInit {
  private championshipService = inject(ChampionshipService);
  private teamService = inject(TeamService);
  private fb = inject(FormBuilder);

  logoPreview: string | null = null;
  isTypeOpen = false;
  isCountryOpen = false;

  teamSearchQuery = signal<string>('');
  isTeamSearchOpen = signal<boolean>(false);

  selectedTeamIds = signal<number[]>([]);

  teams = this.teamService.teams;

  types: ChampionshipType[] = ['LIGA', 'COPA'];

  countryOptions: CountryOption[] = COUNTRY_OPTIONS;

  formulario = this.fb.nonNullable.group(
    {
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          uniqueValueValidator(() => this.teamService.teams().map((t) => t.name)),
        ],
      ],
      logo: ['', [Validators.required]],
      type: ['', [Validators.required]],
      country: ['', [Validators.required]],
      season: ['', [Validators.required, Validators.pattern(/^\d{4}(\/\d{4})?$/)]],
      teamsIDs: [<number[]>[], [Validators.required, Validators.minLength(1)]],
    },
    {
      validators: [
        uniqueCombinationValidator(['name', 'season'], () =>
          this.championshipService.championships(),
        ),
      ],
    },
  );

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

  selectedTeamsList = computed(() => {
    const selected = this.selectedTeamIds();
    return this.teams().filter(
      (team) => team.id !== undefined && selected.includes(Number(team.id)),
    );
  });

  // ---------------------------------------------------------------------
  // Un equipo juega una sola liga: si el campeonato es de tipo LIGA, no se
  // pueden agregar equipos que ya están en otra liga (ej. Boca en la Liga
  // Profesional no puede sumarse a la Primera B). Las copas no tienen límite.
  // ---------------------------------------------------------------------
  /** Tipo elegido (señal, para que la lista de equipos se actualice al cambiarlo). */
  selectedType = signal<string>('');
  /** Aviso cuando se quitan equipos al pasar el campeonato a tipo Liga. */
  leagueConflictNotice = signal<string | null>(null);

  /** Equipo (id como texto) → nombre de la liga que ya juega. */
  private teamLeague = computed(() => {
    const map = new Map<string, string>();
    for (const champ of this.championshipService.championships()) {
      if (champ.type !== 'LIGA') continue;
      for (const id of champ.teamsIDs || []) {
        if (!map.has(String(id))) map.set(String(id), champ.name);
      }
    }
    return map;
  });

  /** Si el campeonato es Liga y el equipo ya juega otra liga, devuelve el nombre de esa liga. */
  blockingLeague(team: { id?: number | string }): string | null {
    if (this.selectedType() !== 'LIGA') return null;
    return this.teamLeague().get(String(team.id)) ?? null;
  }

  ngOnInit(): void {
    if (this.championshipService.championships().length === 0) {
      this.championshipService.getAll();
    }
    if (this.teams().length === 0) {
      this.teamService.getAll();
    }
    if (this.championshipService.championships().length === 0) {
      this.championshipService.getAll();
    }
  }

  /** Quita de la selección los equipos que ya juegan otra liga y avisa cuáles fueron. */
  private removeTeamsInOtherLeagues(): boolean {
    const conflicts = this.selectedTeamsList().filter((t) => this.blockingLeague(t));
    if (!conflicts.length) return false;

    const remaining = this.selectedTeamIds().filter(
      (id) => !conflicts.some((t) => Number(t.id) === id),
    );
    this.selectedTeamIds.set(remaining);
    this.formulario.controls.teamsIDs.setValue(remaining);
    this.formulario.controls.teamsIDs.markAsTouched();

    const names = conflicts.map((t) => `${t.name} (${this.blockingLeague(t)})`).join(', ');
    this.leagueConflictNotice.set(
      `Se ${conflicts.length === 1 ? 'quitó' : 'quitaron'} ${conflicts.length === 1 ? 'un equipo que ya juega' : 'equipos que ya juegan'} otra liga: ${names}.`,
    );
    return true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.country-group')) this.isCountryOpen = false;
    if (!target.closest('.type-group')) this.isTypeOpen = false;
    if (!target.closest('.team-multisearch-group')) this.isTeamSearchOpen.set(false);
  }

  getCountryFlag = countryFlagUrl;

  saveChampionship(): void {
    // Última verificación por si los datos cambiaron mientras se completaba el formulario
    if (this.removeTeamsInOtherLeagues()) return;

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const formValue = this.formulario.getRawValue();

    const championshipActual: Championship = {
      name: formValue.name.trim(),
      logo: formValue.logo.trim(),
      type: formValue.type as ChampionshipType,
      season: formValue.season.trim(),
      teamsIDs: this.selectedTeamIds(),
      country: formValue.country,
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
    this.selectedType.set('');
    this.leagueConflictNotice.set(null);
  }

  toggleTypeDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
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
    this.selectedType.set(type);
    this.leagueConflictNotice.set(null);
    // Si pasa a ser Liga, se quitan los equipos ya elegidos que juegan otra liga
    this.removeTeamsInOtherLeagues();
  }

  toggleCountryDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
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

  onSearchBlur(): void {
    this.formulario.controls.teamsIDs.markAsTouched();
    setTimeout(() => {
      this.isTeamSearchOpen.set(false);
    }, 200);
  }

  selectTeamFromSearch(teamId: number | undefined, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (teamId === undefined || teamId === null) return;
    // Un equipo que ya juega otra liga no se puede agregar a una Liga
    if (this.blockingLeague({ id: teamId })) return;

    const numericId = Number(teamId);
    const current = this.selectedTeamIds();
    this.leagueConflictNotice.set(null);

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

  onLogoUrlInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const url = input.value.trim();
    this.logoPreview = url.length > 0 ? url : null;
    this.formulario.patchValue({ logo: url });
    this.formulario.controls.logo.markAsTouched();
  }

  removeLogo(event: Event): void {
    event.stopPropagation();
    this.logoPreview = null;
    this.formulario.patchValue({ logo: '' });
    this.formulario.controls.logo.markAsTouched();
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
