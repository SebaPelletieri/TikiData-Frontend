import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Match } from '../../models/Match';

@Component({
  imports: [CommonModule, RouterLink, DatePipe],
  selector: 'app-match-card',
  styleUrl: './match-card.css',
  templateUrl: './match-card.html',
})
export class MatchCard {
  @Input({ required: true }) match!: Match;
}
