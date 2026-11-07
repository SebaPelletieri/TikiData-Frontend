import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChampionshipService } from '../../services/championship-service';
import { Championship, ChampionshipType } from '../../models/Championship';

interface ChampionshipTypeOption {
  value: 'ALL' | ChampionshipType;
  label: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  selector: 'app-championship-list',
  styleUrl: './championship-list.css',
  templateUrl: './championship-list.html',
})
export class ChampionshipList implements OnInit {
  public championshipService = inject(ChampionshipService);

  searchText = signal('');
  selectedType = signal<'ALL' | ChampionshipType>('ALL');
  isTypeDropdownOpen = signal(false);

  typeOptions: ChampionshipTypeOption[] = [
    { value: 'ALL', label: 'Todas las competencias' },
    { value: 'LIGA', label: 'Liga' },
    { value: 'COPA', label: 'Copa' },
    { value: 'INTERNACIONAL', label: 'Internacional' },
  ];

  ngOnInit(): void {
    this.championshipService.getAll();
  }

  toggleTypeDropdown(): void {
    this.isTypeDropdownOpen.update((open) => !open);
  }

  selectType(type: 'ALL' | ChampionshipType): void {
    this.selectedType.set(type);
    this.isTypeDropdownOpen.set(false);
  }

  get selectedTypeLabel(): string {
    const current = this.selectedType();
    return this.typeOptions.find((t) => t.value === current)?.label || 'Todas las competencias';
  }

  // Traducción estricta y tipada para la etiqueta de la tarjeta
  getTypeBadgeLabel(type: ChampionshipType): string {
    switch (type) {
      case 'LIGA':
        return 'Liga';
      case 'COPA':
        return 'Copa';
      case 'INTERNACIONAL':
        return 'Internacional';
    }
  }

  filteredChampionships = computed(() => {
    const list = this.championshipService.championships
      ? this.championshipService.championships()
      : [];
    const search = this.searchText().toLowerCase().trim();
    const typeFilter = this.selectedType();

    return list.filter((champ: Championship) => {
      const matchesSearch = !search || champ.name.toLowerCase().includes(search);
      const matchesType = typeFilter === 'ALL' || champ.type === typeFilter;
      return matchesSearch && matchesType;
    });
  });
}
