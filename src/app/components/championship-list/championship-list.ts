import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChampionshipService } from '../../services/championship-service';
import { Championship, ChampionshipType } from '../../models/Championship';

interface FilterOption {
  value: string;
  label: string;
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
  imports: [CommonModule, FormsModule, RouterModule],
  selector: 'app-championship-list',
  styleUrl: './championship-list.css',
  templateUrl: './championship-list.html',
})
export class ChampionshipList implements OnInit {
  public championshipService = inject(ChampionshipService);

  searchText = signal('');

  // Estados de los filtros seleccionados
  selectedType = signal<'ALL' | ChampionshipType>('ALL');
  selectedCountry = signal<string>('ALL');

  // Estados visuales de los desplegables
  isFilterPanelOpen = signal(false);
  isTypeDropdownOpen = false;
  isCountryDropdownOpen = false;

  typeOptions: FilterOption[] = [
    { value: 'ALL', label: 'Todas las competencias' },
    { value: 'LIGA', label: 'Liga' },
    { value: 'COPA', label: 'Copa' },
  ];

  // 🌍 Opciones de país generadas de forma dinámica en base a los datos reales
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
      { value: 'ALL', label: 'Todos los países' },
      { value: 'Internacional', label: 'Competencias Internacionales' },
    ];

    Array.from(countriesSet)
      .sort()
      .forEach((country) => {
        options.push({ value: country, label: country });
      });

    return options;
  });

  // Diccionario de banderas por país
  countryFlags: Record<string, string> = {
    Argentina: 'https://flagcdn.com/w40/ar.png',
    Brasil: 'https://flagcdn.com/w40/br.png',
    España: 'https://flagcdn.com/w40/es.png',
    Inglaterra: 'https://flagcdn.com/w40/gb-eng.png',
    Alemania: 'https://flagcdn.com/w40/de.png',
    Italia: 'https://flagcdn.com/w40/it.png',
  };

  // Control de apertura de bloques individuales
  openGroups = signal<Record<string, boolean>>({
    'Competencias Internacionales': true,
    Argentina: true,
  });

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
    this.selectedType.set(type as any);
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
    return this.typeOptions.find((t) => t.value === current)?.label || 'Todas las competencias';
  }

  get selectedCountryLabel(): string {
    const current = this.selectedCountry();
    return this.countryOptions().find((c) => c.value === current)?.label || 'Todos los países';
  }

  getTypeBadgeLabel(type: ChampionshipType): string {
    switch (type) {
      case 'LIGA':
        return 'Liga';
      case 'COPA':
        return 'Copa';
    }
  }

  // --- Agrupación Jerárquica: Internacionales y por País (Ligas y Copas) ---
  groupedChampionships = computed(() => {
    const list = this.championshipService.championships
      ? this.championshipService.championships()
      : [];
    const search = this.searchText().toLowerCase().trim();
    const typeFilter = this.selectedType();
    const countryFilter = this.selectedCountry();

    // 1. Filtrar por buscador y filtros de menú superior
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

    // 2. Separar Internacionales
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
        championships: internationalChamps,
        isOpen: true,
      });
    }

    // 3. Separar por País
    const nationalChamps = filtered.filter(
      (c) =>
        c.country &&
        c.country.trim() !== '' &&
        c.country.toLowerCase() !== 'internacional' &&
        c.country.toLowerCase() !== 'global',
    );

    const uniqueCountries = Array.from(new Set(nationalChamps.map((c) => c.country)));

    for (const country of uniqueCountries) {
      const champsInCountry = nationalChamps.filter((c) => c.country === country);

      if (champsInCountry.length > 0) {
        const defaultFlag = `https://flagcdn.com/w40/${country.substring(0, 2).toLowerCase()}.png`;
        result.push({
          groupName: country,
          groupFlag: this.countryFlags[country] || defaultFlag,
          isInternational: false,
          championships: champsInCountry,
          isOpen: true,
        });
      }
    }

    return result;
  });
}
