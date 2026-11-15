import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeamService } from '../../services/team-service';
import { Team } from '../../models/Team';

interface Championship {
  id: number;
  name: string;
  country: string;
  type: 'LIGA' | 'COPA';
  logo?: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface LeagueGroup {
  leagueName: string;
  leagueLogo?: string;
  teams: Team[];
}

interface CountryGroup {
  countryName: string;
  countryFlag: string;
  leagues: LeagueGroup[];
  isOpen: boolean;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  selector: 'app-team-list',
  styleUrl: './team-list.css',
  templateUrl: './team-list.html',
})
export class TeamList implements OnInit {
  public teamService = inject(TeamService);
  private http = inject(HttpClient);

  searchText = signal('');
  selectedCountry = signal('ALL');

  // Estados para los paneles flotantes con la misma fluidez
  isFilterPanelOpen = signal(false);
  isCountryDropdownOpen = false;

  championships = signal<Championship[]>([]);

  // Países dinámicos extraídos de todos los equipos registrados en el sistema
  countries = computed<FilterOption[]>(() => {
    const teams = this.teamService.teams ? this.teamService.teams() : [];
    const countrySet = new Set<string>();

    teams.forEach((team) => {
      const c = (team.country || '').trim();
      if (c) {
        countrySet.add(c);
      }
    });

    const options: FilterOption[] = [{ value: 'ALL', label: 'Todos los países' }];

    Array.from(countrySet)
      .sort()
      .forEach((country) => {
        options.push({ value: country, label: country });
      });

    return options;
  });

  // Función 100% dinámica y universal para obtener la bandera de CUALQUIER país del mundo (con excepciones robustas)
  getCountryFlag(countryName: string | number): string {
    if (!countryName) return 'https://flagcdn.com/w40/xx.png';

    const strCountry = String(countryName);

    // Diccionario completo con códigos ISO oficiales (incluyendo Angola, Haití, etc.)
    const universalIsoExceptions: Record<string, string> = {
      argentina: 'ar',
      brasil: 'br',
      brazil: 'br',
      espana: 'es',
      spain: 'es',
      inglaterra: 'gb-eng',
      england: 'gb-eng',
      alemania: 'de',
      germany: 'de',
      italia: 'it',
      italy: 'it',
      uruguay: 'uy',
      colombia: 'co',
      chile: 'cl',
      ecuador: 'ec',
      paraguay: 'py',
      bolivia: 'bo',
      peru: 'pe',
      venezuela: 've',
      mexico: 'mx',
      francia: 'fr',
      portugal: 'pt',
      japon: 'jp',
      estadosunidos: 'us',
      reinounido: 'gb',
      suiza: 'ch',
      republicacheca: 'cz',
      angola: 'ao',
      haiti: 'ht',
      costarica: 'cr',
      panama: 'pa',
      eslovenia: 'si',
      siria: 'sy',
    };

    const normalized = strCountry
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');

    // Si está en las excepciones usa su ISO exacto; si no, toma las primeras 2 letras de respaldo
    const isoCode = universalIsoExceptions[normalized] || normalized.substring(0, 2);

    return `https://flagcdn.com/w40/${isoCode}.png`;
  }

  openCountries = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.teamService.getAll();

    this.http.get<Championship[]>('http://localhost:3000/campeonatos').subscribe({
      next: (data) => this.championships.set(data || []),
      error: (err) => console.error('Error al cargar campeonatos:', err),
    });
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
      this.isCountryDropdownOpen = false;
    }
  }

  closeFilterPanel(): void {
    this.isFilterPanelOpen.set(false);
    this.isCountryDropdownOpen = false;
  }

  toggleCountryDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isCountryDropdownOpen = !this.isCountryDropdownOpen;
  }

  selectCountry(country: string): void {
    this.selectedCountry.set(country);
    this.isCountryDropdownOpen = false;
  }

  get selectedCountryLabel(): string {
    const current = this.selectedCountry();
    return this.countries().find((c) => c.value === current)?.label || 'Todos los países';
  }

  toggleCountrySection(countryName: string): void {
    this.openCountries.update((state) => ({
      ...state,
      [countryName]: !state[countryName],
    }));
  }

  isCountryOpen(countryName: string): boolean {
    return !!this.openCountries()[countryName];
  }

  groupedTeams = computed(() => {
    const teams = this.teamService.teams ? this.teamService.teams() : [];
    const champs = this.championships();
    const search = this.searchText().toLowerCase().trim();
    const filterCountry = this.selectedCountry();

    const filtered = teams.filter((team) => {
      const matchSearch = team.name.toLowerCase().includes(search);
      const matchCountry = filterCountry === 'ALL' || team.country === filterCountry;
      return matchSearch && matchCountry;
    });

    const uniqueCountries = Array.from(new Set(filtered.map((t) => t.country).filter(Boolean)));
    const result: CountryGroup[] = [];

    for (const country of uniqueCountries) {
      const countryTeams = filtered.filter((t) => t.country === country);
      const countryLeagues = champs.filter((c) => c.country === country && c.type === 'LIGA');

      const leaguesMap: LeagueGroup[] = [];
      const assignedTeamIds = new Set<number>();

      for (const league of countryLeagues) {
        const teamsInLeague = countryTeams.filter(
          (t) => t.championshipsActive && t.championshipsActive.includes(league.id),
        );

        if (teamsInLeague.length > 0) {
          leaguesMap.push({
            leagueName: league.name,
            leagueLogo: league.logo,
            teams: teamsInLeague,
          });
          teamsInLeague.forEach((t) => {
            if (t.id !== undefined) assignedTeamIds.add(t.id);
          });
        }
      }

      const unassignedTeams = countryTeams.filter(
        (t) => t.id === undefined || !assignedTeamIds.has(t.id),
      );

      if (unassignedTeams.length > 0) {
        leaguesMap.push({
          leagueName: 'Otros equipos / Sin liga asignada',
          leagueLogo: undefined,
          teams: unassignedTeams,
        });
      }

      if (leaguesMap.length > 0) {
        result.push({
          countryName: country,
          countryFlag: this.getCountryFlag(country), // Generado de forma dinámica y robusta
          leagues: leaguesMap,
          isOpen: false,
        });
      }
    }

    return result;
  });
}
