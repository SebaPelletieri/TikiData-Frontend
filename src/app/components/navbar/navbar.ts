import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  imports: [RouterLink],
  standalone: true,
  selector: 'app-navbar',
  styleUrls: ['./navbar.css'],
  templateUrl: './navbar.html',
})
export class Navbar {
  authService = inject(AuthService);

  onLogout() {
    this.authService.logout();
  }
}
