import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Match } from '../../models/Match';
import { TeamService } from '../../services/team-service';
import { TranslocoPipe } from '@jsverse/transloco';
import { RoundPipe } from '../../i18n/data.pipes';

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, TranslocoPipe, RoundPipe],
  styleUrl: './match-card.css',
  templateUrl: './match-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchCard {
  match = input.required<Match>();
  private teamService = inject(TeamService);

  // Los equipos salen de la lista compartida (una sola carga), no de un pedido por tarjeta
  localTeam = computed(() => this.findTeam(this.match().localTeamID));
  awayTeam = computed(() => this.findTeam(this.match().awayTeamID));

  constructor() {
    this.teamService.ensureLoaded();
  }

  private findTeam(id: unknown): { name: string; shield?: string } | null {
    if (id === undefined || id === null) return null;
    const team = this.teamService.teamsById().get(String(id));
    if (team) return team;
    // Ya cargó y no está: se muestra un nombre genérico en vez de "Cargando..."
    return this.teamService.loaded() ? { name: `Equipo ${id}` } : null;
  }
}
