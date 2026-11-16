import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchEdit } from '../../components/match-edit/match-edit';
import { goBackOr } from '../../utils/navigation';

@Component({
  selector: 'app-match-edit-page',
  standalone: true,
  imports: [CommonModule, MatchEdit],
  templateUrl: './match-edit-page.html',
  styleUrl: './match-edit-page.css',
})
export class MatchEditPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  // El id es un string (ej: "UmIrmEemXVk"), no se puede convertir a número
  matchId = signal<string | null>(null);

  ngOnInit() {
    // La URL trae local-vs-visitante-fecha; el resolver de la ruta deja el id en data
    this.route.data.subscribe((data) => {
      const id = data['id'];
      if (id) this.matchId.set(String(id));
    });
  }

  goBack() {
    goBackOr(this.location, this.router);
  }
}