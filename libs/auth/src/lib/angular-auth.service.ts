import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginDto, CreateUserDto, AuthResponseDto, UserDto } from '@challenge/data';
import { Role, Permission, hasPermission } from './permissions';

@Injectable({
  providedIn: 'root'
})
export class AngularAuthService {
  private apiUrl = 'http://localhost:3000/api/v1'; 
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
          
          // Extract role from JWT token
          const payload = JSON.parse(atob(response.access_token.split('.')[1]));
          console.log('🔍 Login JWT payload:', payload);
          
          const user: UserDto = {
            ...response.user,
            role: payload.role || 'owner', // Include role from JWT
            organizationId: payload.organizationId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          console.log('🔍 Setting current user:', user);
          this.currentUserSubject.next(user);
        })
      );
  }

  register(createUserDto: CreateUserDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/auth/register`, createUserDto)
      .pipe(
        tap(response => {
          this.setToken(response.access_token);
          
          // Extract role from JWT token
          const payload = JSON.parse(atob(response.access_token.split('.')[1]));
          console.log('🔍 Register JWT payload:', payload);
          
          const user: UserDto = {
            ...response.user,
            role: payload.role || 'owner', // Include role from JWT
            organizationId: payload.organizationId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          console.log('🔍 Setting current user:', user);
          this.currentUserSubject.next(user);
        })
      );
  }

  resendConfirmation(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/resend-confirmation`, { email });
  }

  /**
   * Exchange Supabase confirmation token for our backend JWT with full user data
   */
  confirmEmail(supabaseToken: string): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/auth/confirm`, { 
      supabaseToken
    }).pipe(
      tap(response => {
        this.setToken(response.access_token);
        
        // Extract role from JWT token
        const jwtPayload = JSON.parse(atob(response.access_token.split('.')[1]));
        
        const user: UserDto = {
          ...response.user,
          role: jwtPayload.role || 'owner',
          organizationId: jwtPayload.organizationId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('🔍 Setting current user after confirmation:', user);
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
          console.log('🔍 JWT payload:', payload);
          
          this.currentUserSubject.next({
            id: payload.sub,
            email: payload.email,
            firstName: payload.firstName || 'User',
            lastName: payload.lastName || 'Name',
            role: payload.role || 'owner', // Extract role from JWT
            organizationId: payload.organizationId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } catch (error) {
          console.error('❌ Error parsing JWT token:', error);
          this.logout();
        }
      }
    }
  }

  getCurrentUser(): UserDto | null {
    return this.currentUserSubject.value;
  }

  /**
   * Update the current user (used when switching organizations)
   */
  updateCurrentUser(updatedUser: UserDto): void {
    this.currentUserSubject.next(updatedUser);
  }

  /**
   * Simple permission check using the modular function
   */
  hasPermission(permission: Permission, resourceOwnerId?: string): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      console.log('❌ No current user for permission check');
      return false;
    }
    
    const userRole = (currentUser.role as Role) || Role.MEMBER;
    
    console.log('🔍 Permission check - User role:', userRole, 'Required permission:', permission);
    const hasPerm = hasPermission(userRole, permission, resourceOwnerId);
    console.log('🔍 Permission result:', hasPerm);

    return hasPerm;
  }

  /**
   * Check if current user has role
   */
  hasRole(role: Role): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      console.log('❌ No current user found');
      return false;
    }
    
    console.log('🔍 Current user object:', currentUser);
    console.log('🔍 Looking for role:', role);
    
    const userRole = (currentUser.role as Role) || Role.MEMBER;
    
    console.log('🔍 Detected user role:', userRole);
    
    // Implement role hierarchy: OWNER > ADMIN > MEMBER
    // Higher roles have all permissions of lower roles
    const roleHierarchy = {
      [Role.OWNER]: [Role.OWNER, Role.ADMIN, Role.MEMBER],
      [Role.ADMIN]: [Role.ADMIN, Role.MEMBER],
      [Role.MEMBER]: [Role.MEMBER]
    };
    
    const hasRole = roleHierarchy[userRole]?.includes(role) || false;
    console.log('🔍 Role hierarchy check:', hasRole);
    
    return hasRole;
  }
}
