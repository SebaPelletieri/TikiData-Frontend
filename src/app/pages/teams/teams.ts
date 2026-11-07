import { Component, inject, signal } from '@angular/core';
import { TeamService } from '../../services/team-service';
import { TeamForm } from '../../components/team-form/team-form';
import { TeamList } from '../../components/team-list/team-list';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [TeamForm, TeamList],
  templateUrl: './teams.html',
  styleUrl: './teams.css',
})
export class Teams {
  private teamService = inject(TeamService);
  equipos = this.teamService.teams;
  showForm = signal(false);

  toggleForm(): void {
    this.showForm.update((val) => !val);
  }
}
