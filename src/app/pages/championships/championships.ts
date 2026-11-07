import { Component, inject, OnInit, signal } from '@angular/core';
import { Championship } from '../../models/Championship';
import { ChampionshipService } from '../../services/championship-service';
import { ChampionshipForm } from '../../components/championship-form/championship-form';
import { ChampionshipList } from '../../components/championship-list/championship-list';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, ChampionshipList, ChampionshipForm],
  selector: 'app-championships',
  styleUrl: './championships.css',
  templateUrl: './championships.html',
})
export class Championships implements OnInit {

  championshipService = inject(ChampionshipService);
  showForm = signal(false);
  ngOnInit(): void {
    this.championshipService.getAll();
  }

  toggleForm() {
    this.showForm.update(val => !val);
  }
}
