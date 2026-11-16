import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { User } from '../../models/User';
import { UserManagementService } from '../../services/user-management-service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList implements OnInit {
  private userManagementService = inject(UserManagementService);
  private i18n = inject(TranslocoService);

  users = signal<User[]>([]);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userManagementService.getAllUsers().subscribe({
      next: (data) => this.users.set(data),
      error: () => this.errorMessage.set(this.i18n.translate('admin.loadUsersError')),
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
      error: () => alert(this.i18n.translate('admin.roleError')),
    });
  }

  deleteUser(id?: number): void {
    if (!id || !confirm(this.i18n.translate('admin.confirmDelete'))) return;

    this.userManagementService.deleteUser(id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u.id !== id));
      },
      error: () => alert(this.i18n.translate('admin.deleteUserError')),
    });
  }
}
