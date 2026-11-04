import { inject, Injectable, Service } from '@angular/core';
import { Player } from '../models/Player';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/jugadores';

  getAll(){
    return this.http.get<Player[]>(this.apiUrl);
  }
}
