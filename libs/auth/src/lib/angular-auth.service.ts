import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginDto, CreateUserDto, AuthResponseDto, UserDto } from '@challenge/data';
import { Role, Permission, hasPermission } from './permissions';

@Injectable({
  providedIn: 'root'
})
export class AngularAuthService {
  private apiUrl = 'http://localhost:3000/api/v1'; // TODO: Move to environment
  private currentUserSubject = new BehaviorSubject<UserDto | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
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

  resendConfirmation(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/resend-confirmation`, { email });
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
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

  setToken(token: string): void {
    localStorage.setItem('jwt_token', token);
  }

  setCurrentUser(user: UserDto): void {
    this.currentUserSubject.next(user);
  }

  private loadStoredUser(): void {
    if (this.isAuthenticated()) {
      const token = this.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
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

  /**
   * Simple permission check using the modular function
   */
  hasPermission(permission: Permission, resourceOwnerId?: string): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    
    const userRole = (currentUser as any).role || Role.VIEWER;
    return hasPermission(userRole, permission, resourceOwnerId);
  }

  /**
   * Check if current user has role
   */
  hasRole(role: Role): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    
    const userRole = (currentUser as any).role || Role.VIEWER;
    return userRole === role;
  }
}
