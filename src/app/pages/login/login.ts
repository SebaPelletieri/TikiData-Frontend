import { Component, inject } from '@angular/core';
import { LoginForm } from '../../components/login-form/login-form';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { LoginRequest } from '../../models/Login Request';

@Component({
  imports: [LoginForm],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  handleLogin(credentials: LoginRequest) {
    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login exitoso');
        this.router.navigate(['/']); 
      },
      error: (err) => {
        console.error('Error al iniciar sesión', err);
        alert('Credenciales incorrectas o error en el servidor');
      }
    });
  }
}
