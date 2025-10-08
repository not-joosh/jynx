import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginDto, UserDto } from '@challenge/data';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = 'http://localhost:3000/api/v1/auth';

  constructor(private http: HttpClient) {}

  login(loginData: LoginDto): Observable<{ access_token: string; user: UserDto }> {
    return this.http.post<{ access_token: string; user: UserDto }>(
      `${this.apiUrl}/login`,
      loginData
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getCurrentUser(): UserDto | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}
