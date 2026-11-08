import { Component } from '@angular/core';
import { ProfileDetail } from '../../components/profile-detail/profile-detail';

@Component({
  imports: [ProfileDetail],
  selector: 'app-profile',
  styleUrl: './profile.css',
  templateUrl: './profile.html',
})
export class Profile {}
