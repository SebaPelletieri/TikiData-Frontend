import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { TeamService } from '../../services/team-service';
import { ChampionshipService } from '../../services/championship-service';
import { PlayerService } from '../../services/player-service';
import { TeamForm } from '../team-form/team-form';
import { ChampionshipForm } from '../../components/championship-form/championship-form';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TeamForm, ChampionshipForm],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private authService = inject(AuthService);
  private teamService = inject(TeamService);
  private championshipService = inject(ChampionshipService);
  private playerService = inject(PlayerService);

  currentUser = this.authService.currentUser();
  successMessage = '';
  errorMessage = '';

  // Datos generales del sistema y listas auxiliares
  allUsersForAdmin = signal<any[]>([]);

  // ==========================================
  // ESTADÍSTICAS GLOBALES CONECTADAS A LOS SERVICIOS
  // ==========================================
  totalTeamsCount = computed(() => this.teamService.teams().length);
  totalUsersCount = computed(() => this.allUsersForAdmin().length);
  totalPlayersCount = computed(() => this.playerService.players().length);
  totalChampionshipsCount = computed(() => this.championshipService.championships().length);

  // Estados de búsqueda y filtros de equipos
  adminSearchText = signal('');
  selectedAdminCountry = signal('ALL');
  selectedAdminChampionship = signal('ALL');

  currentPage = signal(1);
  itemsPerPage = 6; // 👈 Configurado en 6 registros por página

  isCountryDropdownOpen = false;
  isChampionshipDropdownOpen = false;

  selectedCountryLabel = 'Todos los países';
  selectedChampionshipLabel = 'Todos los campeonatos';

  teamToDeleteId = signal<number | null>(null);

  // ==========================================
  // ESTADOS Y FILTROS PARA CAMPEONATOS
  // ==========================================
  championshipSearchText = signal('');
  selectedChampionshipCountry = signal('ALL');
  selectedChampionshipType = signal('ALL');

  currentChampPage = signal(1);
  itemsPerPageChamps = 6; // 👈 Configurado en 6 registros por página

  isChampCountryDropdownOpen = false;
  isChampTypeDropdownOpen = false;

  selectedChampCountryLabel = 'Todos los países';
  selectedChampTypeLabel = 'Todos los tipos';

  championshipToDeleteId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadAdminData();
  }

  loadAdminData(): void {
    // 1. Cargar equipos desde el servicio
    this.teamService.getAll();

    // 2. Cargar campeonatos desde el servicio
    this.championshipService.getAll();

    // 3. Cargar jugadores
    this.playerService.getAll();

    // 4. Cargar usuarios del sistema
    if (this.authService.getAllUsers) {
      this.authService.getAllUsers().subscribe({
        next: (users: any[]) => this.allUsersForAdmin.set(users),
        error: (err: any) => console.error('Error al cargar usuarios:', err),
      });
    }
  }

  // Opciones reactivas para los dropdowns de Equipos
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

  // Opciones reactivas para los dropdowns de Campeonatos
  champCountryOptions = computed(() => [
    { value: 'ALL', label: 'Todos los países' },
    { value: 'Argentina', label: 'Argentina' },
    { value: 'Internacional', label: 'Internacional' },
  ]);

  champTypeOptions = computed(() => [
    { value: 'ALL', label: 'Todos los tipos' },
    { value: 'Liga', label: 'Liga' },
    { value: 'Copa', label: 'Copa' },
  ]);

  // Manejo de dropdowns de Equipos
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

  // Manejo de dropdowns de Campeonatos
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

  // Paginación y filtrado de equipos
  filteredTeams = computed(() => {
    return this.teamService.teams();
  });

  paginatedTeamsForAdmin = computed(() => {
    const teams = this.filteredTeams();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return teams.slice(start, start + this.itemsPerPage);
  });

  totalPages = computed(() => {
    const total = this.filteredTeams().length;
    return Math.max(1, Math.ceil(total / this.itemsPerPage));
  });

  pagesArray = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  paginationInfoText = computed(() => {
    const total = this.filteredTeams().length;
    if (total === 0) return 'No hay registros';
    const start = (this.currentPage() - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage, total);
    return `Mostrando ${start} - ${end} de ${total} registros`;
  });

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  // Paginación y filtrado de campeonatos
  filteredChampionships = computed(() => {
    return this.championshipService.championships();
  });

  paginatedChampionshipsForAdmin = computed(() => {
    const champs = this.filteredChampionships();
    const start = (this.currentChampPage() - 1) * this.itemsPerPageChamps;
    return champs.slice(start, start + this.itemsPerPageChamps);
  });

  totalChampPages = computed(() => {
    const total = this.filteredChampionships().length;
    return Math.max(1, Math.ceil(total / this.itemsPerPageChamps));
  });

  champPagesArray = computed(() => {
    return Array.from({ length: this.totalChampPages() }, (_, i) => i + 1);
  });

  champPaginationInfoText = computed(() => {
    const total = this.filteredChampionships().length;
    if (total === 0) return 'No hay registros';
    const start = (this.currentChampPage() - 1) * this.itemsPerPageChamps + 1;
    const end = Math.min(this.currentChampPage() * this.itemsPerPageChamps, total);
    return `Mostrando ${start} - ${end} de ${total} registros`;
  });

  changeChampPage(page: number): void {
    if (page >= 1 && page <= this.totalChampPages()) {
      this.currentChampPage.set(page);
    }
  }

  // Lógica de eliminación de Equipos
  confirmDelete(id: number): void {
    this.teamToDeleteId.set(id);
  }

  cancelDelete(): void {
    this.teamToDeleteId.set(null);
  }

  executeDelete(): void {
    const id = this.teamToDeleteId();
    if (id !== null) {
      this.teamService.deleteTeam(id);
    }
    this.teamToDeleteId.set(null);
  }

  // Lógica de eliminación de Campeonatos
  confirmDeleteChampionship(id: number): void {
    this.championshipToDeleteId.set(id);
  }

  cancelDeleteChampionship(): void {
    this.championshipToDeleteId.set(null);
  }

  executeDeleteChampionship(): void {
    const id = this.championshipToDeleteId();
    if (id !== null) {
      this.championshipService.deleteChampionship(id);
    }
    this.championshipToDeleteId.set(null);
  }
}
