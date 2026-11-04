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
  championshipService = inject(ChampionshipService);
  campeonatos = this.championshipService.championships;
  ngOnInit(): void {
    this.championshipService.getAll();
}
}
