import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router'; // 👈 Añadido ActivatedRoute
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
  private route = inject(ActivatedRoute); // 👈 Inyectamos la ruta activa

  successMessage: string | null = null;
  errorMessage: string | null = null;

  // 👈 Señal para almacenar el usuario que se está visualizando (si es ajeno)
  profileUser = signal<User | null>(null);

  favoriteTeamsList = signal<Team[]>([]);
  favoriteChampionshipsList = signal<Championship[]>([]);
  favoritePlayersList = signal<Player[]>([]);

  favoriteTeamsCount = computed(() => this.favoriteTeamsList().length);
  favoritePlayersCount = computed(() => this.favoritePlayersList().length);
  favoriteChampionshipsCount = computed(() => this.favoriteChampionshipsList().length);

  showAllTeams = signal<boolean>(false);
  showAllPlayers = signal<boolean>(false);
  showAllChampionships = signal<boolean>(false);

  ngOnInit() {
    // 👈 Verificamos si la ruta trae un ID (ej: /profile/1)
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.authService.getUserById(id).subscribe({
          next: (user) => {
            this.profileUser.set(user);
            this.loadFavoritesForUser(user); // Cargamos sus favoritos
          },
          error: (err) => console.error('Error al cargar el usuario:', err),
        });
      } else {
        // Si no hay ID, es el perfil propio del usuario logueado
        this.profileUser.set(this.authService.currentUser());
        this.loadFavorites();
      }
    });
  }

  // 👈 Método auxiliar para cargar favoritos de cualquier usuario
  loadFavoritesForUser(user: User) {
    if (!user) return;

    // 1. Equipos
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
          });
        }
      });
    }

    // 2. Campeonatos
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
          });
        }
      });
    }

    // 3. Jugadores
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
          });
        }
      });
    }
  }

  loadFavorites() {
    this.loadFavoritesForUser(this.currentUser!);
  }

  get currentUser(): User | null {
    // 👈 Si estamos viendo un perfil por ID, devolvemos ese, sino el logueado
    const targetUser = this.profileUser() || (this.authService.currentUser as any)();
    if (!targetUser || typeof targetUser !== 'object') return null;

    return {
      ...targetUser,
      username:
        targetUser.username ||
        targetUser.name ||
        targetUser.userName ||
        targetUser.email?.split('@')[0] ||
        'Usuario',
      role: targetUser.role || 'Usuario',
    } as User;
  }

  removeFavorite(type: 'team' | 'player' | 'championship', idToRemove: number) {
    const user = this.currentUser;
    if (!user || !user.id) return;

    // Si es un perfil ajeno que está viendo el admin, idealmente no debería modificar sus favoritos o sí, pero respetamos la lógica actual:
    let updatedFields: any = {};
    const cleanId = Number(idToRemove);

    if (type === 'team' && user.favoriteTeams) {
      const newFavoriteTeams = user.favoriteTeams
        .map((id: any) => Number(id))
        .filter((id: number) => id !== cleanId);
      updatedFields = { favoriteTeams: newFavoriteTeams };
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

    this.authService.updateUser(user.id, updatedFields).subscribe({
      next: (updatedUser) => {
        console.log('Favorito actualizado con éxito:', updatedUser);
      },
      error: (err) => {
        console.error('Error al guardar en el backend:', err);
        this.loadFavorites();
      },
    });
  }

  navigateToEdit() {
    this.router.navigate(['/profile/edit']);
  }
}
