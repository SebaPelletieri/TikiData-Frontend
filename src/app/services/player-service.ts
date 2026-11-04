import { inject, Injectable, signal } from '@angular/core';
import { Player } from '../models/Player';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/jugadores';
  players = signal<Player[]>([]);
  playerActual = signal<Player | null>(null);
  error = signal<string | null>(null);

  //Métodos del HTTP
  getAll() {
    this.http.get<Player[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.players.set(data);
        this.error.set(null);
      },
      error: (error) => {
        this.error.set('No se pudieron obtener los datos de la base de datos');
      },
    });
  }

  getByID(id: number) {
    this.http.get<Player>(`${this.apiUrl}/${id}`).subscribe({
      next: (data) => {
        this.playerActual.set(data);
        this.error.set(null);
      },
      error: (error) => {
        this.error.set('No se encontro el jugador buscado');
      },
    });
  }

  savePlayer(player: Player) {
    this.http.post(this.apiUrl, player).subscribe({
      next: () => {
        this.getAll();
        this.error.set(null);
      },
      error: (error) => {
        this.error.set('No se pudo guardar el jugador en la base de datos');
      },
    });
  }

  updatePlayer(id: number, player: Player) {
    this.http.put<Player>(`${this.apiUrl}/${id}`, player).subscribe({
      next: (data) => {
        this.getAll();
        this.playerActual.set(data);
        this.error.set(null);
      },
      error: (error) => {
        this.error.set('No se pudo actualizar el jugador en la base de datos');
      },
    });
  }

  deletePlayer(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.getAll();
        this.error.set(null);
      },
      error: (error) => {
        this.error.set('No se pudo eliminar el jugador de la base de datos');
      },
    });
  }
}
