import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Service } from '@angular/core';
import { Teams } from '../pages/teams/teams';
import { Team } from '../models/Team';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/equipos';

  getAll(){
    return this.http.get<Team[]>(this.apiUrl);
  }
}
