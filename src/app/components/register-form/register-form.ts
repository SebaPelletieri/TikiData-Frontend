import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegisterRequest } from '../../models/Register Request';
import { AuthService } from '../../services/auth-service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-register-form',
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

  registerForm = this.fb.group({
    userName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.registerForm.valid) {
      this.serverError.set(null);
      const data = this.registerForm.value;

      this.authService.register(data).subscribe({
        next: () => {
          alert('¡Registro exitoso! Ya podés iniciar sesión.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.serverError.set(err.message);
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update(value => !value);
  }

  
}
