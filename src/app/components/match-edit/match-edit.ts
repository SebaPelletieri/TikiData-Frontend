import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  HostListener,
} from '@angular/core';
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
  loadedMatchData: any = null;

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
  ];

  // Buscador de Campeonato
  championshipSearchCtrl = new FormControl('');
  filteredChampionships: Championship[] = [];
  isChampDropdownOpen = false;

  // Buscador de Equipo Local
  localSearchCtrl = new FormControl('');
  filteredLocalTeams: Team[] = [];
  isLocalDropdownOpen = false;

  // Buscador de Equipo Visitante
  visitorSearchCtrl = new FormControl('');
  filteredVisitorTeams: Team[] = [];
  isVisitorDropdownOpen = false;

  // Buscador de Estadio
  stadiumSearchCtrl = new FormControl('');
  filteredStadiums: string[] = [];
  isStadiumDropdownOpen = false;

  // Opciones de Estado del Partido
  statuses = ['Programado', 'En vivo', 'Finalizado'];
  isStatusOpen = false;

  ngOnInit(): void {
    this.initForm();

    this.teamService.getAllTeams().subscribe({
      next: (teams: Team[]) => {
        this.allTeams = teams;
        this.tryResolveNames();
      },
      error: (err: any) => console.error('Error al cargar equipos:', err),
    });

    this.championshipService.getAllChampionships().subscribe({
      next: (champs: Championship[]) => {
        this.allChampionships = champs;
        this.tryResolveNames();
      },
      error: (err: any) => console.error('Error al cargar campeonatos:', err),
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

    // Filtros reactivos de búsqueda
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

    this.stadiumSearchCtrl.valueChanges.subscribe((query) => {
      const q = (query || '').toLowerCase().trim();
      this.matchForm.get('stadium')?.setValue(query);
      if (!q) {
        this.filteredStadiums = [];
        this.isStadiumDropdownOpen = false;
      } else {
        this.filteredStadiums = this.allStadiums.filter((s) => s.toLowerCase().includes(q));
        this.isStadiumDropdownOpen = this.filteredStadiums.length > 0;
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.championship-group')) this.isChampDropdownOpen = false;
    if (!target.closest('.local-group')) this.isLocalDropdownOpen = false;
    if (!target.closest('.visitor-group')) this.isVisitorDropdownOpen = false;
    if (!target.closest('.stadium-group')) this.isStadiumDropdownOpen = false;
    if (!target.closest('.status-group')) this.isStatusOpen = false;
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
          this.loadedMatchData = match;

          // 👈 Formato YYYY-MM-DDTHH:mm requerido por input datetime-local
          const rawDate = match.matchDate || match.fecha || '';
          const formattedDate = rawDate ? rawDate.substring(0, 16) : '';

          this.matchForm.patchValue({
            championshipId: match.championshipId || match.campeonatoId || match.champId,
            matchDate: formattedDate,
            homeTeamId: match.homeTeamId || match.equipoLocalId || match.localTeamId,
            awayTeamId: match.awayTeamId || match.equipoVisitanteId || match.visitorTeamId,
            stadium: match.stadium || match.estadio || '',
            status: match.status || match.estado || 'Programado',
            homeGoals: match.homeGoals ?? match.golesLocal ?? 0,
            awayGoals: match.awayGoals ?? match.golesVisitante ?? 0,
          });

          this.tryResolveNames();
        }
      },
      error: (err: any) => console.error('Error al cargar partido:', err),
    });
  }

  tryResolveNames() {
    if (!this.loadedMatchData) return;
    const match = this.loadedMatchData;

    // 1. Resolver Nombre Campeonato
    if (match.championshipName) {
      this.championshipSearchCtrl.setValue(match.championshipName, { emitEvent: false });
    } else {
      const champId = match.championshipId || match.campeonatoId || match.champId;
      if (champId && this.allChampionships.length > 0) {
        const found = this.allChampionships.find((c) => c.id == champId);
        if (found) this.championshipSearchCtrl.setValue(found.name, { emitEvent: false });
      }
    }

    // 2. Resolver Nombre Equipo Local
    if (match.homeTeamName) {
      this.localSearchCtrl.setValue(match.homeTeamName, { emitEvent: false });
    } else {
      const homeId = match.homeTeamId || match.equipoLocalId || match.localTeamId;
      if (homeId && this.allTeams.length > 0) {
        const found = this.allTeams.find((t) => t.id == homeId);
        if (found) this.localSearchCtrl.setValue(found.name, { emitEvent: false });
      }
    }

    // 3. Resolver Nombre Equipo Visitante
    if (match.awayTeamName) {
      this.visitorSearchCtrl.setValue(match.awayTeamName, { emitEvent: false });
    } else {
      const awayId = match.awayTeamId || match.equipoVisitanteId || match.visitorTeamId;
      if (awayId && this.allTeams.length > 0) {
        const found = this.allTeams.find((t) => t.id == awayId);
        if (found) this.visitorSearchCtrl.setValue(found.name, { emitEvent: false });
      }
    }

    // 4. Estadio
    const stad = match.stadium || match.estadio;
    if (stad) {
      this.stadiumSearchCtrl.setValue(stad, { emitEvent: false });
    }
  }

  selectChampionship(champ: Championship) {
    this.matchForm.get('championshipId')?.setValue(champ.id);
    this.championshipSearchCtrl.setValue(champ.name, { emitEvent: false });
    this.isChampDropdownOpen = false;
  }

  selectLocalTeam(team: Team) {
    this.matchForm.get('homeTeamId')?.setValue(team.id);
    this.localSearchCtrl.setValue(team.name, { emitEvent: false });
    this.isLocalDropdownOpen = false;
  }

  selectVisitorTeam(team: Team) {
    this.matchForm.get('awayTeamId')?.setValue(team.id);
    this.visitorSearchCtrl.setValue(team.name, { emitEvent: false });
    this.isVisitorDropdownOpen = false;
  }

  selectStadium(stadiumName: string) {
    this.matchForm.get('stadium')?.setValue(stadiumName);
    this.stadiumSearchCtrl.setValue(stadiumName, { emitEvent: false });
    this.isStadiumDropdownOpen = false;
  }

  toggleStatusDropdown(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.isStatusOpen = !this.isStatusOpen;
  }

  selectStatus(status: string) {
    this.matchForm.get('status')?.setValue(status);
    this.isStatusOpen = false;
  }

  onSubmit() {
    if (this.matchForm.valid && this.matchId !== null) {
      this.matchService.update(this.matchId, this.matchForm.value).subscribe({
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
