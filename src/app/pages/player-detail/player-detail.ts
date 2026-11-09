import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
// Importamos el componente visual hijo
import { PlayerDetail } from '../../components/player-detail/player-detail';
import { Player } from '../../models/Player';
import { PlayerService } from '../../services/player-service';

@Component({
  selector: 'app-player-detail-page',
  standalone: true,
  imports: [CommonModule, PlayerDetail],
  templateUrl: './player-detail.html',
  styleUrls: ['./player-detail.css'],
})
export class PlayerDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  public playerService = inject(PlayerService);

  playerActual = signal<Player | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadPlayer(id);
      }
    });
  }

  loadPlayer(id: string) {
    this.isLoading.set(true);
    this.playerService.getAllPlayers().subscribe({
      next: (players: Player[]) => {
        const found = players.find((p: any) => String(p.id) === String(id));
        if (found) {
          this.playerActual.set(found);
          this.playerService.playerActual.set(found);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando jugador:', err);
        this.isLoading.set(false);
      },
    });
  }
}
