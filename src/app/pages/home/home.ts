import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChampionshipService } from '../../services/championship-service';
import { Team } from '../../models/Team';
import { PlayerService } from '../../services/player-service';
import { TeamService } from '../../services/team-service';

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  standalone: true,
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private championshipService = inject(ChampionshipService);
  private teamService = inject(TeamService);
  private playerService = inject(PlayerService);

  campeonatos = this.championshipService.championships;
  teamsRanked = signal<Team[]>([]);
  topScorers = this.playerService.topScorers;

  // Propiedad para mostrar la fecha de hoy formateada dinámicamente en español
  fechaActual: string = '';

  ngOnInit(): void {
    // Generar la fecha actual del sistema (ej: "Sábado, 14 de noviembre")
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    };
    const fechaFormateada = new Date().toLocaleDateString('es-ES', opciones);
    // Capitalizar la primera letra
    this.fechaActual = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
1
    this.championshipService.getAll();

    this.teamService.getTeamsSortedByPoints().subscribe({
      next: (data) => this.teamsRanked.set(data),
      error: (err) => console.error('Error al ordenar equipos', err),
    });

    this.playerService.getTopScorers();
  }
}
