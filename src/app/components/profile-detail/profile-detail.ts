import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { User } from '../../models/User';
import { AuthService } from '../../services/auth-service';
import { Team } from '../../models/Team';
import { TeamService } from '../../services/team-service';
import { ChampionshipService } from '../../services/championship-service';
import { Championship } from '../../models/Championship';
import { PlayerService } from '../../services/player-service';
import { Player } from '../../models/Player';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './profile-detail.html',
  styleUrls: ['./profile-detail.css'],
})
export class ProfileDetail implements OnInit {
  public authService = inject(AuthService) as AuthService;
  private teamService = inject(TeamService);
  private championshipService = inject(ChampionshipService);
  private playerService = inject(PlayerService);
  private router = inject(Router);

  successMessage: string | null = null;
  errorMessage: string | null = null;

  favoriteTeamsList = signal<Team[]>([]);
  favoriteChampionshipsList = signal<Championship[]>([]);
  favoritePlayersList = signal<Player[]>([]);

  // 👇 CONTADORES REACTIVOS AUTOMÁTICOS 👇
  favoriteTeamsCount = computed(() => this.favoriteTeamsList().length);
  favoritePlayersCount = computed(() => this.favoritePlayersList().length);
  favoriteChampionshipsCount = computed(() => this.favoriteChampionshipsList().length);

  showAllTeams = signal<boolean>(false);
  showAllPlayers = signal<boolean>(false);
  showAllChampionships = signal<boolean>(false);

  ngOnInit() {
    this.loadFavorites();
  }

  loadFavorites() {
    const user = this.currentUser;
    if (!user) return;

    // 1. Cargar Equipos Favoritos
    if (user.favoriteTeams && user.favoriteTeams.length > 0) {
      const loadedTeams: Team[] = [];
      user.favoriteTeams.forEach((id: any) => {
        const teamId = Number(id);
        if (!isNaN(teamId)) {
          this.teamService.getById(teamId).subscribe({
            next: (team: Team) => {
              if (team) {
                loadedTeams.push(team);
                this.favoriteTeamsList.set([...loadedTeams]);
              }
            },
            error: (err: any) => {
              console.error(`Error al cargar el equipo con ID ${teamId}:`, err);
            },
          });
        }
      });
    }

    // 2. Cargar Campeonatos Favoritos
    if (user.favoriteChampionships && user.favoriteChampionships.length > 0) {
      const loadedChamps: Championship[] = [];
      user.favoriteChampionships.forEach((id: any) => {
        const champId = Number(id);
        if (!isNaN(champId)) {
          this.championshipService.getByID(champId).subscribe({
            next: (champ: Championship) => {
              if (champ) {
                loadedChamps.push(champ);
                this.favoriteChampionshipsList.set([...loadedChamps]);
              }
            },
            error: (err: any) => {
              console.error(`Error al cargar el campeonato con ID ${champId}:`, err);
            },
          });
        }
      });
    }

    // 3. Cargar Jugadores Favoritos
    if (user.favoritePlayers && user.favoritePlayers.length > 0) {
      const loadedPlayers: Player[] = [];
      user.favoritePlayers.forEach((id: any) => {
        const playerId = Number(id);
        if (!isNaN(playerId)) {
          this.playerService.getByID(playerId).subscribe({
            next: (player: Player) => {
              if (player) {
                loadedPlayers.push(player);
                this.favoritePlayersList.set([...loadedPlayers]);
              }
            },
            error: (err: any) => {
              console.error(`Error al cargar el jugador con ID ${playerId}:`, err);
            },
          });
        }
      });
    }
  }

  get currentUser(): User | null {
    const userValue = (this.authService.currentUser as any)();
    if (!userValue || typeof userValue !== 'object') return null;

    return {
      ...userValue,
      username:
        userValue.username ||
        userValue.name ||
        userValue.userName ||
        userValue.email?.split('@')[0] ||
        'Usuario',
      role: userValue.role || 'Usuario',
    } as User;
  }

  removeFavorite(type: 'team' | 'player' | 'championship', idToRemove: number) {
    const user = this.currentUser;
    if (!user || !user.id) return;

    let updatedFields: any = {};
    const cleanId = Number(idToRemove);

    if (type === 'team' && user.favoriteTeams) {
      const newFavoriteTeams = user.favoriteTeams
        .map((id: any) => Number(id))
        .filter((id: number) => id !== cleanId);
      updatedFields = { favoriteTeams: newFavoriteTeams };

      // Actualización visual inmediata
      this.favoriteTeamsList.update((teams) => teams.filter((t) => Number(t.id) !== cleanId));
    } else if (type === 'player' && user.favoritePlayers) {
      const newFavoritePlayers = user.favoritePlayers
        .map((id: any) => Number(id))
        .filter((id: number) => id !== cleanId);
      updatedFields = { favoritePlayers: newFavoritePlayers };

      this.favoritePlayersList.update((players) => players.filter((p) => Number(p.id) !== cleanId));
    } else if (type === 'championship' && user.favoriteChampionships) {
      const newFavoriteChamps = user.favoriteChampionships
        .map((id: any) => Number(id))
        .filter((id: number) => id !== cleanId);
      updatedFields = { favoriteChampionships: newFavoriteChamps };

      this.favoriteChampionshipsList.update((champs) =>
        champs.filter((c) => Number(c.id) !== cleanId),
      );
    }

    // 👇 AQUÍ ESTABA EL ERROR: Nos suscribimos explícitamente a la respuesta del servidor 👇
    this.authService.updateUser(user.id, updatedFields).subscribe({
      next: (updatedUser) => {
        console.log('Favorito eliminado y persistido en el servidor con éxito:', updatedUser);
      },
      error: (err) => {
        console.error('Error al guardar en el backend:', err);
        // Si falla la petición, puedes recargar los favoritos originales para mantener consistencia
        this.loadFavorites();
      },
    });
  }

  navigateToEdit() {
    this.router.navigate(['/profile/edit']);
  }
}
