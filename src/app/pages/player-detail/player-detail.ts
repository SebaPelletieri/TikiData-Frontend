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
      const nameParam = params.get('name'); // 👈 Capturamos el :name de la ruta
      if (nameParam) {
        this.loadPlayerByName(nameParam);
      }
    });
  }

  loadPlayerByName(nameSlug: string) {
    this.isLoading.set(true);

    // Normalizamos el slug de la URL para que coincida con el nombre (ej: "rodrigo-rey" -> "rodrigo rey")
    const cleanSearchName = nameSlug
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/-/g, ' ');

    this.playerService.getAllPlayers().subscribe({
      next: (players: Player[]) => {
        const found = players.find((p: any) => {
          if (!p.name) return false;
          const playerNameClean = p.name
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

          return playerNameClean === cleanSearchName;
        });

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
