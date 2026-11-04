import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginRequest } from '../../models/Login Request';
import { RouterLink } from '@angular/router';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login-form',
  styleUrl: './login-form.css',
  templateUrl: './login-form.html',
})
export class LoginForm {
  private fb = inject(FormBuilder);
  showPassword = signal(false);
  @Output() formSubmit = new EventEmitter<LoginRequest>();

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.formSubmit.emit(this.loginForm.value as LoginRequest);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update(value => !value);
  }

  
}
