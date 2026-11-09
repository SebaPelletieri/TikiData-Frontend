import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { User } from '../../models/User';
import { AuthService } from '../../services/auth-service';
import { Team } from '../../models/Team';
import { TeamService } from '../../services/team-service';
import { ChampionshipService } from '../../services/championship-service';
import { Championship } from '../../models/Championship';
import { FormsModule } from '@angular/forms';
import { TeamForm } from '../../components/team-form/team-form';

interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TeamForm],
  templateUrl: './profile-detail.html',
  styleUrls: ['./profile-detail.css'],
})
export class ProfileDetail implements OnInit {
  public authService = inject(AuthService) as AuthService;
  private teamService = inject(TeamService);
  private championshipService = inject(ChampionshipService);
  private router = inject(Router);

  successMessage: string | null = null;
  errorMessage: string | null = null;

  favoriteTeamsList = signal<Team[]>([]);

  showAllTeams = signal<boolean>(false);
  showAllPlayers = signal<boolean>(false);
  showAllChampionships = signal<boolean>(false);
  showReadPassword = signal<boolean>(false);

  // 🚀 Reemplazamos el modal por el estado del panel lateral plano
  isTeamFormPanelOpen = signal<boolean>(false);

  // 🛡️ Propiedad para verificar si el usuario es Administrador
  get isAdmin(): boolean {
    const user = this.currentUser;
    return user?.role === 'Administrador';
  }

  allTeamsForAdmin = signal<Team[]>([]);
  allUsersForAdmin = signal<User[]>([]);
  allChampionshipsForAdmin = signal<Championship[]>([]);
  totalChampionshipsCount = signal<number>(0);

  adminSearchText = signal<string>('');
  selectedAdminCountry = signal<string>('ALL');
  selectedAdminChampionship = signal<string>('ALL');

  isCountryDropdownOpen = false;
  isChampionshipDropdownOpen = false;

  currentPage = signal<number>(1);
  itemsPerPage = 7;

  ngOnInit() {
    this.loadFavoriteTeams();
    if (this.isAdmin) {
      this.loadAdminData();
    }
  }

  loadFavoriteTeams() {
    const user = this.currentUser;
    if (user && user.favoriteTeams && user.favoriteTeams.length > 0) {
      const favoriteIds = user.favoriteTeams;
      const loadedTeams: Team[] = [];

      favoriteIds.forEach((id: number) => {
        this.teamService.getById(id).subscribe({
          next: (team: Team) => {
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

  loadAdminData() {
    this.teamService['http'].get<Team[]>('http://localhost:3000/equipos').subscribe({
      next: (teams) => this.allTeamsForAdmin.set(teams || []),
    });

    this.authService.getAllUsers().subscribe({
      next: (users) => this.allUsersForAdmin.set(users || []),
    });

    this.championshipService['http']
      .get<Championship[]>('http://localhost:3000/campeonatos')
      .subscribe({
        next: (champs) => {
          this.allChampionshipsForAdmin.set(champs || []);
          this.totalChampionshipsCount.set(champs ? champs.length : 0);
        },
      });
  }

  // 🚀 Métodos actualizados para abrir/cerrar el panel lateral plano
  openTeamModal() {
    this.isTeamFormPanelOpen.set(true);
  }

  closeTeamModal() {
    this.isTeamFormPanelOpen.set(false);
    this.loadAdminData(); // Recargamos la tabla al cerrar por si se creó un equipo
  }

  adminCountryOptions = computed<FilterOption[]>(() => {
    const teams = this.allTeamsForAdmin();
    const countriesSet = new Set<string>();

    teams.forEach((team) => {
      if (team.country && team.country.trim() !== '') {
        countriesSet.add(team.country.trim());
      }
    });

    const options: FilterOption[] = [{ value: 'ALL', label: 'Todos los países' }];
    Array.from(countriesSet)
      .sort()
      .forEach((country) => {
        options.push({ value: country, label: country });
      });

    return options;
  });

  adminChampionshipOptions = computed<FilterOption[]>(() => {
    const champs = this.allChampionshipsForAdmin();
    const options: FilterOption[] = [{ value: 'ALL', label: 'Todos los campeonatos' }];

    champs
      .filter((c) => c.type === 'LIGA')
      .forEach((champ) => {
        options.push({ value: String(champ.id), label: champ.name });
      });

    return options;
  });

  filteredTeamsForAdmin = computed(() => {
    const teams = this.allTeamsForAdmin();
    const search = this.adminSearchText().toLowerCase().trim();
    const countryFilter = this.selectedAdminCountry();
    const champFilter = this.selectedAdminChampionship();

    return teams.filter((team) => {
      const matchesSearch = !search || team.name.toLowerCase().includes(search);
      const matchesCountry = countryFilter === 'ALL' || team.country === countryFilter;

      let matchesChamp = true;
      if (champFilter !== 'ALL') {
        const champIdNum = Number(champFilter);
        matchesChamp = !!team.championshipsActive && team.championshipsActive.includes(champIdNum);
      }

      return matchesSearch && matchesCountry && matchesChamp;
    });
  });

  paginatedTeamsForAdmin = computed(() => {
    const filtered = this.filteredTeamsForAdmin();
    const page = this.currentPage();
    const start = (page - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredTeamsForAdmin().length / this.itemsPerPage) || 1;
  });

  pagesArray = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  get paginationInfoText(): string {
    const filtered = this.filteredTeamsForAdmin();
    const total = filtered.length;
    if (total === 0) return 'Mostrando 0 de 0 equipos';

    const start = (this.currentPage() - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, total);
    const totalGlobal = this.allTeamsForAdmin().length;

    return `Mostrando ${start} a ${end} de ${totalGlobal} equipos`;
  }

  get selectedCountryLabel(): string {
    const current = this.selectedAdminCountry();
    return this.adminCountryOptions().find((c) => c.value === current)?.label || 'Todos los países';
  }

  get selectedChampionshipLabel(): string {
    const current = this.selectedAdminChampionship();
    return (
      this.adminChampionshipOptions().find((c) => c.value === current)?.label ||
      'Todos los campeonatos'
    );
  }

  toggleCountryDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isCountryDropdownOpen = !this.isCountryDropdownOpen;
    this.isChampionshipDropdownOpen = false;
  }

  toggleChampionshipDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isChampionshipDropdownOpen = !this.isChampionshipDropdownOpen;
    this.isCountryDropdownOpen = false;
  }

  selectAdminCountry(countryValue: string): void {
    this.selectedAdminCountry.set(countryValue);
    this.currentPage.set(1);
    this.isCountryDropdownOpen = false;
  }

  selectAdminChampionship(champValue: string): void {
    this.selectedAdminChampionship.set(champValue);
    this.currentPage.set(1);
    this.isChampionshipDropdownOpen = false;
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
      role: userValue.role || 'Usuario',
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

  deleteTeamAsAdmin(id: number) {
    if (confirm('¿Estás seguro de eliminar este equipo del sistema?')) {
      this.teamService.deleteTeam(id);
      this.allTeamsForAdmin.update((teams) => teams.filter((t) => t.id !== id));
    }
  }

  toggleReadPassword() {
    this.showReadPassword.update((value) => !value);
  }

  navigateToEdit() {
    this.router.navigate(['/profile/edit']);
  }
}
