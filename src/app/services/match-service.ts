import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Match, Status } from '../models/Match';
import { catchError, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MatchService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/partidos';

  matches = signal<Match[]>([]);
  matchActual = signal<Match | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  getAll(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Match[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.matches.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar partidos:', err);
        this.error.set('No se pudieron obtener los partidos.');
        this.loading.set(false);
      },
    });
  }

  // Compatible con getById y getByTeam / getByID
  getByID(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Match>(`${this.apiUrl}/${id}`).subscribe({
      next: (data) => {
        this.matchActual.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el partido:', err);
        this.error.set('No se pudo encontrar el partido solicitado.');
        this.loading.set(false);
      },
    });
  }

  // Método que devuelve un Observable para el formulario de edición
  getById(id: number): Observable<Match> {
    return this.http.get<Match>(`${this.apiUrl}/${id}`).pipe(
      catchError((err) => {
        console.error('Error al obtener partido por ID:', err);
        throw err;
      }),
    );
  }

  create(matchData: Partial<Match>): Observable<Match> {
    return this.http.post<Match>(this.apiUrl, matchData).pipe(
      tap((newMatch: Match) => {
        this.matches.update((current) => [...current, newMatch]);
      }),
      catchError((err) => {
        console.error('Error al crear el partido:', err);
        throw err;
      }),
    );
  }

  // Alias para mantener compatibilidad con el formulario
  createMatch(matchData: Partial<Match>): Observable<Match> {
    return this.create(matchData);
  }

  update(id: number, matchData: Partial<Match>): Observable<Match> {
    return this.http.patch<Match>(`${this.apiUrl}/${id}`, matchData).pipe(
      tap((updated) => {
        this.matches.update((current) =>
          current.map((m) => (m.id === id ? { ...m, ...updated } : m)),
        );
        if (this.matchActual()?.id === id) {
          this.matchActual.set({ ...this.matchActual()!, ...updated });
        }
      }),
    );
  }

  // Alias para mantener compatibilidad con el formulario
  updateMatch(id: number, matchData: Partial<Match>): Observable<Match> {
    return this.update(id, matchData);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.matches.update((current) => current.filter((m) => m.id !== id));
      }),
    );
  }

  // Alias para mantener compatibilidad con el panel de administración
  deleteMatch(id: number): Observable<any> {
    return this.delete(id);
  }

  getByTeam(teamId: number): Observable<Match[]> {
    return this.http
      .get<Match[]>(`${this.apiUrl}?localTeamID=${teamId}`)
      .pipe(catchError(() => of([])));
  }

  getByChampionship(championshipId: number): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.apiUrl}?championshipID=${championshipId}`);
  }

  getByStatus(status: Status): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.apiUrl}?status=${status}`);
  }
}
