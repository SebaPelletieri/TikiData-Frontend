import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PlayerService } from '../../services/player-service';

interface FilterOption {
  value: string | number;
  label: string;
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

  // Estados de los filtros seleccionados
  selectedPosition = signal<string>('ALL');
  selectedNationality = signal<string>('ALL');

  // Estados visuales de los paneles desplegables
  isFilterPanelOpen = signal(false);
  isPositionDropdownOpen = false;
  isNationalityDropdownOpen = false;

  positions: FilterOption[] = [
    { value: 'ALL', label: 'Todas las posiciones' },
    { value: 'Arquero', label: 'Arquero' },
    { value: 'Defensor', label: 'Defensor' },
    { value: 'Mediocampista', label: 'Mediocampista' },
    { value: 'Delantero', label: 'Delantero' },
  ];

  nationalityOptions: FilterOption[] = [
    { value: 'ALL', label: 'Todas las nacionalidades' },
    { value: 'Argentina', label: 'Argentina' },
    { value: 'Chile', label: 'Chile' },
    { value: 'Colombia', label: 'Colombia' },
    { value: 'Uruguay', label: 'Uruguay' },
  ];

  ngOnInit(): void {
    this.playerService.getAll();
  }

  // Cierra los paneles si se hace clic fuera
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
  }

  selectNationality(nat: string | number): void {
    this.selectedNationality.set(String(nat));
    this.isNationalityDropdownOpen = false;
  }

  get selectedPositionLabel(): string {
    const current = this.selectedPosition();
    return this.positions.find((p) => p.value === current)?.label || 'Todas las posiciones';
  }

  get selectedNationalityLabel(): string {
    const current = this.selectedNationality();
    return (
      this.nationalityOptions.find((n) => n.value === current)?.label || 'Todas las nacionalidades'
    );
  }

  getTeamName(player: any): string {
    const teamId = player.teamID ?? player.currentTeamID;
    if (!teamId) return 'Agente libre';
    return player.teamName || 'Boca Juniors'; // O ajusta según la estructura de tu objeto jugador
  }

  // --- Filtro reactivo ---
  filteredPlayers = computed(() => {
    const list = this.playerService.players ? this.playerService.players() : [];
    const search = this.searchText().toLowerCase().trim();
    const pos = this.selectedPosition();
    const natFilter = this.selectedNationality();

    return list.filter((player: any) => {
      const name = (player.name || '').toLowerCase();
      const matchesSearch = !search || name.includes(search);
      const matchesPosition = pos === 'ALL' || player.position === pos;

      // Filtro de nacionalidad (soporta 'nationality' o 'nacionality')
      const pNat = player.nationality || player.nacionality || '';
      const matchesNationality =
        natFilter === 'ALL' || pNat.toLowerCase() === natFilter.toLowerCase();

      return matchesSearch && matchesPosition && matchesNationality;
    });
  });
}
