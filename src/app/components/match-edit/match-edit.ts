import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchService } from '../../services/match-service';
import { TeamService } from '../../services/team-service';
import { ChampionshipService } from '../../services/championship-service';
import { Team } from '../../models/Team';
import { Championship } from '../../models/Championship';

@Component({
  selector: 'app-match-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './match-edit.html',
  styleUrl: './match-edit.css',
})
export class MatchEdit implements OnInit {
  @Input() matchIdInput!: number | string;
  @Output() closePanel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private matchService = inject(MatchService);
  private teamService = inject(TeamService);
  private championshipService = inject(ChampionshipService);

  matchForm!: FormGroup;
  matchId: number | null = null;

  allTeams: Team[] = [];
  allChampionships: Championship[] = [];
  allStadiums: string[] = [
    'Estadio Monumental',
    'La Bombonera',
    'Estadio Libertadores de América',
    'Estadio Cilindro de Avellaneda',
    'Estadio Único Diego Armando Maradona',
    'Estadio Mario Alberto Kempes',
    'Estadio José Amalfitani',
    'Estadio Monumental de Victoria',
  ]; // Puedes expandir o cargar esto dinámicamente si prefieres

  // Buscador de Campeonato
  championshipSearchCtrl = new FormControl('');
  filteredChampionships: Championship[] = [];
  isChampDropdownOpen = false;
  selectedChampionshipName = '';

  // Buscador de Equipo Local
  localSearchCtrl = new FormControl('');
  filteredLocalTeams: Team[] = [];
  isLocalDropdownOpen = false;
  selectedLocalTeamName = '';

  // Buscador de Equipo Visitante
  visitorSearchCtrl = new FormControl('');
  filteredVisitorTeams: Team[] = [];
  isVisitorDropdownOpen = false;
  selectedVisitorTeamName = '';

  // Buscador de Estadio
  stadiumSearchCtrl = new FormControl('');
  filteredStadiums: string[] = [];
  isStadiumDropdownOpen = false;

  // 1. Opciones de Estado del Partido limitadas exactamente a 3
  statuses = ['Programado', 'En vivo', 'Finalizado'];
  isStatusOpen = false;

