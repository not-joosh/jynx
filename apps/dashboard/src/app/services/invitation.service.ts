import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateInvitationDto, InvitationDto } from '@challenge/data';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Create invitation for an organization
  createInvitation(organizationId: string, invitation: CreateInvitationDto): Observable<InvitationDto> {
    return this.http.post<InvitationDto>(`${this.apiUrl}/organizations/${organizationId}/invitations`, invitation);
  }

  // Get all invitations for an organization
  getInvitations(organizationId: string): Observable<InvitationDto[]> {
    return this.http.get<InvitationDto[]>(`${this.apiUrl}/organizations/${organizationId}/invitations`);
  }

  // Cancel an invitation
  cancelInvitation(organizationId: string, invitationId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/organizations/${organizationId}/invitations/${invitationId}`);
  }

  // Resend an invitation
  resendInvitation(organizationId: string, invitationId: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/organizations/${organizationId}/invitations/${invitationId}/resend`, {});
  }

  // Get invitation by token (for acceptance)
  getInvitationByToken(token: string): Observable<InvitationDto> {
    return this.http.get<InvitationDto>(`${this.apiUrl}/invitations/${token}`);
  }

  // Accept an invitation by ID
  acceptInvitationById(organizationId: string, invitationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/organizations/${organizationId}/invitations/${invitationId}/accept`, {});
  }

  // Decline an invitation by ID
  declineInvitationById(organizationId: string, invitationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/organizations/${organizationId}/invitations/${invitationId}/decline`, {});
  }
}

