import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Championship } from '../models/Championship';
import { Observable } from 'rxjs'; // 👈 Asegúrate de importar Observable

@Injectable({ providedIn: 'root' })
export class ChampionshipService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/campeonatos';
  championships = signal<Championship[]>([]);
  championshipActual = signal<Championship | null>(null);
  error = signal<string | null>(null);

  getAll() {
    this.http.get<Championship[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.championships.set(data);
        this.error.set(null);
      },
      error: (error) => {
        this.error.set('No se pudieron obtener los campeonatos de la base de datos');
      },
    });
  }

  getByID(id: number): Observable<Championship> {
    return this.http.get<Championship>(`${this.apiUrl}/${id}`);
  }

  saveChampionship(championship: Championship) {
    this.http.post(this.apiUrl, championship).subscribe({
      next: () => {
        this.getAll();
        this.error.set(null);
      },
      error: (error) => {
        this.error.set('No se pudo guardar el campeonato en la base de datos');
      },
    });
  }

  deleteChampionship(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.getAll();
        this.error.set(null);
      },
      error: (error) => {
        this.error.set('No se pudo eliminar el campeonato de la base de datos');
      },
    });
  }

  updateChampionship(id: number, championship: Championship) {
    this.http.put<Championship>(`${this.apiUrl}/${id}`, championship).subscribe({
      next: (data) => {
        this.getAll();
        this.error.set(null);
        this.championshipActual.set(data);
      },
      error: (error) => {
        this.error.set('No se pudo actualizar el campeonato en la base de datos');
      },
    });
  }

  getByName(name: string): Observable<Championship[]> {
    return this.http.get<Championship[]>(`${this.apiUrl}?name_like=${name}`);
  }

  getAllChampionships(): Observable<Championship[]> {
    return this.http.get<Championship[]>(this.apiUrl);
  }
}
