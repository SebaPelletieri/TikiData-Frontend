import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Team } from '../../models/Team';
import { TeamService } from '../../services/team-service';
import { DatePipe } from '@angular/common';
import { TeamForm } from '../../components/team-form/team-form';
import { TeamList } from '../../components/team-list/team-list';

@Component({
  imports: [RouterLink, TeamForm, TeamList],
  standalone: true,
  selector: 'app-teams',
  styleUrl: './teams.css',
  templateUrl: './teams.html',
})
export class Teams implements OnInit {
  private teamService = inject(TeamService);
  equipos = this.teamService.teams;
  showForm = signal(false);

  ngOnInit(): void {
    this.teamService.getAll();
  }
  toggleForm() {
    this.showForm.update(val => !val);
  }
}
