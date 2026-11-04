import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Service } from '@angular/core';
import { Championship } from '../models/Championship';

@Injectable({ providedIn: 'root' })
export class ChampionshipService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/campeonatos';

  getAll(){
      return this.http.get<Championship[]>(this.apiUrl);
    }

}
