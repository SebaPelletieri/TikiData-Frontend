import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TeamService } from '../../services/team-service';
import { PlayerService } from '../../services/player-service';
import { Player } from '../../models/Player';
import { Team } from '../../models/Team';

export interface PlayerItem {
  id: number;
  name: string;
  position: string;
  number?: number;
}

interface StadiumOption {
  id: number;
  name: string;
}

const STADIUMS_URL = 'http://localhost:3000/estadios';

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
  private http = inject(HttpClient);
  private teamService = inject(TeamService);
  private playerService = inject(PlayerService);

  teamId: number | string | null = null;
  private originalTeam: Team | null = null;

  isLoading = true;
  loadError: string | null = null;
  errorMessage: string | null = null;

  teamForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    country: ['', [Validators.required]],
    shield: ['', [Validators.required]],
  });

  // --- Países ---
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
  isCountryOpen = false;

  positions = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero'];
  isPositionOpen = false;

  stadiums: StadiumOption[] = [];
  stadiumSearchCtrl = new FormControl('');
  selectedStadiumId: number | null = null;
  isStadiumDropdownOpen = false;
  filteredStadiums: StadiumOption[] = [];
  stadiumError = false;

  playersList: PlayerItem[] = [];
  allSystemPlayers: Player[] = [];
  filteredPlayers: PlayerItem[] = [];
  playerSearchCtrl = new FormControl('');
  selectedPositionCtrl = new FormControl('Mediocampista');
  playerNumberCtrl = new FormControl<number | null>(null);

  ngOnInit(): void {
    this.setupSearchFilters();

    this.route.paramMap.subscribe((params) => {
      const raw = params.get('id');
      if (!raw) return;
      this.teamId = raw !== '' && !isNaN(Number(raw)) ? Number(raw) : raw;
      this.loadAll(this.teamId);
    });
  }

  private loadAll(id: number | string) {
    this.isLoading = true;
    this.loadError = null;

    forkJoin({
      team: this.teamService.getById(id as any),
      stadiums: this.http.get<StadiumOption[]>(STADIUMS_URL),
      players: this.playerService.getAllPlayers(),
    }).subscribe({
      next: ({ team, stadiums, players }) => {
        this.originalTeam = team;
        this.stadiums = stadiums;
        this.allSystemPlayers = players;

        this.teamForm.patchValue({
          name: team.name,
          country: team.country,
          shield: team.shield,
        });

        const stadium = stadiums.find((s) => String(s.id) === String(team.stadiumID));
        this.selectedStadiumId = stadium ? stadium.id : null;
        this.stadiumSearchCtrl.setValue(stadium?.name ?? '', { emitEvent: false });

        const ids = (team.playerIDs ?? []).map(String);
        this.playersList = players
          .filter((p) => p.id !== undefined && ids.includes(String(p.id)))
          .map((p) => this.toPlayerItem(p, team));

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar los datos del equipo:', err);
        this.loadError = 'No se pudieron cargar los datos del equipo.';
        this.isLoading = false;
      },
    });
  }

  private toPlayerItem(p: Player, team?: Team): PlayerItem {
    const teamKey = team?.id ?? this.teamId;
    return {
      id: p.id as number,
      name: p.name,
      position: p.position,
      number: teamKey !== null && teamKey !== undefined ? p.dorsals?.[Number(teamKey)] : undefined,
    };
  }

  private setupSearchFilters() {
    this.stadiumSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      this.selectedStadiumId = null;
      this.stadiumError = false;
      this.filteredStadiums = q
        ? this.stadiums.filter((s) => s.name.toLowerCase().includes(q))
        : [];
      this.isStadiumDropdownOpen = this.filteredStadiums.length > 0;
    });

    this.playerSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      this.filteredPlayers = !q
        ? []
        : this.allSystemPlayers
            .filter(
              (p) =>
                p.id !== undefined &&
                p.name.toLowerCase().includes(q) &&
                !this.playersList.some((x) => String(x.id) === String(p.id)),
            )
            .map((p) => this.toPlayerItem(p));
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

  togglePositionDropdown() {
    this.isPositionOpen = !this.isPositionOpen;
    this.isCountryOpen = false;
    this.isStadiumDropdownOpen = false;
  }

  selectPosition(pos: string) {
    this.selectedPositionCtrl.setValue(pos);
    this.isPositionOpen = false;
  }

  selectStadium(stadium: StadiumOption) {
    this.stadiumSearchCtrl.setValue(stadium.name, { emitEvent: false });
    this.selectedStadiumId = stadium.id;
    this.stadiumError = false;
    this.isStadiumDropdownOpen = false;
  }

  addPlayer(playerObj?: PlayerItem) {
    let toAdd = playerObj;

    if (!toAdd) {
      const name = (this.playerSearchCtrl.value || '').trim().toLowerCase();
      const found = this.allSystemPlayers.find((p) => p.name.toLowerCase() === name);
      if (!found) {
        this.errorMessage = 'Ese jugador no existe en el sistema. Elígelo de la lista de sugerencias.';
        return;
      }
      toAdd = this.toPlayerItem(found);
    }

    if (this.playersList.some((p) => String(p.id) === String(toAdd!.id))) return;

    this.errorMessage = null;
    this.playersList.push(toAdd);
    this.playerSearchCtrl.setValue('', { emitEvent: false });
    this.playerNumberCtrl.setValue(null);
    this.filteredPlayers = [];
  }

  removePlayer(index: number) {
    this.playersList.splice(index, 1);
  }

  onSubmit() {
    if (this.teamForm.invalid || this.teamId === null || !this.originalTeam) {
      this.teamForm.markAllAsTouched();
      return;
    }

    if (this.selectedStadiumId === null) {
      const typed = (this.stadiumSearchCtrl.value || '').trim().toLowerCase();
      const match = this.stadiums.find((s) => s.name.toLowerCase() === typed);
      this.selectedStadiumId = match ? match.id : null;
    }
    if (this.selectedStadiumId === null) {
      this.stadiumError = true;
      return;
    }

    const updatedTeam: Team = {
      ...this.originalTeam,
      ...this.teamForm.getRawValue(),
      stadiumID: this.selectedStadiumId,
      playerIDs: this.playersList.map((p) => p.id),
    };

    this.teamService.updateTeam(this.teamId as any, updatedTeam).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: (err: any) => {
        console.error('Error al actualizar:', err);
        this.errorMessage = 'No se pudieron guardar los cambios.';
      },
    });
  }

  onCancel() {
    this.router.navigate(['/admin']);
  }
}