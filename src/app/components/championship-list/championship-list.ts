import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { compareCountries, CountryPipe } from '../../i18n/country.pipe';
import { LanguageService } from '../../i18n/language-service';
import { Component, computed, inject, OnInit, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChampionshipService } from '../../services/championship-service';
import { Championship, ChampionshipType } from '../../models/Championship';
import { getCountryFlag as countryFlagUrl } from '../../utils/countries';
import { compareEs, sortByName } from '../../utils/sort';

interface FilterOption {
  value: string;
  label: string;
  flag?: string; // Bandera opcional para los filtros
}

interface ChampionshipGroup {
  groupName: string;
  groupFlag?: string;
  isInternational: boolean;
  championships: Championship[];
  isOpen: boolean;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslocoPipe, CountryPipe],
  selector: 'app-championship-list',
  styleUrl: './championship-list.css',
  templateUrl: './championship-list.html',
})
export class ChampionshipList implements OnInit {
  public championshipService = inject(ChampionshipService);
  // Para ordenar los países por su nombre en el idioma elegido
  private language = inject(LanguageService);

  searchText = signal('');

  selectedType = signal<string>('ALL');
  selectedCountry = signal<string>('ALL');

  isFilterPanelOpen = signal(false);
  isTypeDropdownOpen = false;
  isCountryDropdownOpen = false;

  typeOptions: FilterOption[] = [
    { value: 'ALL', label: 'champList.allTypes' },
    { value: 'LIGA', label: 'type.LIGA' },
    { value: 'COPA', label: 'type.COPA' },
  ];

  // Bandera del país: usa la lista completa compartida (utils/countries.ts)
  getCountryFlag(countryName: string | number): string {
    return countryFlagUrl(countryName);
  }

  countryOptions = computed<FilterOption[]>(() => {
    const list = this.championshipService.championships
      ? this.championshipService.championships()
      : [];

    const countriesSet = new Set<string>();
    list.forEach((champ) => {
      const c = (champ.country || '').trim();
      if (c && c.toLowerCase() !== 'internacional' && c.toLowerCase() !== 'global') {
        countriesSet.add(c);
      }
    });

    const options: FilterOption[] = [
      { value: 'ALL', label: 'common.allCountries' },
      { value: 'Internacional', label: 'champList.international' },
    ];

    Array.from(countriesSet)
      .sort(compareCountries(this.language.current()))
      .forEach((country) => {
        options.push({
          value: country,
          label: country,
          flag: this.getCountryFlag(country),
        });
      });

    return options;
  });

  openGroups = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.championshipService.getAll();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown-container')) {
      this.closeFilterPanel();
    }
  }

  toggleFilterPanel(event: MouseEvent): void {
    event.stopPropagation();
    this.isFilterPanelOpen.update((open) => !open);
    if (!this.isFilterPanelOpen()) {
      this.closeSubDropdowns();
    }
  }

  closeFilterPanel(): void {
    this.isFilterPanelOpen.set(false);
    this.closeSubDropdowns();
  }

  closeSubDropdowns(): void {
    this.isTypeDropdownOpen = false;
    this.isCountryDropdownOpen = false;
  }

  toggleTypeDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isTypeDropdownOpen = !this.isTypeDropdownOpen;
    this.isCountryDropdownOpen = false;
  }

  toggleCountryDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isCountryDropdownOpen = !this.isCountryDropdownOpen;
    this.isTypeDropdownOpen = false;
  }

  selectType(type: string): void {
    this.selectedType.set(type);
    this.isTypeDropdownOpen = false;
  }

  selectCountry(country: string): void {
    this.selectedCountry.set(country);
    this.isCountryDropdownOpen = false;
  }

  toggleGroupSection(groupName: string): void {
    this.openGroups.update((state) => ({
      ...state,
      [groupName]: !state[groupName],
    }));
  }

  isGroupOpen(groupName: string): boolean {
    return !!this.openGroups()[groupName];
  }

  get selectedTypeLabel(): string {
    const current = this.selectedType();
    return this.typeOptions.find((t) => t.value === current)?.label || 'champList.allTypes';
  }

  get selectedCountryLabel(): string {
    const current = this.selectedCountry();
    return this.countryOptions().find((c) => c.value === current)?.label || 'common.allCountries';
  }

  getTypeBadgeLabel(type: ChampionshipType): string {
    switch (type) {
      case 'LIGA':
        return 'Liga';
      case 'COPA':
        return 'Copa';
    }
  }

  groupedChampionships = computed(() => {
    const list = this.championshipService.championships
      ? this.championshipService.championships()
      : [];
    const search = this.searchText().toLowerCase().trim();
    const typeFilter = this.selectedType();
    const countryFilter = this.selectedCountry();

    const filtered = list.filter((champ: Championship) => {
      const matchesSearch = !search || champ.name.toLowerCase().includes(search);
      const matchesType = typeFilter === 'ALL' || champ.type === typeFilter;

      const champCountry = (champ.country || '').trim();
      let matchesCountry = true;
      if (countryFilter !== 'ALL') {
        if (countryFilter === 'Internacional') {
          matchesCountry =
            !champCountry ||
            champCountry.toLowerCase() === 'internacional' ||
            champCountry.toLowerCase() === 'global';
        } else {
          matchesCountry = champCountry.toLowerCase() === countryFilter.toLowerCase();
        }
      }

      return matchesSearch && matchesType && matchesCountry;
    });

    const result: ChampionshipGroup[] = [];

    const internationalChamps = filtered.filter(
      (c) =>
        !c.country ||
        c.country.trim() === '' ||
        c.country.toLowerCase() === 'internacional' ||
        c.country.toLowerCase() === 'global',
    );

    if (internationalChamps.length > 0) {
      result.push({
        groupName: 'Competencias Internacionales',
        groupFlag: '',
        isInternational: true,
        championships: sortByName(internationalChamps),
        isOpen: false,
      });
    }

    const nationalChamps = filtered.filter(
      (c) =>
        c.country &&
        c.country.trim() !== '' &&
        c.country.toLowerCase() !== 'internacional' &&
        c.country.toLowerCase() !== 'global',
    );

    // Países en orden alfabético ("Competencias Internacionales" queda siempre primero).
    // Es un computed: al agregar un campeonato de un país nuevo, aparece solo en su lugar.
    const uniqueCountries = Array.from(new Set(nationalChamps.map((c) => c.country))).sort(
      compareCountries(this.language.current()),
    );

    for (const country of uniqueCountries) {
      const champsInCountry = nationalChamps.filter((c) => c.country === country);

      if (champsInCountry.length > 0) {
        result.push({
          groupName: country,
          groupFlag: this.getCountryFlag(country), // Bandera generada de forma robusta
          isInternational: false,
          championships: sortByName(champsInCountry),
          isOpen: false,
        });
      }
    }

    return result;
  });
}
