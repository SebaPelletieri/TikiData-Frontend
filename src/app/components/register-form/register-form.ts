import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegisterRequest } from '../../models/RegisterRequest';
import { AuthService, RegisterTakenError } from '../../services/auth-service';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe],
  styleUrl: './register-form.css',
  templateUrl: './register-form.html',
})
export class RegisterForm {
  private i18n = inject(TranslocoService);
  private fb = inject(FormBuilder);
  showPassword = signal(false);
  private emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private authService = inject(AuthService);
  private router = inject(Router);
  /** Error que no es de un campo en particular (ej. sin conexión con el servidor). */
  serverError = signal<string | null>(null);
  isSubmitting = signal(false);

  constructor() {
    // El aviso general desaparece apenas el usuario modifica algún dato
    this.registerForm.valueChanges.subscribe(() => {
      if (this.serverError()) this.serverError.set(null);
    });
  }

  @Output() formSubmit = new EventEmitter<RegisterRequest>();

  registerForm = this.fb.nonNullable.group({
    userName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    if (this.isSubmitting()) return;
    if (this.registerForm.valid) {
      this.serverError.set(null);
      const formValue = this.registerForm.getRawValue();

      // Mapeamos userName a username para que coincida con RegisterRequest
      const data: RegisterRequest = {
        username: formValue.userName,
        email: formValue.email,
        password: formValue.password,
      };

      this.isSubmitting.set(true);
      this.authService.register(data).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          alert(this.i18n.translate('ui.registroExitosoYaPodesIniciarSesion'));
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          if (err instanceof RegisterTakenError) {
            // Se marca el campo como inválido con el error "taken": se pone en rojo,
            // muestra el aviso debajo y, al editarlo, Angular lo vuelve a validar y
            // el aviso desaparece solo
            const controlByField = { username: 'userName', email: 'email' } as const;
            for (const field of err.fields) {
              const control = this.registerForm.get(controlByField[field]);
              control?.setErrors({ ...(control.errors || {}), taken: true });
              control?.markAsTouched();
            }
          } else {
            this.serverError.set(
              'No pudimos crear la cuenta. Revisá tu conexión e intentá de nuevo en unos segundos.',
            );
          }
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
