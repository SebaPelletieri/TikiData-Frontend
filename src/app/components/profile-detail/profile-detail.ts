import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { User } from '../../models/User';
import { AuthService } from '../../services/auth-service';
import { Team } from '../../models/Team';
import { Championship } from '../../models/Championship';
import { Player } from '../../models/Player';
import { goBackOr } from '../../utils/navigation';

type FavoriteType = 'team' | 'player' | 'championship';

const API = 'http://localhost:3000';

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile-detail.html',
  styleUrls: ['./profile-detail.css'],
})
export class ProfileDetail implements OnInit {
  public authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private destroyRef = inject(DestroyRef);

  profileUser = signal<User | null>(null);

  favoriteTeamsList = signal<Team[]>([]);
  favoriteChampionshipsList = signal<Championship[]>([]);
  favoritePlayersList = signal<Player[]>([]);

  favoriteTeamsCount = computed(() => this.favoriteTeamsList().length);
  favoritePlayersCount = computed(() => this.favoritePlayersList().length);
  favoriteChampionshipsCount = computed(() => this.favoriteChampionshipsList().length);

  /**
   * true cuando se mira el perfil propio (/profile, o /profile/:id con el id propio).
   * Si un admin entra al perfil de otro usuario es solo lectura: no puede quitarle
   * favoritos ni ve el botón "Editar perfil" (que editaba el perfil del admin, no el de él).
   */
  isOwnProfile = computed(() => {
    const viewed = this.profileUser();
    const me = this.authService.currentUser();
    return !!viewed && !!me && String(viewed.id) === String(me.id);
  });

  /** Nombre visible: algunos usuarios viejos tienen name/userName en vez de username. */
  displayName = computed(() => {
    const u = this.profileUser() as any;
    if (!u) return '';
    return u.username || u.name || u.userName || u.email?.split('@')[0] || 'Usuario';
  });

  ngOnInit() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id') ?? this.authService.currentUser()?.id;
          // Se pide siempre al servidor: la copia guardada en el navegador puede estar vieja
          return id !== undefined && id !== null ? this.authService.getUserById(id) : of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (user) => {
          this.profileUser.set(user);
          if (user) this.loadFavorites(user);
        },
        error: (err) => console.error('Error al cargar el usuario:', err),
      });
  }

  /**
   * Trae las tres listas en un solo paso y filtra por los ids del usuario. Antes se
   * hacía un pedido por favorito y los ids se pasaban por Number(), así que los ids de
   * texto (equipos y campeonatos importados) quedaban afuera.
   */
  private loadFavorites(user: User): void {
    const ids = (list?: (number | string)[]) => new Set((list || []).map((id) => String(id)));
    const teamIds = ids(user.favoriteTeams);
    const champIds = ids(user.favoriteChampionships);
    const playerIds = ids(user.favoritePlayers);

    forkJoin({
      teams: teamIds.size ? this.http.get<Team[]>(`${API}/equipos`) : of([] as Team[]),
      champs: champIds.size
        ? this.http.get<Championship[]>(`${API}/campeonatos`)
        : of([] as Championship[]),
      players: playerIds.size ? this.http.get<Player[]>(`${API}/jugadores`) : of([] as Player[]),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ teams, champs, players }) => {
          this.favoriteTeamsList.set(teams.filter((t) => teamIds.has(String(t.id))));
          this.favoriteChampionshipsList.set(champs.filter((c) => champIds.has(String(c.id))));
          this.favoritePlayersList.set(players.filter((p) => playerIds.has(String(p.id))));
        },
        error: (err) => console.error('Error al cargar favoritos:', err),
      });
  }

  removeFavorite(type: FavoriteType, idToRemove: number | string | undefined) {
    // Solo el dueño del perfil puede tocar sus favoritos
    if (!this.isOwnProfile()) return;
    const user = this.profileUser();
    if (!user?.id || idToRemove === undefined) return;

    const target = String(idToRemove);
    const without = (list?: (number | string)[]) =>
      (list || []).map((id) => String(id)).filter((id) => id !== target && id !== 'null');

    let updatedFields: Partial<User> = {};
    if (type === 'team') {
      updatedFields = { favoriteTeams: without(user.favoriteTeams) };
      this.favoriteTeamsList.update((list) => list.filter((t) => String(t.id) !== target));
    } else if (type === 'player') {
      updatedFields = { favoritePlayers: without(user.favoritePlayers) };
      this.favoritePlayersList.update((list) => list.filter((p) => String(p.id) !== target));
    } else {
      updatedFields = { favoriteChampionships: without(user.favoriteChampionships) };
      this.favoriteChampionshipsList.update((list) => list.filter((c) => String(c.id) !== target));
    }

    // Se actualiza también la copia local, para que un segundo borrado parta de la lista nueva
    this.profileUser.set({ ...user, ...updatedFields });

    this.authService.updateUser(user.id, updatedFields).subscribe({
      error: (err) => {
        console.error('Error al guardar en el backend:', err);
        this.profileUser.set(user);
        this.loadFavorites(user);
      },
    });
  }

  navigateToEdit() {
    this.router.navigate(['/profile/edit']);
  }

  goBack() {
    goBackOr(this.location, this.router, '/admin/users');
  }
}
