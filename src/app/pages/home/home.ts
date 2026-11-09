import { Component, inject, OnInit, signal } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { RouterLink } from '@angular/router';
import { Championship } from '../../models/Championship';
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

  ngOnInit(): void {
    this.championshipService.getAll();

    this.teamService.getTeamsSortedByPoints().subscribe({
      next: (data) => this.teamsRanked.set(data),
      error: (err) => console.error('Error al ordenar equipos', err)
    });

    this.playerService.getTopScorers();
  }
}
