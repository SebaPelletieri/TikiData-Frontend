import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth-service'; // <-- 1. Importa tu AuthService

@Component({
  selector: 'app-championship-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './championship-detail.html',
  styleUrls: ['./championship-detail.css'],
})
export class ChampionshipDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  public authService = inject(AuthService); // <-- 2. Inyecta el AuthService

  championship = signal<any | null>(null);
  activeTab = signal<'general' | 'table' | 'matches' | 'scorers' | 'cards'>('general');

  // ... (tus signals de standings, upcomingMatches, topScorers se mantienen igual)
  standings = signal<any[]>([]);
  upcomingMatches = signal<any[]>([]);
  topScorers = signal<any[]>([]);

  isFollowing = signal<boolean>(false);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const nameParam = params.get('name');
      if (nameParam) {
        const formattedName = nameParam.replace(/-/g, ' ');
        this.loadChampionshipByName(formattedName);
      }
    });
  }

  private loadChampionshipByName(searchName: string) {
    this.http.get<any[]>(`http://localhost:3000/campeonatos`).subscribe({
      next: (champs) => {
        const found = champs.find((c) => c.name.toLowerCase().includes(searchName.toLowerCase()));

        const champData = found || {
          id: Date.now(), // Asegurar un ID temporal si es un fallback
          name: searchName.toUpperCase(),
          logo: 'https://via.placeholder.com/24',
          country: 'Argentina',
          type: 'Liga',
          season: '2026',
        };

        this.championship.set(champData);

        // 3. Verificamos si el usuario ya lo tiene en sus favoritos al cargar la vista
        const currentUser = (this.authService.currentUser as any)();
        if (currentUser && currentUser.favoriteChampionships) {
          const isFav = currentUser.favoriteChampionships.some(
            (id: any) => Number(id) === Number(champData.id),
          );
          this.isFollowing.set(isFav);
        }
      },
      error: () => {
        const fallback = {
          id: 1,
          name: searchName.toUpperCase(),
          logo: 'https://via.placeholder.com/24',
          country: 'Argentina',
          type: 'Liga',
          season: '2026',
        };
        this.championship.set(fallback);
      },
    });
  }

  setTab(tab: 'general' | 'table' | 'matches' | 'scorers' | 'cards') {
    this.activeTab.set(tab);
  }

  // 4. Lógica para seguir / dejar de seguir y persistirlo en el backend
  toggleFollow() {
    const user = (this.authService.currentUser as any)();
    const champ = this.championship();

    if (!user || !user.id || !champ) return;

    const champId = Number(champ.id);
    let currentFavs: number[] = user.favoriteChampionships
      ? user.favoriteChampionships.map((id: any) => Number(id))
      : [];

    let updatedFavorites: number[];

    if (this.isFollowing()) {
      // Dejar de seguir (Remover)
      updatedFavorites = currentFavs.filter((id) => id !== champId);
    } else {
      // Seguir (Agregar)
      updatedFavorites = [...currentFavs, champId];
    }

    // Actualizamos el estado visual de forma inmediata
    this.isFollowing.set(!this.isFollowing());

    // Guardamos en el backend usando tu método updateUser del AuthService
    this.authService.updateUser(user.id, { favoriteChampionships: updatedFavorites }).subscribe({
      next: () => {
        console.log('Campeonatos favoritos actualizados en el servidor correctamente.');
      },
      error: (err) => {
        console.error('Error al actualizar campeonatos favoritos:', err);
        // Revertir estado visual si la petición falla
        this.isFollowing.set(!this.isFollowing());
      },
    });
  }
}
