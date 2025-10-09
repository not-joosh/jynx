import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WorkspaceDto {
  id: string;
  name: string;
  description: string;
  role: string;
  memberCount: number;
  isCurrent: boolean;
  joinedAt: string;
}

export interface SwitchWorkspaceDto {
  organizationId: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Get all workspaces (organizations) for the current user
  getUserWorkspaces(): Observable<WorkspaceDto[]> {
    return this.http.get<WorkspaceDto[]>(`${this.apiUrl}/users/workspaces`);
  }

  // Switch to a different workspace
  switchWorkspace(organizationId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/workspaces/switch`, {
      organizationId
    });
  }
}
