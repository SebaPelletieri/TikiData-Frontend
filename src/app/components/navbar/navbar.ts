import { Component, inject, signal, HostListener, computed, OnInit } from '@angular/core';
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
export class Navbar implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);

  isLightMode = signal(false);
  isProfileMenuOpen = signal(false);

  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === 'Administrador';
  });

  // 🌟 Lectura robusta y a prueba de fallos
  userName = computed(() => {
    const user = this.authService.currentUser() as any;
    if (!user) return '';
    return user.username || user.name || user.email?.split('@')[0] || '';
  });

  userInitial = computed(() => {
    const name = this.userName();
    return name ? name.charAt(0).toUpperCase() : '';
  });

  ngOnInit() {
    console.log('Usuario actual en Navbar:', this.authService.currentUser());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.navbar__user-dropdown')) {
      this.closeProfileMenu();
    }
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
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
