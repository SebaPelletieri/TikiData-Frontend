import { Component, inject, OnInit, signal } from '@angular/core';
import { ProfileDetail } from '../../components/profile-detail/profile-detail';

@Component({
  imports: [ProfileDetail],
  standalone: true,
  selector: 'app-player-detail',
  styleUrl: './player-detail.css',
  templateUrl: './player-detail.html',
})
export class PlayerDetail {
  
}
