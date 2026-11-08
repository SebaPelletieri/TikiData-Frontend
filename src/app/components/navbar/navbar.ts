import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  public authService = inject(AuthService);
  private router = inject(Router);
  isLightMode = signal(false);
  isProfileMenuOpen = signal(false);

  // Escucha todos los clics de la página
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Si el clic no fue dentro del contenedor del perfil, cerramos el menú
    if (!target.closest('.navbar__user-dropdown')) {
      this.closeProfileMenu();
    }
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation(); // Evita que el clic del botón dispare el listener global inmediatamente
    this.isProfileMenuOpen.update((open) => !open);
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen.set(false);
  }

  onLogout(): void {
    this.closeProfileMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleTheme() {
    this.isLightMode.update((value) => !value);
    if (this.isLightMode()) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }
}
