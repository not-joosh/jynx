import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const TOKEN_KEY = 'sb_jwt';
const API_BASE = 'http://localhost:3001/api';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private client: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private currentOrgSubject = new BehaviorSubject<Organization | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public currentOrg$ = this.currentOrgSubject.asObservable();

  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(private http: HttpClient) {
    const url = (window as any).env?.SUPABASE_URL || '';
    const anon = (window as any).env?.SUPABASE_ANON_KEY || '';
    this.client = createClient(url, anon, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get currentOrg(): Organization | null {
    return this.currentOrgSubject.value;
  }

  async signInWithPassword(email: string, password: string): Promise<User> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    const accessToken = data.session?.access_token;
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
      
      // Get user from our API
      const user = await this.getUserByEmail(email);
      this.currentUserSubject.next(user);
      return user;
    }
    throw new Error('No access token received');
  }

  async signUpWithPassword(email: string, password: string): Promise<User> {
    const { data, error } = await this.client.auth.signUp({ 
      email, 
      password
    });
    if (error) throw error;
    
    // Check if user needs email confirmation
    if (data.user && !data.session) {
      // User needs to confirm email - create user in our API anyway
      const user = await this.createUser(email, data.user.id);
      this.currentUserSubject.next(user);
      return user;
    }
    
    const accessToken = data.session?.access_token;
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
      
      // Create user in our API
      const user = await this.createUser(email, data.user?.id || '');
      this.currentUserSubject.next(user);
      return user;
    }
    
    // If no session but user exists, still create user in our API
    if (data.user) {
      const user = await this.createUser(email, data.user.id);
      this.currentUserSubject.next(user);
      return user;
    }
    
    throw new Error('Registration failed - no user data received');
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
    localStorage.removeItem(TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.currentOrgSubject.next(null);
  }

  async createUserWithOrganization(
    email: string, 
    supabaseUserId: string, 
    organizationName: string
  ): Promise<{ user: User; organization: Organization }> {
    return this.http.post<{ user: User; organization: Organization }>(
      `${API_BASE}/users/with-organization`,
      { email, supabaseUserId, organizationName }
    ).pipe(
      tap(({ user, organization }) => {
        this.currentUserSubject.next(user);
        this.currentOrgSubject.next(organization);
      })
    ).toPromise() as Promise<{ user: User; organization: Organization }>;
  }

  private async createUser(email: string, supabaseUserId: string): Promise<User> {
    try {
      const response = await this.http.post<User>(`${API_BASE}/users`, { email, supabaseUserId }).toPromise();
      return response as User;
    } catch (error: any) {
      console.error('❌ Create user error:', error);
      console.error('❌ Error status:', error?.status);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error details:', error?.error);
      throw error;
    }
  }

  private async getUserByEmail(email: string): Promise<User> {
    return this.http.get<User>(`${API_BASE}/users/email/${email}`).toPromise() as Promise<User>;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }
}