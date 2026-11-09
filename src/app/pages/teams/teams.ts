import { Component, inject, signal } from '@angular/core';
import { TeamService } from '../../services/team-service';
import { TeamForm } from '../../components/team-form/team-form';
import { TeamList } from '../../components/team-list/team-list';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [TeamList],
  templateUrl: './teams.html',
  styleUrl: './teams.css',
})
export class Teams {
}
