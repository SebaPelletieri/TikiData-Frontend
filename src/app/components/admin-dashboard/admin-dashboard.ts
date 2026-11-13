import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { TeamService } from '../../services/team-service';
import { ChampionshipService } from '../../services/championship-service';
import { PlayerService } from '../../services/player-service';
import { MatchService } from '../../services/match-service';
import { TeamForm } from '../team-form/team-form';
import { ChampionshipForm } from '../../components/championship-form/championship-form';
import { PlayerForm } from '../player-form/player-form';
import { AdminForm } from '../admin-form/admin-form';
import { MatchForm } from '../match-form/match-form';
import { ChampionshipEdit } from '../championship-edit/championship-edit';

/** Cantidad máxima de botones de página visibles a la vez. */
const MAX_VISIBLE_PAGES = 10;

function getVisiblePages(total: number, current: number, size = MAX_VISIBLE_PAGES): number[] {
  const end = Math.min(total, Math.max(current, size));
  const start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TeamForm,
    ChampionshipForm,
    PlayerForm,
    AdminForm,
    MatchForm,
    ChampionshipEdit,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private authService = inject(AuthService);
  private teamService = inject(TeamService);
  private championshipService = inject(ChampionshipService);
  private playerService = inject(PlayerService);
  private matchService = inject(MatchService);

  editingChampionshipId = signal<number | string | null>(null);
  successMessage = '';
  errorMessage = '';

  allUsersForAdmin = signal<any[]>([]);

  totalTeamsCount = computed(() => this.teamService.teams().length);
  totalUsersCount = computed(() => this.allUsersForAdmin().length);
  totalPlayersCount = computed(() => this.playerService.players().length);
  totalChampionshipsCount = computed(() => this.championshipService.championships().length);
  totalMatchesCount = computed(() => this.matchService.matches().length);

  // Equipos
  adminSearchText = signal('');
  selectedAdminCountry = signal('ALL');
  selectedAdminChampionship = signal('ALL');
  currentPage = signal(1);
  itemsPerPage = 10;
  isCountryDropdownOpen = false;
  isChampionshipDropdownOpen = false;
  selectedCountryLabel = 'Todos los países';
  selectedChampionshipLabel = 'Todos los campeonatos';
  teamToDeleteId = signal<number | null>(null);

  // Campeonatos
  championshipSearchText = signal('');
  selectedChampionshipCountry = signal('ALL');
  selectedChampionshipType = signal('ALL');
  currentChampPage = signal(1);
  itemsPerPageChamps = 10;
  isChampCountryDropdownOpen = false;
  isChampTypeDropdownOpen = false;
  selectedChampCountryLabel = 'Todos los países';
  selectedChampTypeLabel = 'Todos los tipos';
  championshipToDeleteId = signal<number | string | null>(null);

  // Partidos
  matchSearchText = signal('');
  selectedMatchStatus = signal('ALL');
  currentMatchPage = signal(1);
  itemsPerPageMatches = 10;
  isMatchStatusDropdownOpen = false;
  selectedMatchStatusLabel = 'Todos los estados';
  matchToDeleteId = signal<number | null>(null);

  // Jugadores
  playerSearchText = signal('');
  selectedPlayerPosition = signal('ALL');
  selectedPlayerNationality = signal('ALL');
  currentPlayerPage = signal(1);
  itemsPerPagePlayers = 10;
  isPlayerPositionDropdownOpen = false;
  isPlayerNationalityDropdownOpen = false;
  selectedPlayerPositionLabel = 'Todas las posiciones';
  selectedPlayerNationalityLabel = 'Todas las nacionalidades';
  playerToDeleteId = signal<number | null>(null);

  // Usuarios
  userSearchText = signal('');
  selectedUserRole = signal('ALL');
  currentUserPage = signal(1);
  itemsPerPageUsers = 10;
  isUserRoleDropdownOpen = false;
  selectedUserRoleLabel = 'Todos los roles';
  userToDeleteId = signal<number | null>(null);

  // Estado para la modal de confirmación de cambio de rol
  userToChangeRole = signal<{ user: any; newRole: 'Administrador' | 'Usuario' } | null>(null);

  ngOnInit(): void {
    this.loadAdminData();
  }

  loadAdminData(): void {
    this.teamService.getAll();
    this.championshipService.getAll();
    this.playerService.getAll();
    this.matchService.getAll();

    if (this.authService.getAllUsers) {
      this.authService.getAllUsers().subscribe({
        next: (users: any[]) => {
          const normalizedUsers = users.map((u: any) => ({
            ...u,
            username: u.username || u.name || u.email?.split('@')[0] || 'Usuario',
          }));
          // Ordenados alfabéticamente por username de forma automática
          normalizedUsers.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
          this.allUsersForAdmin.set(normalizedUsers);
        },
        error: (err: any) => console.error('Error al cargar usuarios:', err),
      });
    }
  }

  getTeamName(teamId: number): string {
    const team = this.teamService.teams().find((t) => t.id === teamId);
    return team ? team.name : `Equipo #${teamId}`;
  }

  confirmToggleRole(user: any): void {
    const newRole = user.role === 'Administrador' ? 'Usuario' : 'Administrador';
    this.userToChangeRole.set({ user, newRole });
  }

  cancelToggleRole(): void {
    this.userToChangeRole.set(null);
  }

  executeToggleRole(): void {
    const data = this.userToChangeRole();
    if (!data) return;

    const { user, newRole } = data;

    if (this.authService.updateUserRole) {
      this.authService.updateUserRole(user.id, newRole).subscribe({
        next: () => {
          this.successMessage = `Rol de ${user.username} actualizado a ${newRole} con éxito.`;
          this.loadAdminData();
          this.userToChangeRole.set(null);
          setTimeout(() => (this.successMessage = ''), 3000);
        },
        error: (err: any) => {
          console.error('Error al actualizar rol:', err);
          this.errorMessage = 'No se pudo actualizar el rol del usuario.';
          this.userToChangeRole.set(null);
          setTimeout(() => (this.errorMessage = ''), 3000);
        },
      });
    }
  }

  adminCountryOptions = computed(() => [
    { value: 'ALL', label: 'Todos los países' },
    { value: 'Argentina', label: 'Argentina' },
    { value: 'Brasil', label: 'Brasil' },
    { value: 'Inglaterra', label: 'Inglaterra' },
  ]);

  adminChampionshipOptions = computed(() => [
    { value: 'ALL', label: 'Todos los campeonatos' },
    { value: 'Liga Profesional', label: 'Liga Profesional' },
    { value: 'Copa Libertadores', label: 'Copa Libertadores' },
  ]);

  champCountryOptions = computed(() => [
    { value: 'ALL', label: 'Todos los países' },
    { value: 'Argentina', label: 'Argentina' },
    { value: 'Internacional', label: 'Internacional' },
  ]);

  champTypeOptions = computed(() => [
    { value: 'ALL', label: 'Todos los tipos' },
    { value: 'LIGA', label: 'LIGA' },
    { value: 'COPA', label: 'COPA' },
  ]);

  matchStatusOptions = computed(() => [
    { value: 'ALL', label: 'Todos los estados' },
    { value: 'Programado', label: 'Programado' },
    { value: 'En Vivo', label: 'En Vivo' },
    { value: 'Finalizado', label: 'Finalizado' },
  ]);

  playerPositionOptions = computed(() => [
    { value: 'ALL', label: 'Todas las posiciones' },
    { value: 'ARQ', label: 'ARQ' },
    { value: 'DEF', label: 'DEF' },
    { value: 'MED', label: 'MED' },
    { value: 'DEL', label: 'DEL' },
  ]);

  playerNationalityOptions = computed(() => {
    const players = this.playerService.players();
    const uniqueNationalities = Array.from(
      new Set(players.map((p) => p.nationality).filter(Boolean)),
    );
    const options = uniqueNationalities.map((nat) => ({ value: nat, label: nat }));
    return [{ value: 'ALL', label: 'Todas las nacionalidades' }, ...options];
  });

  userRoleOptions = computed(() => [
    { value: 'ALL', label: 'Todos los roles' },
    { value: 'Administrador', label: 'Administrador' },
    { value: 'Usuario', label: 'Usuario' },
  ]);

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

  selectAdminCountry(country: string): void {
    this.selectedAdminCountry.set(country);
    const found = this.adminCountryOptions().find((o) => o.value === country);
    this.selectedCountryLabel = found ? found.label : 'Todos los países';
    this.isCountryDropdownOpen = false;
  }

  selectAdminChampionship(champ: string): void {
    this.selectedAdminChampionship.set(champ);
    const found = this.adminChampionshipOptions().find((o) => o.value === champ);
    this.selectedChampionshipLabel = found ? found.label : 'Todos los campeonatos';
    this.isChampionshipDropdownOpen = false;
  }

  toggleChampCountryDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isChampCountryDropdownOpen = !this.isChampCountryDropdownOpen;
    this.isChampTypeDropdownOpen = false;
  }

  toggleChampTypeDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isChampTypeDropdownOpen = !this.isChampTypeDropdownOpen;
    this.isChampCountryDropdownOpen = false;
  }

  selectChampCountry(country: string): void {
    this.selectedChampionshipCountry.set(country);
    const found = this.champCountryOptions().find((o) => o.value === country);
    this.selectedChampCountryLabel = found ? found.label : 'Todos los países';
    this.isChampCountryDropdownOpen = false;
  }

  selectChampType(type: string): void {
    this.selectedChampionshipType.set(type);
    const found = this.champTypeOptions().find((o) => o.value === type);
    this.selectedChampTypeLabel = found ? found.label : 'Todos los tipos';
    this.isChampTypeDropdownOpen = false;
  }

  toggleMatchStatusDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isMatchStatusDropdownOpen = !this.isMatchStatusDropdownOpen;
  }

  selectMatchStatus(status: string): void {
    this.selectedMatchStatus.set(status);
    const found = this.matchStatusOptions().find((o) => o.value === status);
    this.selectedMatchStatusLabel = found ? found.label : 'Todos los estados';
    this.isMatchStatusDropdownOpen = false;
  }

  togglePlayerPositionDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isPlayerPositionDropdownOpen = !this.isPlayerPositionDropdownOpen;
    this.isPlayerNationalityDropdownOpen = false;
  }

  togglePlayerNationalityDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isPlayerNationalityDropdownOpen = !this.isPlayerNationalityDropdownOpen;
    this.isPlayerPositionDropdownOpen = false;
  }

  selectPlayerPosition(pos: string): void {
    this.selectedPlayerPosition.set(pos);
    const found = this.playerPositionOptions().find((o) => o.value === pos);
    this.selectedPlayerPositionLabel = found ? found.label : 'Todas las posiciones';
    this.isPlayerPositionDropdownOpen = false;
  }

  selectPlayerNationality(nationality: string): void {
    this.selectedPlayerNationality.set(nationality);
    const found = this.playerNationalityOptions().find((o) => o.value === nationality);
    this.selectedPlayerNationalityLabel = found ? found.label : 'Todas las nacionalidades';
    this.isPlayerNationalityDropdownOpen = false;
  }

  toggleUserRoleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isUserRoleDropdownOpen = !this.isUserRoleDropdownOpen;
  }

  selectUserRole(role: string): void {
    this.selectedUserRole.set(role);
    const found = this.userRoleOptions().find((o) => o.value === role);
    this.selectedUserRoleLabel = found ? found.label : 'Todos los roles';
    this.isUserRoleDropdownOpen = false;
  }

  // ================= EQUIPOS (Ordenados alfabéticamente) =================
  filteredTeams = computed(() => {
    const teams = this.teamService.sortedTeams();
    const search = this.adminSearchText().toLowerCase().trim();
    const country = this.selectedAdminCountry();
    const championshipId = this.selectedAdminChampionship();

    return teams.filter((t) => {
      const teamName = (t.name || '').toLowerCase();
      const teamCountry = t.country || '';

      const matchesSearch = !search || teamName.includes(search);
      const matchesCountry = country === 'ALL' || teamCountry === country;

      let matchesChampionship = true;
      if (championshipId !== 'ALL') {
        const champIdNum = Number(championshipId);
        matchesChampionship =
          Array.isArray(t.championshipsActive) && t.championshipsActive.includes(champIdNum);
      }

      return matchesSearch && matchesCountry && matchesChampionship;
    });
  });

  paginatedTeamsForAdmin = computed(() => {
    const teams = this.filteredTeams();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return teams.slice(start, start + this.itemsPerPage);
  });
  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredTeams().length / this.itemsPerPage)),
  );
  pagesArray = computed(() => getVisiblePages(this.totalPages(), this.currentPage()));
  paginationInfoText = computed(() => {
    const total = this.filteredTeams().length;
    if (total === 0) return 'No hay registros';
    const start = (this.currentPage() - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage, total);
    return `Mostrando ${start} - ${end} de ${total} registros`;
  });
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) this.currentPage.set(page);
  }

  // ================= CAMPEONATOS (Ordenados alfabéticamente) =================
  filteredChampionships = computed(() => {
    const champs = [...this.championshipService.championships()].sort((a, b) =>
      (a.name || '').localeCompare(b.name || ''),
    );
    const search = this.championshipSearchText().toLowerCase().trim();
    const country = this.selectedChampionshipCountry();
    const type = this.selectedChampionshipType();

    return champs.filter((c) => {
      const champName = (c.name || '').toLowerCase();
      const champCountry = c.country || '';
      const champType = c.type || '';

      const matchesSearch = !search || champName.includes(search);
      const matchesCountry = country === 'ALL' || champCountry === country;
      const matchesType = type === 'ALL' || champType === type;

      return matchesSearch && matchesCountry && matchesType;
    });
  });

  paginatedChampionshipsForAdmin = computed(() => {
    const champs = this.filteredChampionships();
    const start = (this.currentChampPage() - 1) * this.itemsPerPageChamps;
    return champs.slice(start, start + this.itemsPerPageChamps);
  });
  totalChampPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredChampionships().length / this.itemsPerPageChamps)),
  );
  champPagesArray = computed(() =>
    getVisiblePages(this.totalChampPages(), this.currentChampPage()),
  );
  champPaginationInfoText = computed(() => {
    const total = this.filteredChampionships().length;
    if (total === 0) return 'No hay registros';
    const start = (this.currentChampPage() - 1) * this.itemsPerPageChamps + 1;
    const end = Math.min(this.currentChampPage() * this.itemsPerPageChamps, total);
    return `Mostrando ${start} - ${end} de ${total} registros`;
  });
  changeChampPage(page: number): void {
    if (page >= 1 && page <= this.totalChampPages()) this.currentChampPage.set(page);
  }

  // ================= PARTIDOS =================
  filteredMatches = computed(() => {
    const matches = this.matchService.matches();
    const search = this.matchSearchText().toLowerCase().trim();
    const status = this.selectedMatchStatus();

    return matches.filter((m) => {
      const localName = this.getTeamName(m.localTeamID).toLowerCase();
      const awayName = this.getTeamName(m.awayTeamID).toLowerCase();
      const matchesSearch = !search || localName.includes(search) || awayName.includes(search);
      const matchesStatus = status === 'ALL' || (m.status || 'Programado') === status;
      return matchesSearch && matchesStatus;
    });
  });

  paginatedMatchesForAdmin = computed(() => {
    const matches = this.filteredMatches();
    const start = (this.currentMatchPage() - 1) * this.itemsPerPageMatches;
    return matches.slice(start, start + this.itemsPerPageMatches);
  });

  totalMatchPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredMatches().length / this.itemsPerPageMatches)),
  );

  matchPagesArray = computed(() =>
    getVisiblePages(this.totalMatchPages(), this.currentMatchPage()),
  );

  matchPaginationInfoText = computed(() => {
    const total = this.filteredMatches().length;
    if (total === 0) return 'No hay registros';
    const start = (this.currentMatchPage() - 1) * this.itemsPerPageMatches + 1;
    const end = Math.min(this.currentMatchPage() * this.itemsPerPageMatches, total);
    return `Mostrando ${start} - ${end} de ${total} registros`;
  });

  changeMatchPage(page: number): void {
    if (page >= 1 && page <= this.totalMatchPages()) this.currentMatchPage.set(page);
  }

  // ================= JUGADORES (Ordenados alfabéticamente) =================
  filteredPlayers = computed(() => {
    const players = this.playerService.sortedPlayers();
    const search = this.playerSearchText().toLowerCase().trim();
    const pos = this.selectedPlayerPosition();
    const nat = this.selectedPlayerNationality();

    return players.filter((p) => {
      const playerName = (p.name || '').toLowerCase();
      const matchesSearch = !search || playerName.includes(search);
      const matchesPos = pos === 'ALL' || p.position === pos;
      const matchesNationality = nat === 'ALL' || p.nationality === nat;
      return matchesSearch && matchesPos && matchesNationality;
    });
  });
  paginatedPlayersForAdmin = computed(() => {
    const players = this.filteredPlayers();
    const start = (this.currentPlayerPage() - 1) * this.itemsPerPagePlayers;
    return players.slice(start, start + this.itemsPerPagePlayers);
  });
  totalPlayerPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredPlayers().length / this.itemsPerPagePlayers)),
  );
  playerPagesArray = computed(() =>
    getVisiblePages(this.totalPlayerPages(), this.currentPlayerPage()),
  );
  playerPaginationInfoText = computed(() => {
    const total = this.filteredPlayers().length;
    if (total === 0) return 'No hay registros';
    const start = (this.currentPlayerPage() - 1) * this.itemsPerPagePlayers + 1;
    const end = Math.min(this.currentPlayerPage() * this.itemsPerPagePlayers, total);
    return `Mostrando ${start} - ${end} de ${total} registros`;
  });
  changePlayerPage(page: number): void {
    if (page >= 1 && page <= this.totalPlayerPages()) this.currentPlayerPage.set(page);
  }

  // ================= USUARIOS (Ordenados alfabéticamente por username) =================
  filteredUsers = computed(() => {
    const users = this.allUsersForAdmin();
    const search = this.userSearchText().toLowerCase().trim();
    const role = this.selectedUserRole();

    return users.filter((u) => {
      const username = (u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const matchesSearch = !search || username.includes(search) || email.includes(search);
      const matchesRole = role === 'ALL' || u.role === role;
      return matchesSearch && matchesRole;
    });
  });
  paginatedUsersForAdmin = computed(() => {
    const users = this.filteredUsers();
    const start = (this.currentUserPage() - 1) * this.itemsPerPageUsers;
    return users.slice(start, start + this.itemsPerPageUsers);
  });
  totalUserPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredUsers().length / this.itemsPerPageUsers)),
  );
  userPagesArray = computed(() => getVisiblePages(this.totalUserPages(), this.currentUserPage()));
  userPaginationInfoText = computed(() => {
    const total = this.filteredUsers().length;
    if (total === 0) return 'No hay registros';
    const start = (this.currentUserPage() - 1) * this.itemsPerPageUsers + 1;
    const end = Math.min(this.currentUserPage() * this.itemsPerPageUsers, total);
    return `Mostrando ${start} - ${end} de ${total} registros`;
  });
  changeUserPage(page: number): void {
    if (page >= 1 && page <= this.totalUserPages()) this.currentUserPage.set(page);
  }

  // ================= ELIMINACIONES =================
  confirmDelete(id: number): void {
    this.teamToDeleteId.set(id);
  }
  cancelDelete(): void {
    this.teamToDeleteId.set(null);
  }
  executeDelete(): void {
    const id = this.teamToDeleteId();
    if (id !== null) this.teamService.deleteTeam(id);
    this.teamToDeleteId.set(null);
  }

  confirmDeleteChampionship(id: number | string): void {
    this.championshipToDeleteId.set(id);
  }
  cancelDeleteChampionship(): void {
    this.championshipToDeleteId.set(null);
  }
  executeDeleteChampionship(): void {
    const id = this.championshipToDeleteId();
    if (id !== null) this.championshipService.deleteChampionship(Number(id));
    this.championshipToDeleteId.set(null);
  }

  confirmDeleteMatch(id: number): void {
    this.matchToDeleteId.set(id);
  }
  cancelDeleteMatch(): void {
    this.matchToDeleteId.set(null);
  }
  executeDeleteMatch(): void {
    const id = this.matchToDeleteId();
    if (id !== null && this.matchService.delete) {
      this.matchService.delete(id).subscribe({
        next: () => {
          this.loadAdminData();
          this.matchToDeleteId.set(null);
        },
        error: (err: any) => {
          console.error('Error al eliminar partido:', err);
          this.matchToDeleteId.set(null);
        },
      });
    }
  }

  confirmDeletePlayer(id: number): void {
    this.playerToDeleteId.set(id);
  }
  cancelDeletePlayer(): void {
    this.playerToDeleteId.set(null);
  }
  executeDeletePlayer(): void {
    const id = this.playerToDeleteId();
    if (id !== null) this.playerService.deletePlayer(id);
    this.playerToDeleteId.set(null);
  }

  confirmDeleteUser(id: number): void {
    this.userToDeleteId.set(id);
  }
  cancelDeleteUser(): void {
    this.userToDeleteId.set(null);
  }
  executeDeleteUser(): void {
    const id = this.userToDeleteId();
    if (id !== null && this.authService.deleteUser) {
      this.authService.deleteUser(id).subscribe({
        next: () => {
          this.loadAdminData();
          this.userToDeleteId.set(null);
        },
        error: (err: any) => {
          console.error('Error al eliminar usuario:', err);
          this.userToDeleteId.set(null);
        },
      });
    } else {
      this.userToDeleteId.set(null);
    }
  }

  convertToNumber(value: any): number {
    return Number(value);
  }

  selectChampionshipToEdit(id: number | string): void {
    this.editingChampionshipId.set(Number(id));
  }

  cancelChampionshipEdit(): void {
    this.editingChampionshipId.set(null);
  }
}
