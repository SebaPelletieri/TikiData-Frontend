import { Component, inject, OnInit, signal } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { RouterLink } from '@angular/router';
import { Championship } from '../../models/Championship';
import { ChampionshipService } from '../../services/championship-service';

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  standalone: true,
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private championshipService = inject(ChampionshipService);
  campeonatos = signal<Championship[]>([]);

  ngOnInit(): void {
    this.championshipService.getAll().subscribe({
      next: (data) => this.campeonatos.set(data),
      error: (err) => console.error('Error al cargar campeonatos', err)
    });
}
}
