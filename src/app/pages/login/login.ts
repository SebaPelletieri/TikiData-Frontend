import { Component, inject } from '@angular/core';
import { LoginForm } from '../../components/login-form/login-form';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { LoginRequest } from '../../models/LoginRequest';
import { safeReturnUrl } from '../../utils/auth-redirect';

@Component({
  imports: [LoginForm],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  handleLogin(credentials: LoginRequest) {
    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login exitoso');
        // Si se llegó al login desde otra página (ej. al tocar "Seguir"), se vuelve a ella
        const returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        console.error('Error al iniciar sesión', err);
        alert('Credenciales incorrectas o error en el servidor');
      },
    });
  }
}
