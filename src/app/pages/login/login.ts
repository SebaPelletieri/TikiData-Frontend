import { Component, inject, signal } from '@angular/core';
import { LoginForm } from '../../components/login-form/login-form';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
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

  /** Mensaje de error que se muestra dentro del formulario (en lugar de un alert). */
  loginError = signal<string | null>(null);
  isSubmitting = signal(false);

  handleLogin(credentials: LoginRequest) {
    this.loginError.set(null);
    this.isSubmitting.set(true);

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        // Si se llegó al login desde otra página (ej. al tocar "Seguir"), se vuelve a ella
        const returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        // Error de conexión con el servidor vs. datos que no coinciden con ninguna cuenta
        this.loginError.set(
          err instanceof HttpErrorResponse
            ? 'No pudimos conectarnos con el servidor. Intentá de nuevo en unos segundos.'
            : 'No encontramos una cuenta con ese correo y contraseña. Revisá los datos e intentá de nuevo.',
        );
      },
    });
  }
}
