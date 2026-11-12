import { Component, OnInit, Output, EventEmitter, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService } from '../../services/team-service';
import { Team } from '../../models/Team';
import { ChampionshipService } from '../../services/championship-service';
import { Championship, ChampionshipType } from '../../models/Championship';

@Component({
  selector: 'app-championship-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './championship-edit.html',
  styleUrls: ['./championship-edit.css'],
})
export class ChampionshipEdit implements OnInit {
  private championshipService = inject(ChampionshipService);
  public teamService = inject(TeamService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @Output() closePanel = new EventEmitter<void>();

  championshipIdInput = input<string | number>();

  isEditing = false;
  errorMessage = '';
  showDeleteModal = false;

  championshipData: Championship = {
    name: '',
    season: '',
    type: '' as ChampionshipType,
    logo: '',
    teamsIDs: [],
    country: '',
  };

  // --- BÚSQUEDA Y SELECCIÓN DE EQUIPOS PARTICIPANTES ---
  teamSearchQuery = '';
  showTeamDropdown = false;
  filteredTeams = signal<Team[]>([]);
  selectedTeamsList = signal<Team[]>([]);

  // Control del desplegable de tipo (LIGA o COPA)
  isTypeDropdownOpen = false;
  typesList: ChampionshipType[] = ['LIGA', 'COPA'];

  ngOnInit(): void {
    // Cargar la lista completa de equipos usando el servicio
    this.teamService.getAll();

    const idFromRoute = this.route.snapshot.paramMap.get('id') || this.championshipIdInput();

    if (idFromRoute) {
      this.isEditing = true;
      const numericId = Number(idFromRoute);

      this.championshipService.getByID(numericId).subscribe({
        next: (champ) => {
          if (champ) {
            this.championshipData = { ...champ };
            // Mapeamos los IDs de los equipos del campeonato con los equipos cargados
            if (champ.teamsIDs && this.teamService.teams().length > 0) {
              const matchedTeams = this.teamService
                .teams()
                .filter((t) => t.id !== undefined && champ.teamsIDs?.includes(t.id));
              this.selectedTeamsList.set(matchedTeams);
            }
          }
        },
        error: (err) => console.error('Error al cargar campeonato:', err),
      });
    }
  }

  // --- MÉTODOS DE TIPO (LIGA / COPA) ---
  toggleTypeDropdown() {
    this.isTypeDropdownOpen = !this.isTypeDropdownOpen;
  }

  selectType(type: ChampionshipType) {
    this.championshipData.type = type;
    this.isTypeDropdownOpen = false;
  }

  // --- GESTIÓN DE EQUIPOS PARTICIPANTES ---
  onSearchTeams() {
    const query = this.teamSearchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredTeams.set([]);
      this.showTeamDropdown = false;
      return;
    }
    const currentSelectedIds = this.selectedTeamsList().map((t) => t.id);
    const matches = this.teamService
      .teams()
      .filter(
        (t) =>
          t.name.toLowerCase().includes(query) &&
          t.id !== undefined &&
          !currentSelectedIds.includes(t.id),
      );
    this.filteredTeams.set(matches);
    this.showTeamDropdown = matches.length > 0;
  }

  addTeam(team: Team) {
    this.selectedTeamsList.update((list) => [...list, team]);
    this.teamSearchQuery = '';
    this.showTeamDropdown = false;
    this.championshipData.teamsIDs = this.selectedTeamsList().map((t) => t.id!);
  }

  removeTeam(teamId: number) {
    this.selectedTeamsList.update((list) => list.filter((t) => t.id !== teamId));
    this.championshipData.teamsIDs = this.selectedTeamsList().map((t) => t.id!);
  }

  // --- PREVISIÓN Y CARGA DE LOGO ---
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = 'El archivo supera el tamaño máximo de 2MB.';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.championshipData.logo = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // --- VALIDACIÓN DE TEMPORADA (4 NÚMEROS) ---
  onSeasonInput(event: any) {
    const numericValue = event.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    this.championshipData.season = numericValue;
  }

  // --- ACCIONES DE GUARDADO Y ELIMINACIÓN ---
  saveChampionship(): void {
    if (
      !this.championshipData.name ||
      !this.championshipData.season ||
      !this.championshipData.type
    ) {
      this.errorMessage =
        'Por favor completa los campos obligatorios (Nombre, Temporada y Formato).';
      return;
    }

    if (this.championshipData.season.length !== 4) {
      this.errorMessage = 'La temporada debe contener exactamente 4 números (ej. 2026).';
      return;
    }

    this.championshipData.teamsIDs = this.selectedTeamsList().map((t) => t.id!);

    if (this.isEditing && this.championshipData.id) {
      this.championshipService.updateChampionship(
        Number(this.championshipData.id),
        this.championshipData,
      );
      this.handleSuccess();
    } else {
      this.championshipService.saveChampionship(this.championshipData);
      this.handleSuccess();
    }
  }

  confirmDelete(): void {
    if (this.championshipData.id) {
      this.championshipService.deleteChampionship(Number(this.championshipData.id));
      this.handleSuccess();
    }
  }

  handleSuccess(): void {
    this.closePanel.emit();
    if (this.isEditing && this.route.snapshot.paramMap.get('id')) {
      this.router.navigate(['/admin']);
    }
  }

  onCancel(): void {
    this.closePanel.emit();
    if (this.isEditing && this.route.snapshot.paramMap.get('id')) {
      this.router.navigate(['/admin']);
    }
  }
}
