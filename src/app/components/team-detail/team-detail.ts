import { Component, input, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Team } from '../../models/Team';
import { Stadium } from '../../models/stadium';
import { Player } from '../../models/Player';
import { TeamRoster } from '../team-roster/team-roster'; // 👈 1. Importar componente del plantel

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, TeamRoster], // 👈 2. Agregarlo a los imports
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
})
export class TeamDetailComponent {
  team = input.required<Team>();
  stadium = input<Stadium | null>(null);
  championships = input<any[]>([]);
  matches = input<any[]>([]);
  players = input<Player[]>([]); // 👈 3. Recibir el array de jugadores

  activeTab = signal<'general' | 'squad' | 'matches'>('general');

  setTab(tab: 'general' | 'squad' | 'matches'): void {
    this.activeTab.set(tab);
  }

  // Método para formatear en español nativo
  formatSpanishDate(dateInput: string | Date | undefined): string {
    if (!dateInput) return '';

    let date: Date;

    if (typeof dateInput === 'string') {
      const cleanDate = dateInput.split('T')[0];
      const [year, month, day] = cleanDate.split('-').map(Number);
      date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
    } else {
      date = new Date(dateInput);
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }
}
