import { Component, inject, OnInit, signal } from '@angular/core';

import { PlayerList } from '../../components/player-list/player-list';
import { PlayerForm } from '../../components/player-form/player-form';

@Component({
  standalone: true,
  imports: [PlayerList],
  selector: 'app-players',
  styleUrl: './players.css',
  templateUrl: './players.html',
})
export class Players {}
