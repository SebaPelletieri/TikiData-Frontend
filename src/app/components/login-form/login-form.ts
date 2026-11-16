import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginRequest } from '../../models/LoginRequest';
import { RouterLink } from '@angular/router';

@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe],
  selector: 'app-login-form',
  styleUrl: './login-form.css',
  templateUrl: './login-form.html',
})
export class LoginForm {
  private fb = inject(FormBuilder);
  showPassword = signal(false);

  /** Error del servidor (ej. cuenta no encontrada). Se muestra dentro del formulario. */
  @Input() errorMessage: string | null = null;
  /** Mientras se verifica la cuenta, el botón se deshabilita y muestra "Ingresando...". */
  @Input() isSubmitting = false;

  @Output() formSubmit = new EventEmitter<LoginRequest>();
  /** Avisa que el usuario modificó el correo o la contraseña (para borrar el error). */
  @Output() edited = new EventEmitter<void>();

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    // Apenas el usuario corrige algún dato, el mensaje de error desaparece
    this.loginForm.valueChanges.subscribe(() => {
      if (this.errorMessage) this.edited.emit();
    });
  }

  onSubmit() {
    if (this.isSubmitting) return;
    if (this.loginForm.valid) {
      this.formSubmit.emit(this.loginForm.value as LoginRequest);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update((value) => !value);
  }
}
