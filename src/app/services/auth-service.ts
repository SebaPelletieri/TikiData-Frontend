import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { User } from '../models/User';
import { map, Observable, switchMap, tap, throwError } from 'rxjs';
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

  checkUsernameExists(userName: string): Observable<boolean> {
    return this.http
      .get<any[]>(`${this.apiUrl}/usuarios`)
      .pipe(
        map((users) =>
          users.some((u) => u.username && u.username.toLowerCase() === userName.toLowerCase()),
        ),
      );
  }

  checkEmailExists(email: string): Observable<boolean> {
    return this.http
      .get<any[]>(`${this.apiUrl}/usuarios`)
      .pipe(
        map((users) => users.some((u) => u.email && u.email.toLowerCase() === email.toLowerCase())),
      );
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.http
      .get<any[]>(
        `${this.apiUrl}/usuarios?email=${credentials.email}&password=${credentials.password}`,
      )
      .pipe(
        map((users) => {
          if (!users || users.length === 0) {
            throw new Error('Credenciales inválidas');
          }
          const u = users[0];
          // 🌟 Mapeamos 'name' a 'username' si el registro viejo no lo tiene
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

  register(userData: RegisterRequest | any): Observable<User> {
    return this.checkUsernameExists(userData.username).pipe(
      switchMap((usernameExists) => {
        if (usernameExists) {
          return throwError(() => new Error('El nombre de usuario ya está registrado.'));
        }
        return this.checkEmailExists(userData.email);
      }),
      switchMap((emailExists) => {
        if (emailExists) {
          return throwError(() => new Error('El correo electrónico ya está registrado.'));
        }

        const dataWithRole = {
          ...userData,
          role: userData.role || 'Usuario',
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

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

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
    return this.http.get<any[]>(`${this.apiUrl}/usuarios`).pipe(
      map((users) =>
        users.map((u) => ({
          ...u,
          username: u.username || u.name || 'Usuario', 
        })),
      ),
    );
  }

  updateUserRole(id: number, role: 'Administrador' | 'Usuario'): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/usuarios/${id}`, { role });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`);
  }
}
