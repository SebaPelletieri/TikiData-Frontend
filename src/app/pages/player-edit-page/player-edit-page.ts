import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerEdit } from '../../components/player-edit/player-edit';

@Component({
  selector: 'app-player-edit-page',
  standalone: true,
  imports: [CommonModule, PlayerEdit],
  templateUrl: './player-edit-page.html',
  styleUrl: './player-edit-page.css',
})
export class PlayerEditPage {}
