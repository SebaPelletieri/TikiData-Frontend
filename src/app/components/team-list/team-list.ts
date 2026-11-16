import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeamService } from '../../services/team-service';
import { Team } from '../../models/Team';
import { getCountryFlag as countryFlagUrl } from '../../utils/countries';
import { compareEs, sortByName } from '../../utils/sort';

interface Championship {
  id: number | string;
  name: string;
  country: string;
  type: 'LIGA' | 'COPA';
  logo?: string;
  teamsIDs?: (number | string)[];
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
      .sort(compareEs)
      .forEach((country) => {
        options.push({ value: country, label: country });
      });

    return options;
  });

  // Bandera del país: usa la lista completa compartida (utils/countries.ts)
  getCountryFlag(countryName: string | number): string {
    return countryFlagUrl(countryName);
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

  /**
   * El equipo pertenece a la liga si figura en la lista de equipos del campeonato
   * (teamsIDs, que se completa al crear/editar el campeonato). Como respaldo se
   * mira también la lista de campeonatos del equipo. Los ids se comparan como
   * texto porque en la base conviven números ("2" vs 2) y ids alfanuméricos.
   */
  private isTeamInLeague(team: Team, league: Championship): boolean {
    const teamId = String(team.id);
    const leagueId = String(league.id);
    const inChampionship = (league.teamsIDs || []).some((id) => String(id) === teamId);
    const inTeam = (team.championshipsActive || []).some((id) => String(id) === leagueId);
    return inChampionship || inTeam;
  }

  /** Las selecciones se crean con el nombre "Selección de <país>". */
  private isNationalTeam(team: Team): boolean {
    return /^selecci[oó]n\b/i.test(team.name || '');
  }

  /** Compara países sin importar mayúsculas ni tildes ("Perú" = "peru"). */
  private sameCountry(a: string | undefined, b: string | undefined): boolean {
    const norm = (s?: string) =>
      (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim();
    return norm(a) === norm(b);
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

    // Países en orden alfabético (al agregar un equipo de un país nuevo, aparece solo en su lugar)
    const uniqueCountries = Array.from(
      new Set(filtered.map((t) => t.country).filter(Boolean)),
    ).sort(compareEs);
    const result: CountryGroup[] = [];

    for (const country of uniqueCountries) {
      const countryTeams = filtered.filter((t) => t.country === country);
      // Solo los campeonatos de tipo LIGA subdividen (las copas no). Se toman las ligas
      // del país y también las de otro país donde juega algún equipo de este
      // (ej. Toronto FC es de Canadá pero juega la MLS de Estados Unidos).
      // Las ligas se muestran en orden alfabético.
      const countryLeagues = champs
        .filter(
          (c) =>
            c.type === 'LIGA' &&
            (this.sameCountry(c.country, country) ||
              countryTeams.some((t) => this.isTeamInLeague(t, c))),
        )
        .sort((a, b) => compareEs(a.name, b.name));

      const leaguesMap: LeagueGroup[] = [];
      // Un equipo juega una sola liga: si por error figura en dos, queda en la primera
      const assignedTeamIds = new Set<string>();

      for (const league of countryLeagues) {
        const teamsInLeague = countryTeams.filter(
          (t) => !assignedTeamIds.has(String(t.id)) && this.isTeamInLeague(t, league),
        );

        if (teamsInLeague.length > 0) {
          leaguesMap.push({
            leagueName: league.name,
            leagueLogo: league.logo,
            teams: sortByName(teamsInLeague),
          });
          teamsInLeague.forEach((t) => assignedTeamIds.add(String(t.id)));
        }
      }

      const remaining = countryTeams.filter((t) => !assignedTeamIds.has(String(t.id)));
      // La selección nacional va en su propio bloque, no mezclada con clubes sin liga
      const nationalTeams = remaining.filter((t) => this.isNationalTeam(t));
      const unassignedTeams = remaining.filter((t) => !this.isNationalTeam(t));

      if (unassignedTeams.length > 0) {
        leaguesMap.push({
          // Si el país no tiene ninguna liga cargada, no tiene sentido decir "sin liga"
          leagueName: leaguesMap.length ? 'Sin liga asignada' : 'Equipos',
          leagueLogo: undefined,
          teams: sortByName(unassignedTeams),
        });
      }

      if (nationalTeams.length > 0) {
        leaguesMap.push({
          leagueName: 'Selección nacional',
          leagueLogo: undefined,
          teams: sortByName(nationalTeams),
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
