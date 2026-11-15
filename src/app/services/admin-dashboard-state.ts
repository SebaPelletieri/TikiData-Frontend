import { Injectable, signal } from '@angular/core';

/**
 * Estado del panel de administración que tiene que sobrevivir a la navegación.
 * Al ir a "Editar equipo / jugador / campeonato / partido" el dashboard se destruye; como este servicio
 * es único en toda la app, al volver se recuperan la página y los filtros donde estabas.
 */
@Injectable({ providedIn: 'root' })
export class AdminDashboardState {
  // Equipos
  adminSearchText = signal('');
  selectedAdminCountry = signal('ALL');
  selectedAdminChampionship = signal('ALL');
  currentPage = signal(1);
  selectedCountryLabel = 'Todos los países';
  selectedChampionshipLabel = 'Todos los campeonatos';

  // Jugadores
  playerSearchText = signal('');
  selectedPlayerPosition = signal('ALL');
  selectedPlayerNationality = signal('ALL');
  currentPlayerPage = signal(1);
  selectedPlayerPositionLabel = 'Todas las posiciones';
  selectedPlayerNationalityLabel = 'Todas las nacionalidades';

  // Campeonatos
  championshipSearchText = signal('');
  selectedChampionshipCountry = signal('ALL');
  selectedChampionshipType = signal('ALL');
  currentChampPage = signal(1);
  selectedChampCountryLabel = 'Todos los países';
  selectedChampTypeLabel = 'Todos los tipos';

  // Partidos
  matchSearchText = signal('');
  selectedMatchStatus = signal('ALL');
  currentMatchPage = signal(1);
  selectedMatchStatusLabel = 'Todos los estados';
}
