import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Team } from '../../models/Team';
import { TeamService } from '../../services/team-service';
import { DatePipe } from '@angular/common';

@Component({
  imports: [RouterLink,DatePipe],
  standalone: true,
  selector: 'app-teams',
  styleUrl: './teams.css',
  templateUrl: './teams.html',
})
export class Teams implements OnInit{
  private teamService = inject(TeamService);
  equipos = signal<Team[]>([]); 

  ngOnInit(): void {
    this.teamService.getAll().subscribe({
      next: (data) => this.equipos.set(data),
      error: (err) => console.error('Error al cargar equipos', err)
    });
  }
}
