import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TeamService } from '../../services/team-service';
import { Championship } from '../../models/Championship';
import { Stadium } from '../../models/stadium';
import { Match } from '../../models/Match';
import { Team } from '../../models/Team';
// Interfaz auxiliar para renderizar la tabla de forma limpia
interface MatchView {
  date: Date;
  homeName: string;
  homeShield: string;
  score: string;
  awayName: string;
  awayShield: string;
  tournament: string;
}
@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  selector: 'app-team-detail',
  styleUrl: './team-detail.css',
  templateUrl: './team-detail.html',
})
export class TeamDetail implements OnInit{
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  public teamService = inject(TeamService);
  recentMatches = signal<any[]>([]);
  activeTab = signal('general');
  stadiumActual = signal<Stadium | null>(null);
  activeChampionships = signal<Championship[]>([]);
  allTeams = signal<Team[]>([]);
  allChampionships = signal<Championship[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const teamId = Number(id);
      this.teamService.getByID(Number(id));
      this.http.get<Team[]>('http://localhost:3000/equipos').subscribe(t => this.allTeams.set(t));
      this.http.get<Championship[]>('http://localhost:3000/campeonatos').subscribe(c => this.allChampionships.set(c));

      setTimeout(() => {
        const team = this.teamService.teamActual();
        if (team) {
          if (team.stadiumID) this.fetchStadium(team.stadiumID);
          if (team.championshipsActive && team.championshipsActive.length > 0) {
            this.fetchChampionships(team.championshipsActive);
          }
        this.fetchRecentMatches(teamId);        }
      }, 500);
    }
  }

  fetchStadium(stadiumId: number) {
    // Asumiendo que tu endpoint en json-server es /estadios o /stadiums
    this.http.get<Stadium>(`http://localhost:3000/estadios/${stadiumId}`).subscribe({
      next: (data) => this.stadiumActual.set(data),
      error: (err) => console.error('Error al cargar estadio', err)
    });
  }

  fetchChampionships(champIds: number[]) {
    this.http.get<Championship[]>('http://localhost:3000/campeonatos').subscribe({
      next: (allChamps) => {
        const filtered = allChamps.filter(c => c.id && champIds.includes(c.id));
        this.activeChampionships.set(filtered);
      },
      error: (err) => console.error('Error al cargar campeonatos', err)
    });
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  fetchRecentMatches(teamId: number) {
    this.http.get<Match[]>('http://localhost:3000/partidos').subscribe({
      next: (matches) => {
        // Filtramos los partidos donde el equipo juega de local o visitante
        const teamMatches = matches.filter(m => m.localTeamID === teamId || m.awayTeamID === teamId);
        
        // Transformamos los IDs en datos visuales cruzando con los diccionarios
        const viewMatches: MatchView[] = teamMatches.map(m => {
          const local = this.allTeams().find(t => t.id === m.localTeamID);
          const away = this.allTeams().find(t => t.id === m.awayTeamID);
          const champ = this.allChampionships().find(c => c.id === m.championshipID);

          return {
            date: m.date,
            homeName: local?.name || 'Desconocido',
            homeShield: local?.shield || '',
            score: `${m.localGoals} - ${m.awayGoals}`,
            awayName: away?.name || 'Desconocido',
            awayShield: away?.shield || '',
            tournament: champ?.name || 'Amistoso'
          };
        });

        this.recentMatches.set(viewMatches);
      },
      error: (err) => console.error('Error al cargar partidos', err)
    });
  }
}
