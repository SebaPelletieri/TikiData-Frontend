import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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

  championshipId = signal<number | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.championshipId.set(Number(id));
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin']);
  }
}
