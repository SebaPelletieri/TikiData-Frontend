import { Component, inject, OnInit, signal } from '@angular/core';
import { ChampionshipForm } from '../../components/championship-form/championship-form';
import { ChampionshipList } from '../../components/championship-list/championship-list';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, ChampionshipList],
  selector: 'app-championships',
  styleUrl: './championships.css',
  templateUrl: './championships.html',
})
export class Championships{
}
