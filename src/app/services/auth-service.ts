import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Service, signal } from '@angular/core';
import { User } from '../models/User';
import { Observable, tap } from 'rxjs';
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
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem('tiki_token', response.token);
        localStorage.setItem('tiki_user', JSON.stringify(response.user));
        
        this.currentUser.set(response.user);
      })
    );
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
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

