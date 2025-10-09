import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserLookupDto {
  email: string;
}

export interface UserLookupResponse {
  found: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserLookupService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Look up a user by email
  lookupUser(email: string): Observable<UserLookupResponse> {
    return this.http.post<UserLookupResponse>(`${this.apiUrl}/users/lookup`, { email });
  }
}
