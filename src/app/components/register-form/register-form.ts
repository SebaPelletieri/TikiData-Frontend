import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RegisterRequest } from '../../models/Register Request';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-register-form',
  styleUrl: './register-form.css',
  templateUrl: './register-form.html',
})
export class RegisterForm {
  private fb = inject(FormBuilder);
  showPassword = signal(false);

  @Output() formSubmit = new EventEmitter<RegisterRequest>();

  registerForm = this.fb.group({
    userName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.registerForm.valid) {
      this.formSubmit.emit(this.registerForm.value as RegisterRequest);
    } else {
      this.registerForm.markAllAsTouched();
    }
  }


  togglePasswordVisibility() {
    this.showPassword.update(value => !value);
  }
}
