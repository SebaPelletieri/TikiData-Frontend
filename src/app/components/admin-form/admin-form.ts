import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { User } from '../../models/User';

@Component({
  selector: 'app-admin-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-form.html',
  styleUrl: './admin-form.css',
})
export class AdminForm implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  @Input() userIdToEdit: number | null = null;
  @Output() closePanel = new EventEmitter<void>();

  adminForm!: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Variable de estado para mostrar u ocultar la contraseña
  showPassword: boolean = false;

  // Vista previa de la foto de perfil (avatar)
  avatarPreview: string | null = null;

  ngOnInit(): void {
    this.initForm();

    if (this.userIdToEdit) {
      this.isEditMode.set(true);
      this.loadUserData(this.userIdToEdit);
    }
  }

  // Función para alternar la visibilidad de la contraseña
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private initForm(): void {
    this.adminForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.userIdToEdit ? [] : [Validators.required, Validators.minLength(6)]],
      avatar: ['', [Validators.required]],
    });
  }

  private loadUserData(id: number): void {
    this.isLoading.set(true);
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        const user = users.find((u) => u.id === id);
        if (user) {
          this.adminForm.patchValue({
            username: user.username,
            email: user.email,
            avatar: user.avatar || '',
          });
          if (user.avatar) {
            this.avatarPreview = user.avatar;
          }
          this.adminForm.get('password')?.clearValidators();
          this.adminForm.get('password')?.updateValueAndValidity();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar usuario para editar:', err);
        this.errorMessage.set('No se pudo cargar la información del administrador.');
        this.isLoading.set(false);
      },
    });
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        const base64String = reader.result as string;
        this.avatarPreview = base64String;
        this.adminForm.patchValue({ avatar: base64String });
        this.adminForm.get('avatar')?.markAsTouched();
      };

      reader.readAsDataURL(file);
    }
  }

  removeAvatar(event: Event): void {
    event.stopPropagation();
    this.avatarPreview = null;
    this.adminForm.patchValue({ avatar: '' });
    this.adminForm.get('avatar')?.markAsTouched();
  }

  onSubmit(): void {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValues = this.adminForm.value;

    if (this.isEditMode() && this.userIdToEdit) {
      const updateData: Partial<User> = {
        username: formValues.username,
        email: formValues.email,
        role: 'Administrador',
        avatar: formValues.avatar,
      };

      this.authService.updateUser(this.userIdToEdit, updateData).subscribe({
        next: () => {
          this.successMessage.set('Administrador actualizado con éxito.');
          this.isLoading.set(false);
          setTimeout(() => this.closePanel.emit(), 1000);
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          this.errorMessage.set('Ocurrió un error al actualizar los datos.');
          this.isLoading.set(false);
        },
      });
    } else {
      const newUserData = {
        username: formValues.username,
        email: formValues.email,
        password: formValues.password,
        role: 'Administrador',
        avatar: formValues.avatar,
        favoriteTeams: [],
        favoritePlayers: [],
        favoriteChampionships: [],
        createdAt: new Date().toISOString(),
      };

      this.authService.register(newUserData as any).subscribe({
        next: () => {
          this.successMessage.set('Administrador creado con éxito en el sistema.');
          this.isLoading.set(false);
          this.adminForm.reset();
          this.avatarPreview = null;
          setTimeout(() => this.closePanel.emit(), 1000);
        },
        error: (err) => {
          console.error('Error al crear:', err);
          this.errorMessage.set('Ocurrió un error al registrar el administrador.');
          this.isLoading.set(false);
        },
      });
    }
  }

  onCancel(): void {
    this.closePanel.emit();
  }
}
