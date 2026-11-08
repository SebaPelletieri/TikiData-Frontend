import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { User } from '../models/User';
import { map, Observable, tap } from 'rxjs';
import { LoginRequest } from '../models/Login Request';
import { RegisterRequest } from '../models/Register Request';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000';
  currentUser = signal<User | null>(null);

  constructor() {
    const storedUser = localStorage.getItem('tiki_user');
    if (storedUser) {
      try {
        this.currentUser.set(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('tiki_user');
      }
    }
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.http
      .get<User[]>(
        `${this.apiUrl}/usuarios?email=${credentials.email}&password=${credentials.password}`,
      )
      .pipe(
        map((users) => {
          if (!users || users.length === 0) {
            throw new Error('Credenciales inválidas');
          }
          return users[0];
        }),
        tap((user) => {
          localStorage.setItem('tiki_token', 'fake-jwt-token-123');
          localStorage.setItem('tiki_user', JSON.stringify(user));
          this.currentUser.set(user);
        }),
      );
  }

  register(userData: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/usuarios`, userData);
  }

  logout(): void {
    localStorage.removeItem('tiki_token');
    localStorage.removeItem('tiki_user');
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  // Permite actualizar los datos del usuario en json-server y en la señal
  updateUser(id: number, updatedData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/usuarios/${id}`, updatedData).pipe(
      tap((user) => {
        const fullUser = { ...this.currentUser(), ...user };
        localStorage.setItem('tiki_user', JSON.stringify(fullUser));
        this.currentUser.set(fullUser as User);
      }),
    );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/usuarios`);
  }

  // Cambiar el rol de un usuario específico (Administrador / Usuario)
  updateUserRole(id: number, role: 'Administrador' | 'Usuario'): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/usuarios/${id}`, { role });
  }

  // Eliminar un usuario del sistema por su ID
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`);
  }
}
