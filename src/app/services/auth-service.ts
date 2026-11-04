import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Service, signal } from '@angular/core';
import { User } from '../models/User';
import { map, Observable, tap } from 'rxjs';
import { LoginRequest } from '../models/Login Request';
import { RegisterRequest } from '../models/Register Request';

@Injectable({
  providedIn: 'root'
})export class AuthService {
  [x: string]: any;
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000';
  currentUser = signal<User | null>(null);

  constructor() {
    const storedUser = localStorage.getItem('tiki_user');
    if (storedUser) {
      this.currentUser.set(JSON.parse(storedUser));
    }
  }

  login(credentials: LoginRequest): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios?email=${credentials.email}&password=${credentials.password}`).pipe(
      map((users: string | any[]) => {
        if (users.length === 0) {
          throw new Error('Credenciales inválidas');
        }
        return users[0]; // Retorna el usuario encontrado
      }),
      tap(user => {
        localStorage.setItem('tiki_token', 'fake-jwt-token-123');
        localStorage.setItem('tiki_user', JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  register(userData: RegisterRequest): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/usuarios`, userData);  
}
  

  logout(): void {
    localStorage.removeItem('tiki_token');
    localStorage.removeItem('tiki_user');
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

}

