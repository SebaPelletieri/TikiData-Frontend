import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../services/player-service';
import { LowerCasePipe } from '@angular/common';
import { PlayerFormComponent } from '../../components/player-form/player-form';
import { PlayerList } from '../../components/player-list/player-list';

@Component({
  standalone: true,
  imports: [RouterLink, LowerCasePipe, PlayerFormComponent, PlayerList],
  selector: 'app-players',
  styleUrl: './players.css',
  templateUrl: './players.html',
})
export class Players implements OnInit {
  private playerService = inject(PlayerService);
  jugadores = this.playerService.players;
  showForm = signal(false);
  
  ngOnInit(): void {
    this.playerService.getAll()
  }

  toggleForm() {
    this.showForm.update(val => !val);
  }
  
}
