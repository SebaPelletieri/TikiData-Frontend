import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, computed } from '@angular/core';
import { Team } from '../models/Team';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/equipos';

  error = signal<string | null>(null);
  teams = signal<Team[]>([]);
  teamActual = signal<Team | null>(null);

  sortedTeams = computed(() => {
    return [...this.teams()].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'accent' }),
    );
  });

  getAllTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(this.apiUrl);
  }

  getAll() {
    this.http.get<Team[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.teams.set(data);
        this.error.set(null);
      },
      error: () => {
        this.error.set('No se pudieron obtener los equipos de la base de datos');
      },
    });
  }

  saveTeam(team: Team) {
    this.http.post(this.apiUrl, team).subscribe({
      next: () => {
        this.getAll();
        this.error.set(null);
      },
      error: () => {
        this.error.set('No se pudo agregar un nuevo equipo al sistema');
      },
    });
  }

  updateTeam(id: number, team: Team): Observable<Team> {
    return this.http.put<Team>(`${this.apiUrl}/${id}`, team).pipe(
      map((data) => {
        this.teamActual.set(data);
        this.getAll();
        this.error.set(null);
        return data;
      }),
    );
  }

  deleteTeam(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.error.set(null);
        this.getAll();
      },
      error: () => {
        this.error.set('No se pudo eliminar el equipo del sistema');
      },
    });
  }

  getById(id: number): Observable<Team> {
    return this.http.get<Team>(`${this.apiUrl}/${id}`);
  }

  getTeamsSortedByPoints(): Observable<Team[]> {
    return this.http
      .get<Team[]>(this.apiUrl)
      .pipe(map((teams) => teams.sort((a, b) => (b.points || 0) - (a.points || 0))));
  }
}
