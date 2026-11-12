import { Component, OnInit, Output, EventEmitter, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchService } from '../../services/match-service';
import { TeamService } from '../../services/team-service';
import { ChampionshipService } from '../../services/championship-service';
import { Match, Status } from '../../models/Match';

@Component({
  selector: 'app-match-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './match-form.html',
  styleUrls: ['./match-form.css'], // O styleUrl según prefieras
})
export class MatchForm implements OnInit {
  private matchService = inject(MatchService);
  public teamService = inject(TeamService);
  public championshipService = inject(ChampionshipService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @Output() closePanel = new EventEmitter<void>();

  // Si se pasa como ruta de edición independiente
  matchIdInput = input<string | number>();

  isEditing = false;
  errorMessage = '';

  matchData: Match = {
    localTeamID: 0,
    awayTeamID: 0,
    championshipID: 0,
    date: new Date().toISOString().slice(0, 16),
    localGoals: 0,
    awayGoals: 0,
    status: 'Programado' as Status,
    stadium: '',
  };

  ngOnInit(): void {
    this.teamService.getAll();
    this.championshipService.getAll();

    const idFromRoute = this.route.snapshot.paramMap.get('id') || this.matchIdInput();

    if (idFromRoute) {
      this.isEditing = true;
      const numericId = Number(idFromRoute);

      this.matchService.getById(numericId).subscribe({
        next: (match) => {
          if (match) {
            // Formatear la fecha para el input datetime-local si viene como string/Date
            let formattedDate = match.date;
            if (match.date) {
              formattedDate = new Date(match.date).toISOString().slice(0, 16);
            }
            this.matchData = { ...match, date: formattedDate };
          }
        },
        error: (err) => console.error('Error al cargar partido para editar:', err),
      });
    }
  }

  saveMatch(): void {
    if (
      !this.matchData.localTeamID ||
      !this.matchData.awayTeamID ||
      !this.matchData.championshipID
    ) {
      this.errorMessage = 'Por favor completa los campos obligatorios (Equipos y Campeonato).';
      return;
    }

    if (this.matchData.localTeamID === this.matchData.awayTeamID) {
      this.errorMessage = 'El equipo local y visitante no pueden ser el mismo.';
      return;
    }

    if (this.isEditing && this.matchData.id) {
      this.matchService.updateMatch(Number(this.matchData.id), this.matchData).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => {
          console.error('Error al actualizar:', err);
          this.errorMessage = 'Error al actualizar el partido.';
        },
      });
    } else {
      this.matchService.createMatch(this.matchData).subscribe({
        next: () => this.handleSuccess(),
        error: (err) => {
          console.error('Error al crear:', err);
          this.errorMessage = 'Error al registrar el partido.';
        },
      });
    }
  }

  handleSuccess(): void {
    this.closePanel.emit();
    // Si está en ruta independiente, redirige al panel o listado
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
