import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PlayerService } from '../../services/player-service';
import { Team } from '../../models/Team';

interface PositionOption {
  value: string;
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
  selectedPosition = signal('ALL');
  // 'ALL' | 'FREE_AGENT' | number
  selectedTeam = signal<string | number>('ALL');

  isPositionDropdownOpen = signal(false);
  isTeamDropdownOpen = signal(false);

  positions: PositionOption[] = [
    { value: 'ALL', label: 'Todas las posiciones' },
    { value: 'Arquero', label: 'Arquero' },
    { value: 'Defensor', label: 'Defensor' },
    { value: 'Mediocampista', label: 'Mediocampista' },
    { value: 'Delantero', label: 'Delantero' },
  ];

  ngOnInit(): void {
    this.playerService.getAll();

    this.http.get<Team[]>('http://localhost:3000/equipos').subscribe({
      next: (data) => this.teams.set(data || []),
      error: (err) => console.error('Error al cargar equipos:', err),
    });
  }

  getTeamName(player: any): string {
    const teamId = player.teamID ?? player.currentTeamID;
    if (!teamId) return 'Agente libre';
    const found = this.teams().find((t) => String(t.id) === String(teamId));
    return found?.name || 'Agente libre';
  }

  // --- Dropdown Posiciones ---
  togglePositionDropdown(): void {
    this.isPositionDropdownOpen.update((open) => !open);
    this.isTeamDropdownOpen.set(false);
  }

  selectPosition(pos: string): void {
    this.selectedPosition.set(pos);
    this.isPositionDropdownOpen.set(false);
  }

  get selectedPositionLabel(): string {
    const current = this.selectedPosition();
    return this.positions.find((p) => p.value === current)?.label || 'Todas las posiciones';
  }

  // --- Dropdown Equipos ---
  toggleTeamDropdown(): void {
    this.isTeamDropdownOpen.update((open) => !open);
    this.isPositionDropdownOpen.set(false);
  }

  selectTeam(teamId: string | number | undefined): void {
    if (teamId === undefined) return;
    this.selectedTeam.set(teamId);
    this.isTeamDropdownOpen.set(false);
  }

  get selectedTeamLabel(): string {
    const current = this.selectedTeam();
    if (current === 'ALL') return 'Todos los equipos';
    if (current === 'FREE_AGENT') return 'Agentes libres';
    const found = this.teams().find((t) => String(t.id) === String(current));
    return found?.name || 'Todos los equipos';
  }

  // --- Filtro reactivo ---
  filteredPlayers = computed(() => {
    const list = this.playerService.players ? this.playerService.players() : [];
    const search = this.searchText().toLowerCase().trim();
    const pos = this.selectedPosition();
    const teamFilter = this.selectedTeam();

    return list.filter((player: any) => {
      // 1. Filtro por nombre
      const name = (player.name || '').toLowerCase();
      const matchesSearch = !search || name.includes(search);

      // 2. Filtro por posición
      const matchesPosition = pos === 'ALL' || player.position === pos;

      // 3. Filtro por equipo / Agente libre
      const pTeamId = player.teamID ?? player.currentTeamID;
      let matchesTeam = false;

      if (teamFilter === 'ALL') {
        matchesTeam = true;
      } else if (teamFilter === 'FREE_AGENT') {
        // Es agente libre si no tiene teamID o es null/0
        matchesTeam = !pTeamId || pTeamId === 0;
      } else {
        // Pertenece al equipo seleccionado
        matchesTeam = pTeamId !== undefined && String(pTeamId) === String(teamFilter);
      }

      return matchesSearch && matchesPosition && matchesTeam;
    });
  });
}
