import { Component, inject, OnInit, signal } from '@angular/core';
import { Championship } from '../../models/Championship';
import { ChampionshipService } from '../../services/championship-service';
import { ChampionshipForm } from '../../components/championship-form/championship-form';

@Component({
  imports: [ChampionshipForm],
  selector: 'app-championships',
  styleUrl: './championships.css',
  templateUrl: './championships.html',
})
export class Championships  {
}
