import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginDto, CreateUserDto, AuthResponseDto, UserDto } from '@challenge/data';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.api.baseUrl;
  private currentUserSubject = new BehaviorSubject<UserDto | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check for existing token on service initialization
    this.loadStoredUser();
  }

  login(loginDto: LoginDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/auth/login`, loginDto)
      .pipe(
        tap(response => {
          this.setToken(response.access_token);
          const user: UserDto = {
            ...response.user,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          this.currentUserSubject.next(user);
        })
      );
  }

  register(createUserDto: CreateUserDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/auth/register`, createUserDto)
      .pipe(
        tap(response => {
          this.setToken(response.access_token);
          const user: UserDto = {
            ...response.user,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          this.currentUserSubject.next(user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('jwt_token', token);
  }

  private loadStoredUser(): void {
    if (this.isAuthenticated()) {
      // In a real app, you might want to fetch user data from the server
      // For now, we'll just check if token exists
      const token = this.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          // You could make an API call here to get full user data
          // For now, we'll create a minimal user object
          this.currentUserSubject.next({
            id: payload.sub,
            email: payload.email,
            firstName: 'User',
            lastName: 'Name',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } catch {
          this.logout();
        }
      }
    }
  }

  getCurrentUser(): UserDto | null {
    return this.currentUserSubject.value;
  }
}
