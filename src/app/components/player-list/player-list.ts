import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PlayerService } from '../../services/player-service';
import { Team } from '../../models/Team';

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
  private http = inject(HttpClient);

  teams = signal<Team[]>([]);
  searchText = signal('');

  // Estados de los filtros seleccionados
  selectedPosition = signal<string>('ALL');
  selectedTeam = signal<string | number>('ALL');
  selectedNationality = signal<string>('ALL'); // 👈 Estado para la nacionalidad

  // Estados visuales de los paneles desplegables
  isFilterPanelOpen = signal(false);
  isPositionDropdownOpen = false;
  isTeamDropdownOpen = false;
  isNationalityDropdownOpen = false; // 👈 Estado visual para nacionalidad

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

    this.http.get<Team[]>('http://localhost:3000/equipos').subscribe({
      next: (data) => this.teams.set(data || []),
      error: (err) => console.error('Error al cargar equipos:', err),
    });
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
    this.isTeamDropdownOpen = false;
    this.isNationalityDropdownOpen = false;
  }

  togglePositionDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isPositionDropdownOpen = !this.isPositionDropdownOpen;
    this.isTeamDropdownOpen = false;
    this.isNationalityDropdownOpen = false;
  }

  toggleTeamDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isTeamDropdownOpen = !this.isTeamDropdownOpen;
    this.isPositionDropdownOpen = false;
    this.isNationalityDropdownOpen = false;
  }

  toggleNationalityDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isNationalityDropdownOpen = !this.isNationalityDropdownOpen;
    this.isPositionDropdownOpen = false;
    this.isTeamDropdownOpen = false;
  }

  selectPosition(pos: string | number): void {
    this.selectedPosition.set(String(pos));
    this.isPositionDropdownOpen = false;
  }

  selectTeam(teamId: string | number): void {
    this.selectedTeam.set(teamId);
    this.isTeamDropdownOpen = false;
  }

  selectNationality(nat: string | number): void {
    this.selectedNationality.set(String(nat));
    this.isNationalityDropdownOpen = false;
  }

  get selectedPositionLabel(): string {
    const current = this.selectedPosition();
    return this.positions.find((p) => p.value === current)?.label || 'Todas las posiciones';
  }

  get selectedTeamLabel(): string {
    const current = this.selectedTeam();
    if (current === 'ALL') return 'Todos los equipos';
    if (current === 'FREE_AGENT') return 'Agentes libres';
    const found = this.teams().find((t) => String(t.id) === String(current));
    return found?.name || 'Todos los equipos';
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
    const found = this.teams().find((t) => String(t.id) === String(teamId));
    return found?.name || 'Agente libre';
  }

  // --- Filtro reactivo ---
  filteredPlayers = computed(() => {
    const list = this.playerService.players ? this.playerService.players() : [];
    const search = this.searchText().toLowerCase().trim();
    const pos = this.selectedPosition();
    const teamFilter = this.selectedTeam();
    const natFilter = this.selectedNationality();

    return list.filter((player: any) => {
      const name = (player.name || '').toLowerCase();
      const matchesSearch = !search || name.includes(search);
      const matchesPosition = pos === 'ALL' || player.position === pos;

      // Filtro de nacionalidad (soporta 'nationality' o 'nacionality' por si acaso)
      const pNat = player.nationality || player.nacionality || '';
      const matchesNationality =
        natFilter === 'ALL' || pNat.toLowerCase() === natFilter.toLowerCase();

      const pTeamId = player.teamID ?? player.currentTeamID;
      let matchesTeam = false;

      if (teamFilter === 'ALL') {
        matchesTeam = true;
      } else if (teamFilter === 'FREE_AGENT') {
        matchesTeam = !pTeamId || pTeamId === 0;
      } else {
        matchesTeam = pTeamId !== undefined && String(pTeamId) === String(teamFilter);
      }

      return matchesSearch && matchesPosition && matchesTeam && matchesNationality;
    });
  });
}
