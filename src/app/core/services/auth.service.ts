import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  skills?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'https://elms-backend-api.onrender.com/api/auth';
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('elms_user');
    if (stored) this.currentUser.set(JSON.parse(stored));
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.API}/register`, data).pipe(
      tap((res: any) => this.handleAuth(res))
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.API}/login`, { email, password }).pipe(
      tap((res: any) => this.handleAuth(res))
    );
  }

  private handleAuth(res: any) {
    localStorage.setItem('elms_token', res.token);
    localStorage.setItem('elms_user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  logout() {
    localStorage.removeItem('elms_token');
    localStorage.removeItem('elms_user');
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('elms_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUser(): User | null {
    return this.currentUser();
  }
}
