import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Player } from '../../models/Player';
import { PlayerService } from '../../services/player-service';
import { LowerCasePipe } from '@angular/common';

@Component({
  standalone: true,
  imports: [RouterLink, LowerCasePipe],
  selector: 'app-players',
  styleUrl: './players.css',
  templateUrl: './players.html',
})
export class Players implements OnInit {
  private playerService = inject(PlayerService);
  jugadores = signal<Player[]>([]);
  ngOnInit(): void {
    this.playerService.getAll().subscribe({
      next: (data) => this.jugadores.set(data),
      error: (err) => console.error('Error al cargar jugadores', err)
    });  }
  
}
