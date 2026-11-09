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
import { ChampionshipForm } from '../../components/championship-form/championship-form';

interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TeamForm, ChampionshipForm],
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

  // Estado del panel lateral del formulario de equipos
  isTeamFormPanelOpen = signal<boolean>(false);

  // Estados para los modales flotantes personalizados de eliminación
  teamToDeleteId = signal<number | null>(null);
  championshipToDeleteId = signal<number | null>(null);

  // 🛡️ Propiedad para verificar si el usuario es Administrador
  get isAdmin(): boolean {
    const user = this.currentUser;
    return user?.role === 'Administrador';
  }

  allTeamsForAdmin = signal<Team[]>([]);
  allUsersForAdmin = signal<User[]>([]);
  allChampionshipsForAdmin = signal<Championship[]>([]);
  totalChampionshipsCount = signal<number>(0);

  // Filtros de Equipos
  adminSearchText = signal<string>('');
  selectedAdminCountry = signal<string>('ALL');
  selectedAdminChampionship = signal<string>('ALL');

  isCountryDropdownOpen = false;
  isChampionshipDropdownOpen = false;

  currentPage = signal<number>(1);
  itemsPerPage = 7;

  // 🌟 Filtros y Paginación de Campeonatos
  championshipSearchText = signal<string>('');
  selectedChampionshipCountry = signal<string>('ALL');
  selectedChampionshipType = signal<string>('ALL');

  isChampCountryDropdownOpen = false;
  isChampTypeDropdownOpen = false;

  currentChampPage = signal<number>(1);
  itemsPerPageChamps = 7;

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

  openTeamModal() {
    this.isTeamFormPanelOpen.set(true);
  }

  closeTeamModal() {
    this.isTeamFormPanelOpen.set(false);
    this.loadAdminData();
  }

  // Métodos para el modal de eliminación de Equipos
  confirmDelete(id: number) {
    this.teamToDeleteId.set(id);
  }

  cancelDelete() {
    this.teamToDeleteId.set(null);
  }

  executeDelete() {
    const id = this.teamToDeleteId();
    if (id !== null) {
      this.teamService.deleteTeam(id);
      this.allTeamsForAdmin.update((teams) => teams.filter((t) => t.id !== id));
      this.cancelDelete();
    }
  }

  // Métodos para el modal de eliminación de Campeonatos
  confirmDeleteChampionship(id: number) {
    this.championshipToDeleteId.set(id);
  }

  cancelDeleteChampionship() {
    this.championshipToDeleteId.set(null);
  }

  executeDeleteChampionship() {
    const id = this.championshipToDeleteId();
    if (id !== null) {
      this.championshipService['http'].delete(`http://localhost:3000/campeonatos/${id}`).subscribe({
        next: () => {
          this.allChampionshipsForAdmin.update((champs) => champs.filter((c) => c.id !== id));
          this.totalChampionshipsCount.update((count) => count - 1);
          this.cancelDeleteChampionship();
        },
        error: (err) => console.error('Error al eliminar campeonato:', err),
      });
    }
  }

  // Opciones de Países para Equipos
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

  // 🌟 Opciones y Filtros para Campeonatos (País y Tipo)
  champCountryOptions = computed<FilterOption[]>(() => {
    const champs = this.allChampionshipsForAdmin();
    const countriesSet = new Set<string>();

    champs.forEach((champ: any) => {
      if (champ.country && champ.country.trim() !== '') {
        countriesSet.add(champ.country.trim());
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

  champTypeOptions = computed<FilterOption[]>(() => {
    const champs = this.allChampionshipsForAdmin();
    const typesSet = new Set<string>();

    champs.forEach((champ: any) => {
      if (champ.type && champ.type.trim() !== '') {
        typesSet.add(champ.type.trim());
      }
    });

    const options: FilterOption[] = [{ value: 'ALL', label: 'Todos los tipos' }];
    Array.from(typesSet)
      .sort()
      .forEach((type) => {
        options.push({ value: type, label: type });
      });

    return options;
  });

  filteredChampionshipsForAdmin = computed(() => {
    const champs = this.allChampionshipsForAdmin();
    const search = this.championshipSearchText().toLowerCase().trim();
    const countryFilter = this.selectedChampionshipCountry();
    const typeFilter = this.selectedChampionshipType();

    return champs.filter((champ: any) => {
      const matchesSearch = !search || champ.name.toLowerCase().includes(search);
      const matchesCountry = countryFilter === 'ALL' || champ.country === countryFilter;
      const matchesType = typeFilter === 'ALL' || champ.type === typeFilter;

      return matchesSearch && matchesCountry && matchesType;
    });
  });

  paginatedChampionshipsForAdmin = computed(() => {
    const filtered = this.filteredChampionshipsForAdmin();
    const page = this.currentChampPage();
    const start = (page - 1) * this.itemsPerPageChamps;
    return filtered.slice(start, start + this.itemsPerPageChamps);
  });

  totalChampPages = computed(() => {
    return Math.ceil(this.filteredChampionshipsForAdmin().length / this.itemsPerPageChamps) || 1;
  });

  champPagesArray = computed(() => {
    const total = this.totalChampPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  changeChampPage(page: number) {
    if (page >= 1 && page <= this.totalChampPages()) {
      this.currentChampPage.set(page);
    }
  }

  get champPaginationInfoText(): string {
    const filtered = this.filteredChampionshipsForAdmin();
    const total = filtered.length;
    if (total === 0) return 'Mostrando 0 de 0 campeonatos';

    const start = (this.currentChampPage() - 1) * this.itemsPerPageChamps + 1;
    const end = Math.min(start + this.itemsPerPageChamps - 1, total);
    const totalGlobal = this.allChampionshipsForAdmin().length;

    return `Mostrando ${start} a ${end} de ${totalGlobal} campeonatos`;
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

  get selectedChampCountryLabel(): string {
    const current = this.selectedChampionshipCountry();
    return this.champCountryOptions().find((c) => c.value === current)?.label || 'Todos los países';
  }

  get selectedChampTypeLabel(): string {
    const current = this.selectedChampionshipType();
    return this.champTypeOptions().find((t) => t.value === current)?.label || 'Todos los tipos';
  }

  toggleCountryDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isCountryDropdownOpen = !this.isCountryDropdownOpen;
    this.isChampionshipDropdownOpen = false;
    this.isChampCountryDropdownOpen = false;
    this.isChampTypeDropdownOpen = false;
  }

  toggleChampionshipDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isChampionshipDropdownOpen = !this.isChampionshipDropdownOpen;
    this.isCountryDropdownOpen = false;
    this.isChampCountryDropdownOpen = false;
    this.isChampTypeDropdownOpen = false;
  }

  toggleChampCountryDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isChampCountryDropdownOpen = !this.isChampCountryDropdownOpen;
    this.isChampTypeDropdownOpen = false;
    this.isCountryDropdownOpen = false;
    this.isChampionshipDropdownOpen = false;
  }

  toggleChampTypeDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isChampTypeDropdownOpen = !this.isChampTypeDropdownOpen;
    this.isChampCountryDropdownOpen = false;
    this.isCountryDropdownOpen = false;
    this.isChampionshipDropdownOpen = false;
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

  selectChampCountry(countryValue: string): void {
    this.selectedChampionshipCountry.set(countryValue);
    this.currentChampPage.set(1);
    this.isChampCountryDropdownOpen = false;
  }

  selectChampType(typeValue: string): void {
    this.selectedChampionshipType.set(typeValue);
    this.currentChampPage.set(1);
    this.isChampTypeDropdownOpen = false;
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

  toggleReadPassword() {
    this.showReadPassword.update((value) => !value);
  }

  navigateToEdit() {
    this.router.navigate(['/profile/edit']);
  }
}
