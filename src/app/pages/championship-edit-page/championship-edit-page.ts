import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { goBackOr } from '../../utils/navigation';
import { ChampionshipEdit } from '../../components/championship-edit/championship-edit'; // Ajusta tu ruta de importación

@Component({
  selector: 'app-championship-edit-page',
  standalone: true,
  imports: [CommonModule, ChampionshipEdit],
  template: `
    <div class="page-container" style="max-width: 750px; margin: 2.5rem auto; padding: 0 1rem;">
      @if (championshipId()) {
        <app-championship-edit [championshipIdInput]="championshipId()!" (closePanel)="goBack()" />
      }
    </div>
  `,
})
export class ChampionshipEditPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  // El id puede ser texto ("premier-league-2026-27"). Antes se pasaba por Number(),
  // quedaba NaN y la página de edición se mostraba vacía.
  championshipId = signal<string | null>(null);

  ngOnInit() {
    // La URL trae el nombre (/championship/edit/premier-league); el resolver deja el id en data
    this.route.data.subscribe((data) => {
      const id = data['id'];
      if (id) this.championshipId.set(String(id));
    });
  }

  goBack() {
    goBackOr(this.location, this.router);
  }
}
