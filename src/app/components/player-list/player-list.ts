import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PlayerService } from '../../services/player-service';
import { Team } from '../../models/Team';

@Component({
  imports: [CommonModule, FormsModule, RouterModule],
  selector: 'app-player-list',
  styleUrl: './player-list.css',
  templateUrl: './player-list.html',
})
export class PlayerList implements OnInit{
  public playerService = inject(PlayerService);
  private http = inject(HttpClient);
  teams = signal<Team[]>([]);
  searchText = signal('');
  selectedPosition = signal('ALL');
  selectedTeam = signal('ALL');

  ngOnInit(): void {

    this.playerService.getAll();
    
    // Cargar equipos para mostrar sus nombres en la tabla
    this.http.get<Team[]>('http://localhost:3000/equipos').subscribe({
      next: (data) => this.teams.set(data),
      error: (err) => console.error('Error al cargar equipos', err)
    });
  }

  getTeamName(teamId?: number): string {
    if (!teamId) return 'Agente libre';
    const found = this.teams().find(t => t.id === teamId);
    return found?.name || 'Sin equipo';
  }

  filteredPlayers = computed(() => {
    
    const list = this.playerService.players ? this.playerService.players() : []; 

    const search = this.searchText().toLowerCase().trim();
    const pos = this.selectedPosition();
    const teamId = this.selectedTeam();

    return list.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(search);
      
      const matchesPosition = pos === 'ALL' || player.position === pos;
      
      const matchesTeam = teamId === 'ALL' || String(player.currentTeamID) === String(teamId);

      return matchesSearch && matchesPosition && matchesTeam;
    });
  })
}