  ngOnInit(): void {
    this.initForm();

    this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.allTeams = teams;
      },
    });

    this.championshipService.getAllChampionships().subscribe({
      next: (champs) => {
        this.allChampionships = champs;
      },
    });

    if (this.matchIdInput) {
      this.matchId = Number(this.matchIdInput);
      this.loadMatchData(this.matchId);
    } else {
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        if (id) {
          this.matchId = Number(id);
          this.loadMatchData(this.matchId);
        }
      });
    }

    // Filtro reactivo para Campeonatos
    this.championshipSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      if (!q) {
        this.filteredChampionships = [];
        this.isChampDropdownOpen = false;
      } else {
        this.filteredChampionships = this.allChampionships.filter((c) =>
          c.name.toLowerCase().includes(q),
        );
        this.isChampDropdownOpen = this.filteredChampionships.length > 0;
      }
    });

    // Filtro reactivo para Local
    this.localSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      if (!q) {
        this.filteredLocalTeams = [];
        this.isLocalDropdownOpen = false;
      } else {
        this.filteredLocalTeams = this.allTeams.filter((t) => t.name.toLowerCase().includes(q));
        this.isLocalDropdownOpen = this.filteredLocalTeams.length > 0;
      }
    });

    // Filtro reactivo para Visitante
    this.visitorSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      if (!q) {
        this.filteredVisitorTeams = [];
        this.isVisitorDropdownOpen = false;
      } else {
        this.filteredVisitorTeams = this.allTeams.filter((t) => t.name.toLowerCase().includes(q));
        this.isVisitorDropdownOpen = this.filteredVisitorTeams.length > 0;
      }
    });

    // 2. Filtro reactivo para el Buscador de Estadio
    this.stadiumSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      this.matchForm.get('stadium')?.setValue(query); // Sincroniza el valor con el form group
      if (!q) {
        this.filteredStadiums = [];
        this.isStadiumDropdownOpen = false;
      } else {
        this.filteredStadiums = this.allStadiums.filter((s) => s.toLowerCase().includes(q));
        this.isStadiumDropdownOpen = true; // Muestra sugerencias o permite dejar el texto escrito
      }
    });
  }

  initForm() {
    this.matchForm = this.fb.group({
      championshipId: [null, Validators.required],
      matchDate: ['', Validators.required],
      homeTeamId: [null, Validators.required],
      awayTeamId: [null, Validators.required],
      stadium: [''],
      status: ['Programado', Validators.required],
      homeGoals: [0],
      awayGoals: [0],
    });
  }

  loadMatchData(id: number) {
    this.matchService.getById(id).subscribe({
      next: (match: any) => {
        if (match) {
          this.matchForm.patchValue({
            championshipId: match.championshipId || match.campeonatoId,
            matchDate: match.matchDate || match.fecha,
            homeTeamId: match.homeTeamId || match.equipoLocalId,
            awayTeamId: match.awayTeamId || match.equipoVisitanteId,
            stadium: match.stadium || match.estadio,
            status: match.status || match.estado || 'Programado',
            homeGoals: match.homeGoals ?? match.golesLocal ?? 0,
            awayGoals: match.awayGoals ?? match.golesVisitante ?? 0,
          });

          if (match.championshipName) {
            this.selectedChampionshipName = match.championshipName;
            this.championshipSearchCtrl.setValue(match.championshipName, { emitEvent: false });
          }
          if (match.homeTeamName) {
            this.selectedLocalTeamName = match.homeTeamName;
            this.localSearchCtrl.setValue(match.homeTeamName, { emitEvent: false });
          }
          if (match.awayTeamName) {
            this.selectedVisitorTeamName = match.awayTeamName;
            this.visitorSearchCtrl.setValue(match.awayTeamName, { emitEvent: false });
          }
          if (match.stadium || match.estadio) {
            const stad = match.stadium || match.estadio;
            this.stadiumSearchCtrl.setValue(stad, { emitEvent: false });
          }
        }
      },
      error: (err) => console.error('Error al cargar partido:', err),
    });
  }

  selectChampionship(champ: Championship) {
    this.matchForm.get('championshipId')?.setValue(champ.id);
    this.selectedChampionshipName = champ.name;
    this.championshipSearchCtrl.setValue(champ.name, { emitEvent: false });
    this.isChampDropdownOpen = false;
  }

  selectLocalTeam(team: Team) {
    this.matchForm.get('homeTeamId')?.setValue(team.id);
    this.selectedLocalTeamName = team.name;
    this.localSearchCtrl.setValue(team.name, { emitEvent: false });
    this.isLocalDropdownOpen = false;
  }

  selectVisitorTeam(team: Team) {
    this.matchForm.get('awayTeamId')?.setValue(team.id);
    this.selectedVisitorTeamName = team.name;
    this.visitorSearchCtrl.setValue(team.name, { emitEvent: false });
    this.isVisitorDropdownOpen = false;
  }

  selectStadium(stadiumName: string) {
    this.matchForm.get('stadium')?.setValue(stadiumName);
    this.stadiumSearchCtrl.setValue(stadiumName, { emitEvent: false });
    this.isStadiumDropdownOpen = false;
  }

  toggleStatusDropdown() {
    this.isStatusOpen = !this.isStatusOpen;
  }

  selectStatus(status: string) {
    this.matchForm.get('status')?.setValue(status);
    this.isStatusOpen = false;
  }

  onSubmit() {
    if (this.matchForm.valid && this.matchId !== null) {
      this.matchService.updateMatch(this.matchId, this.matchForm.value).subscribe({
        next: () => {
          this.closePanel.emit();
        },
        error: (err: any) => console.error('Error al actualizar el partido:', err),
      });
    } else {
      this.matchForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.closePanel.emit();
  }
}
