import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Team } from '../../models/Team';
import { TeamService } from '../../services/team-service';
import { DatePipe } from '@angular/common';
import { TeamForm } from '../../components/team-form/team-form';

@Component({
  imports: [RouterLink, DatePipe, TeamForm],
  standalone: true,
  selector: 'app-teams',
  styleUrl: './teams.css',
  templateUrl: './teams.html',
})
export class Teams implements OnInit {
  private teamService = inject(TeamService);
  equipos = signal<Team[]>([]);

  ngOnInit(): void {
    this.teamService.getAll();
  }
}
