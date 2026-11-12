import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ChampionshipDetail } from '../../components/championship-detail/championship-detail';
import { ChampionshipService } from '../../services/championship-service';

@Component({
  selector: 'app-championship-detail-page',
  standalone: true,
  imports: [CommonModule, ChampionshipDetail],
  templateUrl: './championship-detail.html',
  styleUrls: ['./championship-detail.css'],
})
export class ChampionshipDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private championshipService = inject(ChampionshipService);

  // Signal para saber el nombre actual del torneo
  championshipName = signal<string | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const nameParam = params.get('name'); // Recibe 'liga-profesional'
      if (nameParam) {
        // Reemplaza los guiones por espacios para buscarlo (ej: 'liga profesional')
        const formattedName = nameParam.replace(/-/g, ' ');
        this.championshipName.set(formattedName);

        // Llamamos al servicio para buscar el campeonato en la base de datos
        this.championshipService.getByName(formattedName).subscribe({
          next: (data) => {
            if (data && data.length > 0) {
              // Asignamos el campeonato actual encontrado
              this.championshipService.championshipActual.set(data[0]);
            }
          },
          error: (err) => {
            console.error('Error al buscar el campeonato por nombre', err);
          },
        });
      }
    });
  }
}
