import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Championship } from '../models/Championship';
@Injectable({ providedIn: 'root' })
export class ChampionshipService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/campeonatos';
  championships = signal<Championship[]>([]);
  championshipActual = signal<Championship | null>(null);
  error = signal<string | null>(null);

  //Métodos del HTTP
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

  getByID(id: number) {
    this.http.get<Championship>(`${this.apiUrl}/${id}`).subscribe({
      next: (data) => {
        this.championshipActual.set(data);
        this.error.set(null);
      },
      error: (error) => {
        this.error.set('No se pudo obtener el campeonato');
      },
    });
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
}
