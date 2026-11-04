import { Component, inject } from '@angular/core';
import { RegisterForm } from '../../components/register-form/register-form';
import { Router } from '@angular/router';
import { RegisterRequest } from '../../models/Register Request';
import { AuthService } from '../../services/auth-service';

@Component({
  imports: [RegisterForm],
  standalone: true,
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  handleRegister(userData: RegisterRequest) {
    this.authService.register(userData).subscribe({
      next: () => {
        alert('¡Registro exitoso! Ya puedes iniciar sesión.');
        this.router.navigate(['/login']); // Lo enviamos al login
      },
      error: (err) => {
        console.error('Error al registrar usuario', err);
        alert('Hubo un problema al crear la cuenta.');
      }
    });
  }
}
