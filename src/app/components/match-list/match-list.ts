import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchService } from '../../services/match-service';
import { ChampionshipService } from '../../services/championship-service';
import { MatchCard } from '../match-card/match-card';
import { Match } from '../../models/Match';
import { getCountryFlag } from '../../utils/countries';
import { compareEs } from '../../utils/sort';
import { TranslocoPipe } from '@jsverse/transloco';
import { compareCountries, CountryPipe } from '../../i18n/country.pipe';
import { LanguageService } from '../../i18n/language-service';

interface ChampionshipGroup {
  key: string;
  name: string;
  logo?: string;
  matches: Match[];
}

interface CountryGroup {
  country: string;
  flag: string;
  total: number;
  championships: ChampionshipGroup[];
}

const INTERNATIONAL = 'Internacional';

@Component({
  standalone: true,
  imports: [CommonModule, MatchCard, TranslocoPipe, CountryPipe],
  selector: 'app-match-list',
  styleUrl: './match-list.css',
  templateUrl: './match-list.html',
})
export class MatchList implements OnInit {
  public matchService = inject(MatchService);
  private championshipService = inject(ChampionshipService);

  selectedFilter = signal<string>('TODOS');
  // Para ordenar los países por su nombre en el idioma elegido
  private language = inject(LanguageService);

  // Cada campeonato muestra pocos partidos y suma más con "Ver más", para que la
  // página no se haga eterna (la Copa de la Liga sola tiene casi 200)
  private readonly FIRST_BATCH = 6;
  private readonly NEXT_BATCH = 12;
  private visibleByChamp = signal<Record<string, number>>({});
  private openCountries = signal<Record<string, boolean>>({});

  filteredMatches = computed(() => {
    const matches = this.matchService.matches();
    const filter = this.selectedFilter();
    if (filter === 'TODOS') return matches;
    return matches.filter((m) => m.status === filter);
  });

  /**
   * Partidos agrupados por país del campeonato y, dentro de cada país, por campeonato.
   * Internacional va primero (como en Campeonatos); el resto de países, los campeonatos
   * de cada país en orden alfabético, y los partidos del más reciente al más viejo.
   */
  groupedMatches = computed<CountryGroup[]>(() => {
    const champsById = new Map(
      this.championshipService.championships().map((c) => [String(c.id), c]),
    );
    const byCountry = new Map<string, Map<string, ChampionshipGroup>>();

    for (const match of this.filteredMatches()) {
      const champ = champsById.get(String(match.championshipID));
      const country = champ?.country?.trim() || INTERNATIONAL;
      const key = champ ? String(champ.id) : `nombre:${match.championshipName || 'Otros'}`;

      if (!byCountry.has(country)) byCountry.set(country, new Map());
      const champs = byCountry.get(country)!;
      if (!champs.has(key)) {
        champs.set(key, {
          key,
          name: champ?.name || match.championshipName || '',
          logo: champ?.logo,
          matches: [],
        });
      }
      champs.get(key)!.matches.push(match);
    }

    const time = (m: Match) => new Date(m.date as string).getTime() || 0;
    const byCountry_ = compareCountries(this.language.current());
    const isIntl = (c: string) => c.toLowerCase() === INTERNATIONAL.toLowerCase();

    return [...byCountry.entries()]
      .sort(([a], [b]) => Number(isIntl(b)) - Number(isIntl(a)) || byCountry_(a, b))
      .map(([country, champs]) => {
        const championships = [...champs.values()]
          .sort((a, b) => compareEs(a.name, b.name))
          .map((g) => ({ ...g, matches: [...g.matches].sort((a, b) => time(b) - time(a)) }));
        return {
          country,
          flag: getCountryFlag(country),
          total: championships.reduce((n, c) => n + c.matches.length, 0),
          championships,
        };
      });
  });

  ngOnInit(): void {
    this.matchService.getAll();
    if (this.championshipService.championships().length === 0) {
      this.championshipService.getAll();
    }
  }

  setFilter(status: string): void {
    this.selectedFilter.set(status);
    this.visibleByChamp.set({});
  }

  // ---------- Países desplegables ----------
  isCountryOpen(country: string): boolean {
    return !!this.openCountries()[country];
  }

  toggleCountry(country: string): void {
    this.openCountries.update((s) => ({ ...s, [country]: !s[country] }));
  }

  // ---------- "Ver más" por campeonato ----------
  visibleMatches(group: ChampionshipGroup): Match[] {
    return group.matches.slice(0, this.visibleByChamp()[group.key] ?? this.FIRST_BATCH);
  }

  remaining(group: ChampionshipGroup): number {
    return group.matches.length - (this.visibleByChamp()[group.key] ?? this.FIRST_BATCH);
  }

  showMore(group: ChampionshipGroup): void {
    this.visibleByChamp.update((s) => ({
      ...s,
      [group.key]: (s[group.key] ?? this.FIRST_BATCH) + this.NEXT_BATCH,
    }));
  }

  showLess(group: ChampionshipGroup): void {
    this.visibleByChamp.update((s) => ({ ...s, [group.key]: this.FIRST_BATCH }));
  }
}
