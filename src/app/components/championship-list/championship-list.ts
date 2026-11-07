import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChampionshipService } from '../../services/championship-service';

@Component({
standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],  selector: 'app-championship-list',
  styleUrl: './championship-list.css',
  templateUrl: './championship-list.html',
})
export class ChampionshipList implements OnInit {
  public championshipService = inject(ChampionshipService);
  searchText = signal('');
  selectedType = signal('ALL');

  ngOnInit(): void {
    this.championshipService.getAll();
  }

  filteredChampionships = computed(() => {
    const list = this.championshipService.championships ? this.championshipService.championships() : [];
    const search = this.searchText().toLowerCase().trim();
    const type = this.selectedType();

    return list.filter(champ => {
      const matchesSearch = champ.name.toLowerCase().includes(search);
      const matchesType = type === 'ALL' || champ.type === type;
      return matchesSearch && matchesType;
    });
  });
}
