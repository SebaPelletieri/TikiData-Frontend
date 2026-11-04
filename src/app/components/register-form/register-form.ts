import { Component, EventEmitter, inject, Output } from '@angular/core';
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
  
  @Output() formSubmit = new EventEmitter<RegisterRequest>();

  // Usamos userName según tu interfaz
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
}
