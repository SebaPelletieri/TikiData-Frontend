import { Component, inject, OnInit } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { compressImage } from '../../utils/image';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './profile-edit.html',
  styleUrls: ['./profile-edit.css'],
})
export class ProfileEdit implements OnInit {
  private i18n = inject(TranslocoService);
  private authService = inject(AuthService) as AuthService;
  private router = inject(Router);
  private fb = inject(FormBuilder);

  showPassword = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  previewAvatar: string | null = null;
  avatarError: string | null = null;
  isProcessingAvatar = false;

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

  /**
   * La foto se achica y comprime antes de guardarla: json-server se cae con pedidos de
   * más de 100 KB y una foto de celular en base64 pesa varios MB.
   */
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.avatarError = null;
    this.isProcessingAvatar = true;
    try {
      const compressed = await compressImage(file);
      this.previewAvatar = compressed;
      this.profileForm.patchValue({ avatar: compressed });
      this.profileForm.markAsDirty();
    } catch (err) {
      this.avatarError = err instanceof Error ? err.message : this.i18n.translate('ui.noSePudoCargarLaImagen');
      input.value = '';
    } finally {
      this.isProcessingAvatar = false;
    }
  }

  removeAvatar() {
    this.previewAvatar = null;
    this.profileForm.patchValue({ avatar: '' });
  }

  onSave() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const updatedData = { ...this.profileForm.value };
    if (!updatedData.password) {
      delete updatedData.password;
    }

    const userValue = (this.authService.currentUser as any)();
    if (userValue && userValue.id) {
      this.authService.updateUser(userValue.id, updatedData).subscribe({
        next: () => {
          this.successMessage = this.i18n.translate('ui.perfilActualizadoCorrectamente');
          setTimeout(() => {
            this.router.navigate(['/profile']);
          }, 1500);
        },
        error: () => {
          this.errorMessage = this.i18n.translate('ui.huboUnErrorAlActualizarLos');
        },
      });
    }
  }
}
