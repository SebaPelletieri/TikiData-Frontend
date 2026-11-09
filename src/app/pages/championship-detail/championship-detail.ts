import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ChampionshipDetail } from '../../components/championship-detail/championship-detail';

@Component({
  selector: 'app-championship-detail-page',
  standalone: true,
  imports: [CommonModule, ChampionshipDetail],
  templateUrl: './championship-detail.html',
  styleUrls: ['./championship-detail.css'],
})
export class ChampionshipDetailPage implements OnInit {
  private route = inject(ActivatedRoute);

  // Signal para almacenar el ID que viene de la URL (ej: /championship/3 -> id = 3)
  championshipId = signal<number | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.championshipId.set(Number(id));
      }
    });
  }
}
