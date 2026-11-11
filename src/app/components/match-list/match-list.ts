import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatchService } from '../../services/match-service';
import { MatchCard } from '../match-card/match-card';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule, MatchCard],
  selector: 'app-match-list',
  styleUrl: './match-list.css',
  templateUrl: './match-list.html',
})
export class MatchList implements OnInit {
  public matchService = inject(MatchService);
  selectedFilter = signal<string>('TODOS');

  filteredMatches = computed(() => {
    const matches = this.matchService.matches();
    const filter = this.selectedFilter();

    if (filter === 'TODOS') return matches;
    return matches.filter((m) => m.status === filter);
  });

  ngOnInit(): void {
    this.matchService.getAll();
  }

  setFilter(status: string): void {
    this.selectedFilter.set(status);
  }
}
