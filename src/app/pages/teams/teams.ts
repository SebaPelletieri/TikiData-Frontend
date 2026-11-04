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
  equipos = this.teamService.teams; 

  ngOnInit(): void {
      this.teamService.getAll();
}
}
