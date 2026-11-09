import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
  isCountryDropdownOpen = signal(false);

  championships = signal<Championship[]>([]);

  // 🌍 Generamos dinámicamente la lista de países únicos a partir de los equipos cargados
  countries = computed(() => {
    const teams = this.teamService.teams ? this.teamService.teams() : [];
    const countrySet = new Set(teams.map((t) => t.country).filter(Boolean));
    return Array.from(countrySet).sort();
  });

  // Diccionario genérico o puedes usar una API externa de banderas si lo deseas
  countryFlags: Record<string, string> = {
    Argentina: 'https://flagcdn.com/w40/ar.png',
    Brasil: 'https://flagcdn.com/w40/br.png',
    España: 'https://flagcdn.com/w40/es.png',
    Inglaterra: 'https://flagcdn.com/w40/gb-eng.png',
    Alemania: 'https://flagcdn.com/w40/de.png',
    Italia: 'https://flagcdn.com/w40/it.png',
  };

  openCountries = signal<Record<string, boolean>>({
    Argentina: true,
  });

  ngOnInit(): void {
    this.teamService.getAll();

    this.http.get<Championship[]>('http://localhost:3000/campeonatos').subscribe({
      next: (data) => this.championships.set(data || []),
      error: (err) => console.error('Error al cargar campeonatos:', err),
    });
  }

  toggleCountryDropdown(): void {
    this.isCountryDropdownOpen.update((open) => !open);
  }

  selectCountry(country: string): void {
    this.selectedCountry.set(country);
    this.isCountryDropdownOpen.set(false);
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
        // Genera una bandera por defecto con FlagCDN basada en las iniciales si el país no está en el diccionario
        const defaultFlag = `https://flagcdn.com/w40/${country.substring(0, 2).toLowerCase()}.png`;

        result.push({
          countryName: country,
          countryFlag: this.countryFlags[country] || defaultFlag,
          leagues: leaguesMap,
          isOpen: true,
        });
      }
    }

    return result;
  });
}
