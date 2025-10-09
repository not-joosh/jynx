import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AngularAuthService } from '@challenge/auth/frontend';

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

  constructor(
    private http: HttpClient,
    private authService: AngularAuthService
  ) {}

  // Get all workspaces (organizations) for the current user
  getUserWorkspaces(): Observable<WorkspaceDto[]> {
    return this.http.get<WorkspaceDto[]>(`${this.apiUrl}/users/workspaces`);
  }

  // Switch to a different workspace
  switchWorkspace(organizationId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/workspaces/switch`, {
      organizationId
    }).pipe(
      tap(response => {
        // Update the user's role in the auth service to reflect their role in the new organization
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          // Find the workspace to get the role
          this.getUserWorkspaces().subscribe(workspaces => {
            const newWorkspace = workspaces.find(w => w.id === organizationId);
            if (newWorkspace) {
              // Update the user's role and organization ID
              const updatedUser = {
                ...currentUser,
                role: newWorkspace.role,
                organizationId: organizationId
              };
              this.authService.updateCurrentUser(updatedUser);
            }
          });
        }
      })
    );
  }
}

