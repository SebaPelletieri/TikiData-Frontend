import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ChampionshipService } from '../../services/championship-service';
import { Team } from '../../models/Team';

@Component({
standalone: true,
  imports: [CommonModule, RouterModule],  selector: 'app-championship-detail',
  styleUrl: './championship-detail.css',
  templateUrl: './championship-detail.html',
})
export class ChampionshipDetail implements OnInit {
  route = inject(ActivatedRoute);
  http = inject(HttpClient);
  championshipService = inject(ChampionshipService);

  participatingTeams = signal<Team[]>([]);
  isLoadingTeams = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.championshipService.getByID(Number(id));

      setTimeout(() => {
        const champ = this.championshipService.championshipActual();
        if (champ && champ.teamsIDs && champ.teamsIDs.length > 0) {
          this.fetchParticipatingTeams(champ.teamsIDs); // <-- Ahora la clase sí lo reconoce
        } else {
          this.isLoadingTeams.set(false);
        }
      }, 400);
    }
  }

fetchParticipatingTeams(teamIds: number[]) {
    this.http.get<Team[]>('http://localhost:3000/equipos').subscribe({
      next: (allTeams) => {
        const filtered = allTeams.filter(team => team.id && teamIds.includes(team.id));
        this.participatingTeams.set(filtered);
        this.isLoadingTeams.set(false);
      },
      error: (err) => {
        console.error('Error al cargar equipos participantes', err);
        this.isLoadingTeams.set(false);
      }
    });
  }
  
}
