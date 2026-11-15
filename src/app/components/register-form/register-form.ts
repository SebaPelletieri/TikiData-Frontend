import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegisterRequest } from '../../models/RegisterRequest';
import { AuthService } from '../../services/auth-service';
import { emailValidator } from '../../validators/email-validator';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './register-form.css',
  templateUrl: './register-form.html',
})
export class RegisterForm {
  private fb = inject(FormBuilder);
  showPassword = signal(false);
  private emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private authService = inject(AuthService);
  private router = inject(Router);
  serverError = signal<string | null>(null);

  @Output() formSubmit = new EventEmitter<RegisterRequest>();

  registerForm = this.fb.nonNullable.group({
    userName: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, emailValidator]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    if (this.registerForm.valid) {
      this.serverError.set(null);
      const formValue = this.registerForm.getRawValue();

      const data: RegisterRequest = {
        username: formValue.userName,
        email: formValue.email,
        password: formValue.password,
      };

      this.authService.register(data).subscribe({
        next: () => {
          alert('¡Registro exitoso! Ya podés iniciar sesión.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.serverError.set(err.message);
        },
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update((value) => !value);
  }
}
