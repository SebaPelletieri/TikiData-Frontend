import { Component } from '@angular/core';
import { ChampionshipList } from '../../components/championship-list/championship-list';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, ChampionshipList],
  selector: 'app-championships',
  styleUrl: './championships.css',
  templateUrl: './championships.html', // (O tu templateUrl original)
})
export class Championships {}
