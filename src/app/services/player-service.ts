import { inject, Injectable, signal, computed } from '@angular/core'; // 👈 Añade computed
import { Player } from '../models/Player';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/jugadores';
  players = signal<Player[]>([]);
  playerActual = signal<Player | null>(null);
  error = signal<string | null>(null);
  topScorers = signal<Player[]>([]);

  // 👇 Lista de jugadores ordenada alfabéticamente por nombre de manera reactiva
  sortedPlayers = computed(() => {
    return [...this.players()].sort((a, b) => a.name.localeCompare(b.name));
  });

  // Métodos del HTTP
  getAll() {
    this.http.get<Player[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.players.set(data);
        this.error.set(null);
      },
      error: () => {
        this.error.set('No se pudieron obtener los datos de la base de datos');
      },
    });
  }

  getAllPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(this.apiUrl);
  }

  getByID(id: number): Observable<Player> {
    return this.http.get<Player>(`${this.apiUrl}/${id}`);
  }

  savePlayer(player: Player) {
    this.http.post(this.apiUrl, player).subscribe({
      next: () => {
        this.getAll();
        this.error.set(null);
      },
      error: () => {
        this.error.set('No se pudo guardar el jugador en la base de datos');
      },
    });
  }

  updatePlayer(id: number, player: Player): Observable<Player> {
    return this.http.put<Player>(`${this.apiUrl}/${id}`, player).pipe(
      map((data) => {
        this.getAll();
        this.playerActual.set(data);
        this.error.set(null);
        return data;
      }),
    );
  }

  deletePlayer(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.getAll();
        this.error.set(null);
      },
      error: () => {
        this.error.set('No se pudo eliminar el jugador de la base de datos');
      },
    });
  }

  getTopScorers(): void {
    this.http
      .get<Player[]>(this.apiUrl)
      .pipe(map((players) => players.sort((a: any, b: any) => (b.goals || 0) - (a.goals || 0))))
      .subscribe({
        next: (data) => {
          this.topScorers.set(data);
          this.error.set(null);
        },
        error: () => {
          this.error.set('No se pudieron obtener los goleadores');
        },
      });
  }

  getByName(name: string): Observable<Player | undefined> {
    const formattedName = name.replace(/-/g, ' ').toLowerCase();
    return this.http
      .get<Player[]>(this.apiUrl)
      .pipe(map((players) => players.find((p) => p.name.toLowerCase() === formattedName)));
  }
}
