import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { User, Role } from '../models/User';
import { map, Observable, switchMap, tap, throwError } from 'rxjs';
import { LoginRequest } from '../models/LoginRequest';
import { RegisterRequest } from '../models/RegisterRequest';

export type RegisterTakenField = 'username' | 'email';

/** Error de registro cuando el nombre de usuario y/o el correo ya están en uso. */
export class RegisterTakenError extends Error {
  constructor(public readonly fields: RegisterTakenField[]) {
    super('El nombre de usuario o el correo ya están registrados.');
    this.name = 'RegisterTakenError';
  }
}

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
      } catch {
        localStorage.removeItem('tiki_user');
      }
    }
  }

  checkUsernameExists(userName: string): Observable<boolean> {
    return this.http
      .get<User[]>(`${this.apiUrl}/usuarios`)
      .pipe(
        map((users) =>
          users.some((u) => u.username && u.username.toLowerCase() === userName.toLowerCase()),
        ),
      );
  }

  checkEmailExists(email: string): Observable<boolean> {
    return this.http
      .get<User[]>(`${this.apiUrl}/usuarios`)
      .pipe(
        map((users) => users.some((u) => u.email && u.email.toLowerCase() === email.toLowerCase())),
      );
  }

  login(credentials: LoginRequest): Observable<User> {
    // HttpParams codifica los valores: sin esto, un "+" o "&" en el correo o la
    // contraseña rompía la consulta y parecía que la cuenta no existía
    const params = new HttpParams()
      .set('email', credentials.email)
      .set('password', credentials.password);

    return this.http
      .get<any[]>(`${this.apiUrl}/usuarios`, { params })
      .pipe(
        map((users) => {
          if (!users || users.length === 0) {
            throw new Error('Credenciales inválidas');
          }
          const u = users[0];
          const normalizedUser: User = {
            ...u,
            username: u.username || u.name || 'Usuario',
          };
          return normalizedUser;
        }),
        tap((user) => {
          localStorage.setItem('tiki_token', 'fake-jwt-token-123');
          localStorage.setItem('tiki_user', JSON.stringify(user));
          this.currentUser.set(user);
        }),
      );
  }

  register(userData: RegisterRequest): Observable<User> {
    // Se revisan usuario y correo juntos (una sola consulta) para poder avisar
    // de los dos a la vez si ambos ya están en uso
    return this.http.get<User[]>(`${this.apiUrl}/usuarios`).pipe(
      switchMap((users) => {
        const username = userData.username.trim().toLowerCase();
        const email = userData.email.trim().toLowerCase();
        const takenFields: RegisterTakenField[] = [];
        if (users.some((u) => u.username?.toLowerCase() === username)) takenFields.push('username');
        if (users.some((u) => u.email?.toLowerCase() === email)) takenFields.push('email');

        if (takenFields.length) {
          return throwError(() => new RegisterTakenError(takenFields));
        }

        const dataWithRole = {
          ...userData,
          role: 'Usuario' as Role,
          favoriteTeams: [],
          favoritePlayers: [],
          favoriteChampionships: [],
          createdAt: new Date().toISOString(),
        };

        return this.http.post<User>(`${this.apiUrl}/usuarios`, dataWithRole);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem('tiki_token');
    localStorage.removeItem('tiki_user');
    this.currentUser.set(null);
  }

  /** Reemplaza el usuario de la sesión con la versión del servidor (ej. cambió su rol). */
  syncCurrentUser(user: User): void {
    localStorage.setItem('tiki_user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  updateUser(id: number | string, updatedData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/usuarios/${id}`, updatedData).pipe(
      tap((user) => {
        const fullUser = { ...this.currentUser(), ...user } as User;
        if (String(this.currentUser()?.id) === String(id)) {       
             localStorage.setItem('tiki_user', JSON.stringify(fullUser));
          this.currentUser.set(fullUser);
        }
      }),
    );
  }

  getUserById(id: number | string): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/usuarios/${id}`).pipe(
      map((u) => ({
        ...u,
        username: u.username || u.name || 'Usuario',
      })),
    );
  }

  // ==========================================
  // MÉTODOS ADMINISTRATIVOS AGREGADOS
  // ==========================================

  // Obtener todos los usuarios normalizados para el dashboard
  getAllUsers(): Observable<User[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios`).pipe(
      map((users) =>
        users.map((u) => ({
          ...u,
          username: u.username || u.name || 'Usuario',
        })),
      ),
    );
  }

  // Actualizar específicamente el rol de un usuario
  updateUserRole(id: number | string, role: 'Administrador' | 'Usuario'): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/usuarios/${id}`, { role });
  }

  // Eliminar un usuario del sistema por su ID
  deleteUser(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/usuarios/${id}`);
  }
}
