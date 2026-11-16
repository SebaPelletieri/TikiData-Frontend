import { Component, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { RegisterForm } from '../../components/register-form/register-form';
import { Router } from '@angular/router';
import { RegisterRequest } from '../../models/RegisterRequest';
import { AuthService } from '../../services/auth-service';

@Component({
  imports: [RegisterForm],
  standalone: true,
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  private i18n = inject(TranslocoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  handleRegister(userData: RegisterRequest) {
    this.authService.register(userData).subscribe({
      next: () => {
        alert(this.i18n.translate('ui.registroExitosoYaPuedesIniciarSesion'));
        this.router.navigate(['/login']); // Lo enviamos al login
      },
      error: (err) => {
        console.error('Error al registrar usuario', err);
        alert(this.i18n.translate('ui.huboUnProblemaAlCrearLa'));
      },
    });
  }
}
