import { Component, inject, OnInit } from '@angular/core';
import { MatchService } from '../../services/match-service';
import { MatchCard } from '../match-card/match-card';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule, MatchCard],
  selector: 'app-match-list',
  styleUrl: './match-list.css',
  templateUrl: './match-list.html',
})
export class MatchList implements OnInit {
  public matchService = inject(MatchService);

  ngOnInit(): void {
    this.matchService.getAll();
  }}
