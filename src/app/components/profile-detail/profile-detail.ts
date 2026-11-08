import { Component, OnInit, inject, signal } from '@angular/core'; // 👈 Añadimos OnInit
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { User } from '../../models/User';
import { AuthService } from '../../services/auth-service';
import { Team } from '../../models/Team'; // 👈 Importamos el modelo Team
import { TeamService } from '../../services/team-service';

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-detail.html',
  styleUrls: ['./profile-detail.css'],
})
export class ProfileDetail implements OnInit {
  // 👈 Implementamos OnInit
  public authService = inject(AuthService) as AuthService;
  private teamService = inject(TeamService); // 👈 Inyectamos el servicio
  private router = inject(Router);

  successMessage: string | null = null;
  errorMessage: string | null = null;

  favoriteTeamsList = signal<Team[]>([]);

  showAllTeams = signal<boolean>(false);
  showAllPlayers = signal<boolean>(false);
  showAllChampionships = signal<boolean>(false);
  showReadPassword = signal<boolean>(false);

  ngOnInit() {
    this.loadFavoriteTeams();
  }

  loadFavoriteTeams() {
    const user = this.currentUser;
    if (user && user.favoriteTeams && user.favoriteTeams.length > 0) {
      const favoriteIds = user.favoriteTeams;
      const loadedTeams: Team[] = [];

      favoriteIds.forEach((id: number) => {
        this.teamService.getById(id).subscribe({
          next: (res: any) => {
            const team = res as Team;
            if (team) {
              loadedTeams.push(team);
              this.favoriteTeamsList.set([...loadedTeams]);
            }
          },
          error: (err: any) => {
            console.error('Error al cargar equipo favorito:', err);
          },
        });
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
      country: userValue.country || 'Argentina',
    } as User;
  }

  toggleView(type: 'teams' | 'players' | 'championships') {
    if (type === 'teams') this.showAllTeams.update((v) => !v);
    else if (type === 'players') this.showAllPlayers.update((v) => !v);
    else if (type === 'championships') this.showAllChampionships.update((v) => !v);
  }

  removeFavorite(type: string, idToRemove: number) {
    const user = this.currentUser;
    if (!user || !user.id) return;

    let updatedFields: any = {};
    if (type === 'team' && user.favoriteTeams) {
      updatedFields = {
        favoriteTeams: user.favoriteTeams.filter((id: number) => id !== idToRemove),
      };
      // Actualizamos también la lista visual local inmediatamente
      this.favoriteTeamsList.update((teams) => teams.filter((t) => t.id !== idToRemove));
    } else if (type === 'player' && user.favoritePlayers) {
      updatedFields = {
        favoritePlayers: user.favoritePlayers.filter((id: number) => id !== idToRemove),
      };
    } else if (type === 'championship' && user.favoriteChampionships) {
      updatedFields = {
        favoriteChampionships: user.favoriteChampionships.filter((id: number) => id !== idToRemove),
      };
    }

    this.authService.updateUser(user.id, updatedFields).subscribe();
  }

  toggleReadPassword() {
    this.showReadPassword.update((value) => !value);
  }

  navigateToEdit() {
    this.router.navigate(['/profile/edit']);
  }
}
