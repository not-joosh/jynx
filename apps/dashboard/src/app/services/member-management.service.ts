import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UpdateMemberRoleDto {
  role: 'admin' | 'member' | 'viewer';
}

export interface MemberManagementResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class MemberManagementService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Update member role
  updateMemberRole(organizationId: string, userId: string, role: UpdateMemberRoleDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/organizations/${organizationId}/members/${userId}/role`, role);
  }

  // Remove member from organization
  removeMember(organizationId: string, userId: string): Observable<MemberManagementResponse> {
    return this.http.delete<MemberManagementResponse>(`${this.apiUrl}/organizations/${organizationId}/members/${userId}`);
  }

  // Get member details
  getMember(organizationId: string, userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/organizations/${organizationId}/members/${userId}`);
  }
}

