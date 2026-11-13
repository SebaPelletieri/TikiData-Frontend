import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService } from '../../services/team-service';
import { PlayerService } from '../../services/player-service'; // 👈 Importamos el PlayerService
import { Player } from '../../models/Player';

export interface PlayerItem {
  id?: number;
  name: string;
  position: string;
  number?: number;
}

@Component({
  selector: 'app-team-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './team-edit.html',
  styleUrl: './team-edit.css',
})
export class TeamEdit implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private teamService = inject(TeamService);
  private playerService = inject(PlayerService); // 👈 Inyectamos PlayerService

  teamForm!: FormGroup;
  teamId: number | null = null;

  // 1. Lista amplia de países del mundo
  countries = [
    'Argentina',
    'Brasil',
    'Uruguay',
    'Chile',
    'Colombia',
    'Perú',
    'Bolivia',
    'Paraguay',
    'Ecuador',
    'Venezuela',
    'México',
    'Estados Unidos',
    'España',
    'Francia',
    'Italia',
    'Alemania',
    'Inglaterra',
    'Portugal',
    'Países Bajos',
  ].sort();
  filteredCountries: string[] = [...this.countries];

  positions = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero'];

  isCountryOpen = false;
  isPositionOpen = false;

  // 2. Control para el autocompletado del Estadio
  stadiumSearchCtrl = new FormControl('');
  isStadiumDropdownOpen = false;
  // Puedes alimentar esto con estadios conocidos o dejar sugerencias dinámicas
  stadiumsList = [
    'Maracaná',
    'La Bombonera',
    'Monumental de Núñez',
    'Estadio Nacional del Perú',
    'Centenario',
    'Metropolitano de Barranquilla',
    'Atanasio Girardot',
    'Santiago Bernabéu',
    'Camp Nou',
    'Wembley',
    'Alberto J. Armando',
    'El Cilindro',
    'Libertadores de América',
  ];
  filteredStadiums: string[] = [];

  playersList: PlayerItem[] = [];

  // Controles para jugadores
  playerSearchCtrl = new FormControl('');
  selectedPositionCtrl = new FormControl('Mediocampista');
  playerNumberCtrl = new FormControl<number | null>(null);

  // 3. Lista general de jugadores de la BD para el buscador
  allSystemPlayers: Player[] = [];
  filteredPlayers: PlayerItem[] = [];

  ngOnInit(): void {
    this.initForm();

    // Cargamos todos los jugadores del sistema para que el buscador encuentre resultados reales
    this.playerService.getAllPlayers().subscribe({
      next: (players) => {
        this.allSystemPlayers = players;
      },
    });

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.teamId = Number(idParam);
        this.loadTeamData(this.teamId);
      }
    });

    // Filtro reactivo para el buscador de Países
    // (Opcional si quieres que el usuario escriba para filtrar el desplegable de países)

    // Filtro reactivo para el Estadio
    this.stadiumSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      if (!q) {
        this.filteredStadiums = [];
        this.isStadiumDropdownOpen = false;
      } else {
        this.filteredStadiums = this.stadiumsList.filter((s) => s.toLowerCase().includes(q));
        this.isStadiumDropdownOpen = this.filteredStadiums.length > 0;
      }
    });

    // Filtro reactivo de jugadores (¡Ahora busca en todos los jugadores de la BD!)
    this.playerSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      if (!q) {
        this.filteredPlayers = [];
      } else {
        this.filteredPlayers = this.allSystemPlayers
          .filter(
            (p) =>
              p.name.toLowerCase().includes(q) &&
              !this.playersList.some(
                (existing) => existing.name.toLowerCase() === p.name.toLowerCase(),
              ),
          )
          .map((p) => ({
            id: p.id,
            name: p.name,
            position: p.position || 'Mediocampista',
          }));
      }
    });
  }

  initForm() {
    this.teamForm = this.fb.group({
      name: ['', [Validators.required]],
      country: ['', [Validators.required]],
      shield: ['', [Validators.required]],
      stadium: [''],
    });
  }

  loadTeamData(id: number) {
    this.teamService.getById(id).subscribe({
      next: (team: any) => {
        if (team) {
          this.teamForm.patchValue({
            name: team.name,
            country: team.country,
            shield: team.shield || team.shieldUrl,
            stadium: team.stadium,
          });
          this.stadiumSearchCtrl.setValue(team.stadium || '');
          if (team.players && Array.isArray(team.players)) {
            this.playersList = [...team.players];
          }
        }
      },
      error: (err) => console.error('Error al cargar equipo:', err),
    });
  }

  toggleCountryDropdown() {
    this.isCountryOpen = !this.isCountryOpen;
    this.isPositionOpen = false;
    this.isStadiumDropdownOpen = false;
  }

  selectCountry(countryName: string) {
    this.teamForm.get('country')?.setValue(countryName);
    this.isCountryOpen = false;
  }

  selectStadium(stadiumName: string) {
    this.stadiumSearchCtrl.setValue(stadiumName);
    this.teamForm.get('stadium')?.setValue(stadiumName);
    this.isStadiumDropdownOpen = false;
  }

  togglePositionDropdown() {
    this.isPositionOpen = !this.isPositionOpen;
    this.isCountryOpen = false;
    this.isStadiumDropdownOpen = false;
  }

  selectPosition(pos: string) {
    this.selectedPositionCtrl.setValue(pos);
    this.isPositionOpen = false;
  }

  addPlayer(playerObj?: PlayerItem) {
    const name = playerObj ? playerObj.name : this.playerSearchCtrl.value?.trim();
    if (!name) return;

    const newPlayer: PlayerItem = {
      id: playerObj?.id,
      name: name,
      position: playerObj ? playerObj.position : this.selectedPositionCtrl.value || 'Mediocampista',
      number: playerObj ? playerObj.number : this.playerNumberCtrl.value || undefined,
    };

    this.playersList.push(newPlayer);
    this.playerSearchCtrl.setValue('');
    this.playerNumberCtrl.setValue(null);
    this.filteredPlayers = [];
  }

  removePlayer(index: number) {
    this.playersList.splice(index, 1);
  }

  onSubmit() {
    // Sincronizamos el valor del estadio del input de búsqueda con el form group
    this.teamForm.get('stadium')?.setValue(this.stadiumSearchCtrl.value);

    if (this.teamForm.valid && this.teamId !== null) {
      const updatedTeam = {
        ...this.teamForm.value,
        players: this.playersList,
      };

      this.teamService.updateTeam(this.teamId, updatedTeam).subscribe({
        next: () => {
          this.router.navigate(['/admin']);
        },
        error: (err: any) => console.error('Error al actualizar:', err),
      });
    } else {
      this.teamForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/admin']);
  }
}
