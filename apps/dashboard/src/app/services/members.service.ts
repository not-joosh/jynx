import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  joinedAt?: string;
  joinedVia?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  private apiUrl = `${environment.apiUrl}/members`;

  constructor(private http: HttpClient) {}

  getOrganizationMembers(): Observable<Member[]> {
    return this.http.get<Member[]>(this.apiUrl);
  }
}
