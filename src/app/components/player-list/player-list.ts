import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PlayerService } from '../../services/player-service';
import { getCountryFlag as countryFlagUrl } from '../../utils/countries';
import { compareEs, sortByName } from '../../utils/sort';
import { TranslocoPipe } from '@jsverse/transloco';
import { compareCountries, CountryPipe } from '../../i18n/country.pipe';
import { LanguageService } from '../../i18n/language-service';

interface FilterOption {
  value: string | number;
  label: string;
}

const MAX_VISIBLE_PAGES = 20; // 20 páginas visibles como máximo

function getVisiblePages(total: number, current: number, size = MAX_VISIBLE_PAGES): number[] {
  const end = Math.min(total, Math.max(current, size));
  const start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslocoPipe, CountryPipe],
  selector: 'app-player-list',
  styleUrl: './player-list.css',
  templateUrl: './player-list.html',
})
export class PlayerList implements OnInit {
  public playerService = inject(PlayerService);
  // Para ordenar los países por su nombre en el idioma elegido
  private language = inject(LanguageService);

  searchText = signal('');

  selectedPosition = signal<string>('ALL');
  selectedNationality = signal<string>('ALL');

  isFilterPanelOpen = signal(false);
  isPositionDropdownOpen = false;
  isNationalityDropdownOpen = false;

  currentPage = signal(1);
  pageSize = 20; // 20 registros fijos por página

  positions: FilterOption[] = [
    { value: 'ALL', label: 'playerList.allPositions' },
    { value: 'ARQ', label: 'positionName.ARQ' },
    { value: 'DEF', label: 'positionName.DEF' },
    { value: 'MED', label: 'positionName.MED' },
    { value: 'DEL', label: 'positionName.DEL' },
  ];

  // Nacionalidades dinámicas extraídas de todos los jugadores registrados
  nationalityOptions = computed<FilterOption[]>(() => {
    const list = this.playerService.players ? this.playerService.players() : [];
    const nationalitiesSet = new Set<string>();

    list.forEach((player: any) => {
      const nat = (player.nationality || player.nacionality || '').trim();
      if (nat) {
        nationalitiesSet.add(nat);
      }
    });

    const options: FilterOption[] = [{ value: 'ALL', label: 'Todas las nacionalidades' }];

    Array.from(nationalitiesSet)
      .sort(compareCountries(this.language.current())) // por nombre en el idioma elegido
      .forEach((nationality) => {
        options.push({ value: nationality, label: nationality });
      });

    return options;
  });

  // Bandera del país: usa la lista completa compartida (utils/countries.ts)
  getCountryFlag(countryName: string | number): string {
    return countryFlagUrl(countryName);
  }

  ngOnInit(): void {
    this.playerService.getAll();
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
    this.isPositionDropdownOpen = false;
    this.isNationalityDropdownOpen = false;
  }

  togglePositionDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isPositionDropdownOpen = !this.isPositionDropdownOpen;
    this.isNationalityDropdownOpen = false;
  }

  toggleNationalityDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isNationalityDropdownOpen = !this.isNationalityDropdownOpen;
    this.isPositionDropdownOpen = false;
  }

  selectPosition(pos: string | number): void {
    this.selectedPosition.set(String(pos));
    this.isPositionDropdownOpen = false;
    this.currentPage.set(1);
  }

  selectNationality(nat: string | number): void {
    this.selectedNationality.set(String(nat));
    this.isNationalityDropdownOpen = false;
    this.currentPage.set(1);
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.currentPage.set(1);
  }

  get selectedPositionLabel(): string {
    const current = this.selectedPosition();
    return this.positions.find((p) => p.value === current)?.label || 'playerList.allPositions';
  }

  get selectedNationalityLabel(): string {
    const current = this.selectedNationality();
    return (
      this.nationalityOptions().find((n) => n.value === current)?.label ||
      'Todas las nacionalidades'
    );
  }

  getTeamName(player: any): string {
    const teamId = player.teamID ?? player.currentTeamID;
    if (!teamId) return '';
    return player.teamName || 'Equipo TikiData';
  }

  // Orden alfabético (ignora tildes y mayúsculas). Se ordena solo cuando cambian los
  // jugadores, no en cada búsqueda; el filtro mantiene ese orden.
  private sortedPlayers = computed(() =>
    sortByName(this.playerService.players ? this.playerService.players() : []),
  );

  filteredPlayersList = computed(() => {
    const list = this.sortedPlayers();
    const search = this.searchText().toLowerCase().trim();
    const pos = this.selectedPosition();
    const natFilter = this.selectedNationality();

    return list.filter((player: any) => {
      const name = (player.name || '').toLowerCase();
      const matchesSearch = !search || name.includes(search);
      const matchesPosition = pos === 'ALL' || player.position === pos;

      const pNat = player.nationality || player.nacionality || '';
      const matchesNationality =
        natFilter === 'ALL' || pNat.toLowerCase() === natFilter.toLowerCase();

      return matchesSearch && matchesPosition && matchesNationality;
    });
  });

  totalPages = computed(() => {
    const total = this.filteredPlayersList().length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  });

  paginatedPlayers = computed(() => {
    const list = this.filteredPlayersList();
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  /** Datos del texto "Mostrando X - Y de Z jugadores" (el texto se arma traducido en el template) */
  paginationInfo = computed(() => {
    const total = this.filteredPlayersList().length;
    const start = total === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage() * this.pageSize, total);
    return { start, end, total };
  });

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  pagesArray = computed(() => {
    return getVisiblePages(this.totalPages(), this.currentPage());
  });

  formatPlayerSlug(name: string): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  }
}
