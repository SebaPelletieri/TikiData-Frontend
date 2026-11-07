import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeamService } from '../../services/team-service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  selector: 'app-team-list',
  styleUrl: './team-list.css',
  templateUrl: './team-list.html',
})
export class TeamList implements OnInit{
  public teamService = inject(TeamService);

  searchText = signal('');
  selectedCountry = signal('ALL');

  ngOnInit(): void {
    this.teamService.getAll();
  }

  filteredTeams = computed(() => {
    const list = this.teamService.teams ? this.teamService.teams() : [];
    const search = this.searchText().toLowerCase().trim();
    const country = this.selectedCountry();

    return list.filter(team => {
      const matchSearch = team.name.toLowerCase().includes(search);
      const matchCountry = country === 'ALL' || team.country === country;
      return matchSearch && matchCountry;
    });
  });
}
