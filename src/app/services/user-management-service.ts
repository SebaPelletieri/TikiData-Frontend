import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs'; // 👈 Añade map
import { User } from '../models/User';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000';

  // Obtener todos los usuarios del sistema ordenados alfabéticamente por username
  getAllUsers(): Observable<User[]> {
    return this.http
      .get<User[]>(`${this.apiUrl}/usuarios`)
      .pipe(map((users) => users.sort((a, b) => a.username.localeCompare(b.username))));
  }

  // Actualizar rol u otros datos de un usuario
  updateUserRole(id: number, role: 'Administrador' | 'Usuario'): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/usuarios/${id}`, { role });
  }

  // Eliminar usuario
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`);
  }
}
