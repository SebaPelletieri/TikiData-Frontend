import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PlayerService } from '../../services/player-service';

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
  imports: [CommonModule, FormsModule, RouterModule],
  selector: 'app-player-list',
  styleUrl: './player-list.css',
  templateUrl: './player-list.html',
})
export class PlayerList implements OnInit {
  public playerService = inject(PlayerService);

  searchText = signal('');

  selectedPosition = signal<string>('ALL');
  selectedNationality = signal<string>('ALL');

  isFilterPanelOpen = signal(false);
  isPositionDropdownOpen = false;
  isNationalityDropdownOpen = false;

  currentPage = signal(1);
  pageSize = 20; // 20 registros fijos por página

  positions: FilterOption[] = [
    { value: 'ALL', label: 'Todas las posiciones' },
    { value: 'ARQ', label: 'Arquero' },
    { value: 'DEF', label: 'Defensor' },
    { value: 'MED', label: 'Mediocampista' },
    { value: 'DEL', label: 'Delantero' },
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
      .sort()
      .forEach((nationality) => {
        options.push({ value: nationality, label: nationality });
      });

    return options;
  });

  // Función mejorada con mapeo robusto para códigos ISO de países de todo el mundo
  getCountryFlag(countryName: string | number): string {
    if (!countryName) return 'https://flagcdn.com/w40/xx.png';

    const strCountry = String(countryName);

    // Diccionario completo de códigos ISO oficiales (incluyendo Angola, Haití y otros)
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

    // Si está en el diccionario usa su ISO correcto; si no, intenta con las dos primeras letras como respaldo
    const isoCode = universalIsoExceptions[normalized] || normalized.substring(0, 2);

    return `https://flagcdn.com/w40/${isoCode}.png`;
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
    return this.positions.find((p) => p.value === current)?.label || 'Todas las posiciones';
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
    if (!teamId) return 'Agente libre';
    return player.teamName || 'Equipo TikiData';
  }

  filteredPlayersList = computed(() => {
    const list = this.playerService.players ? this.playerService.players() : [];
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

  paginationInfoText = computed(() => {
    const list = this.filteredPlayersList();
    const total = list.length;
    if (total === 0) return 'Mostrando 0 registros';

    const start = (this.currentPage() - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage() * this.pageSize, total);
    return `Mostrando ${start} - ${end} de ${total} jugadores`;
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
