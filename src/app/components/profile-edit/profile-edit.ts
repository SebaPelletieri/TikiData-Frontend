import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile-edit.html',
  styleUrls: ['./profile-edit.css'],
})
export class ProfileEdit implements OnInit {
  private authService = inject(AuthService) as AuthService;
  private router = inject(Router);
  private fb = inject(FormBuilder);

  showPassword = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  previewAvatar: string | null = null;

  profileForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(4)]],
    avatar: [''],
  });

  ngOnInit() {
    const userValue = (this.authService.currentUser as any)();
    if (userValue) {
      this.profileForm.patchValue({
        username: userValue.username || userValue.name || userValue.userName || '',
        email: userValue.email || '',
        avatar: userValue.avatar || '',
      });
      this.previewAvatar = userValue.avatar || null;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.previewAvatar = result;
        this.profileForm.patchValue({ avatar: result });
      };
      reader.readAsDataURL(file);
    }
  }

  removeAvatar() {
    this.previewAvatar = null;
    this.profileForm.patchValue({ avatar: '' });
  }

  onSave() {
    if (this.profileForm.invalid) return;

    const updatedData = this.profileForm.value;
    if (!updatedData.password) {
      delete updatedData.password;
    }

    const userValue = (this.authService.currentUser as any)();
    if (userValue && userValue.id) {
      this.authService.updateUser(userValue.id, updatedData).subscribe({
        next: () => {
          this.successMessage = '¡Perfil actualizado correctamente!';
          setTimeout(() => {
            this.router.navigate(['/profile']);
          }, 1500);
        },
        error: () => {
          this.errorMessage = 'Hubo un error al actualizar los datos.';
        },
      });
    }
  }
}
