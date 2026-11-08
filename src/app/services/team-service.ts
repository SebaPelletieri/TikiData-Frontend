import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Team } from '../models/Team';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/equipos';
  error = signal<string | null>(null);
  teams = signal<Team[]>([]);
  teamActual = signal<Team | null>(null);

  // Métodos del HTTP
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

  updateTeam(id: number, team: Team) {
    this.http.put<Team>(`${this.apiUrl}/${id}`, team).subscribe({
      next: (data) => {
        this.teamActual.set(data);
        this.getAll();
        this.error.set(null);
      },
      error: () => {
        this.error.set('No se puedo actualizar el equipo en el sistema');
      },
    });
  }

  deleteTeam(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.error.set(null);
        this.getAll();
      },
      error: () => {
        this.error.set('No se puedo eliminar el equipo del sistema');
      },
    });
  }

  // 👈 Ahora retorna el Observable para poder suscribirse desde el componente
  getById(id: number): Observable<Team> {
    return this.http.get<Team>(`${this.apiUrl}/${id}`);
  }
}
