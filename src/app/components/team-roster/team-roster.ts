import { Component, input, output, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Player } from '../../models/Player';

@Component({
  selector: 'app-team-roster',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-roster.html',
  styleUrl: './team-roster.css',
})

export class TeamRoster implements OnInit {
  private http = inject(HttpClient);

  players = input<Player[]>([]);
  teamId = input<number | undefined>(undefined);
  playerAdded = output<Player>();

  dorsalInput = signal<string>('');
  dorsalTouched = signal<boolean>(false); 
  isModalOpen = signal(false);

  allRegisteredPlayers = signal<Player[]>([]);
  searchQuery = signal<string>('');
  selectedPlayer = signal<Player | null>(null);

  // Validación de dorsal
  dorsalError = computed(() => {
    const val = this.dorsalInput().trim();
    if (!val) {
      return 'El dorsal es obligatorio.';
    }
    const num = Number(val);
    if (isNaN(num) || num < 1 || num > 99) {
      return 'El dorsal debe ser entre 1 y 99.';
    }
    return null;
  });

  freeAgents = computed(() => {
    return this.allRegisteredPlayers().filter((p) => !p.currentTeamID || p.currentTeamID === 0);
  });

  searchResults = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return [];
    return this.freeAgents().filter((p) => p.name.toLowerCase().includes(q));
  });

  goalkeepers = computed(() => this.players().filter((p) => p.position === 'ARQ'));
  defenders = computed(() => this.players().filter((p) => p.position === 'DEF'));
  midfielders = computed(() => this.players().filter((p) => p.position === 'MED'));
  forwards = computed(() => this.players().filter((p) => p.position === 'DEL'));

  ngOnInit(): void {
    this.loadAllPlayers();
  }

  loadAllPlayers(): void {
    this.http.get<Player[]>('http://localhost:3000/jugadores').subscribe({
      next: (res) => this.allRegisteredPlayers.set(res || []),
      error: (err) => console.error('Error al cargar jugadores:', err),
    });
  }

  openModal(): void {
    this.loadAllPlayers();
    this.searchQuery.set('');
    this.selectedPlayer.set(null);
    this.dorsalInput.set('');
    this.dorsalTouched.set(false); // 👈 Reiniciar estado
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  selectPlayer(player: Player): void {
    this.selectedPlayer.set(player);
    this.searchQuery.set(player.name);
  }

  clearSelection(): void {
    this.selectedPlayer.set(null);
    this.searchQuery.set('');
  }

  getDorsal(player: Player): number | string {
    const tId = this.teamId();
    if (tId && player.dorsals && player.dorsals[tId] !== undefined) {
      return player.dorsals[tId];
    }
    return '-';
  }

  onDorsalInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const onlyDigits = inputEl.value.replace(/\D/g, '');
    this.dorsalInput.set(onlyDigits);
    inputEl.value = onlyDigits;
    this.dorsalTouched.set(true);
  }

  onDorsalBlur(): void {
    this.dorsalTouched.set(true);
  }

  assignPlayerToTeam(): void {
    this.dorsalTouched.set(true);

    if (this.dorsalError() || !this.selectedPlayer()) {
      return;
    }

    const player = this.selectedPlayer()!;
    const tId = Number(this.teamId());
    const dorsalNum = Number(this.dorsalInput());

    if (!tId) return;

    const currentDorsals = player.dorsals || {};
    const updatedDorsals = {
      ...currentDorsals,
      [tId]: dorsalNum,
    };

    const updatePayload = {
      currentTeamID: tId,
      dorsals: updatedDorsals,
    };

    this.http
      .patch<Player>(`http://localhost:3000/jugadores/${player.id}`, updatePayload)
      .subscribe({
        next: (updated) => {
          this.playerAdded.emit(updated);
          this.closeModal();
        },
        error: (err) => console.error('Error al fichar jugador:', err),
      });
  }
}
