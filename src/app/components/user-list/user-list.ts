import { Component, inject, OnInit, signal } from '@angular/core';
import { User } from '../../models/User';
import { UserManagementService } from '../../services/user-management-service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList implements OnInit {
  private userManagementService = inject(UserManagementService);

  users = signal<User[]>([]);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userManagementService.getAllUsers().subscribe({
      next: (data) => this.users.set(data),
      error: () => this.errorMessage.set('Error al cargar los usuarios del sistema.'),
    });
  }

  toggleRole(user: User): void {
    if (!user.id) return;
    const newRole = user.role === 'Administrador' ? 'Usuario' : 'Administrador';

    this.userManagementService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        this.users.update((list) =>
          list.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
        );
      },
      error: () => alert('No se pudo actualizar el rol.'),
    });
  }

  deleteUser(id?: number): void {
    if (!id || !confirm('¿Estás seguro de eliminar este usuario?')) return;

    this.userManagementService.deleteUser(id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u.id !== id));
      },
      error: () => alert('No se pudo eliminar el usuario.'),
    });
  }
}
