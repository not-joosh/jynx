import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AngularAuthService, Permission, Role } from '@challenge/auth/frontend';
import { MembersService, Member } from '../../services/members.service';
import { InvitationService } from '../../services/invitation.service';
import { NotificationService } from '../../services/notification.service';
import { MemberManagementService } from '../../services/member-management.service';
import { WorkspaceService, WorkspaceDto } from '../../services/workspace.service';
import { UserLookupService } from '../../services/user-lookup.service';
import { CreateInvitationDto, InvitationDto } from '@challenge/data';

interface Organization {
  id: string;
  name: string;
  role: string;
}

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Team Members</h1>
            <p class="text-gray-600 mt-1">Manage your organization members and invitations</p>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- Organization Switcher -->
            <div class="relative">
              <button 
                (click)="showOrganizationDropdown = !showOrganizationDropdown"
                class="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {{ (currentOrganization?.name || 'O').charAt(0) }}
                </div>
                <div class="text-left">
                  <p class="text-sm font-medium text-gray-900">{{ currentOrganization?.name || 'Select Organization' }}</p>
                  <p class="text-xs text-gray-500 capitalize">{{ currentOrganization?.role || '' }}</p>
                </div>
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              <!-- Dropdown -->
              <div *ngIf="showOrganizationDropdown" 
                   class="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                <div class="p-2">
                  <div *ngFor="let org of organizations" 
                       (click)="switchOrganization(org)"
                       class="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {{ org.name.charAt(0) }}
                    </div>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-900">{{ org.name }}</p>
                      <p class="text-xs text-gray-500 capitalize">{{ org.role }}</p>
                    </div>
                    <div *ngIf="currentOrganization?.id === org.id" class="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Invite Button -->
            <button 
              *ngIf="canInviteMembers()"
              (click)="openInviteModal()"
              class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span>Invite Member</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="p-3 bg-blue-100 rounded-lg">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Members</p>
              <p class="text-2xl font-bold text-gray-900">{{ members.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="p-3 bg-yellow-100 rounded-lg">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Pending Invitations</p>
              <p class="text-2xl font-bold text-gray-900">{{ pendingInvitations }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="p-3 bg-green-100 rounded-lg">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Active Members</p>
              <p class="text-2xl font-bold text-gray-900">{{ activeMembers }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Members List -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200" data-section="members">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Current Members</h2>
            
            <!-- Search Box -->
            <div class="relative">
              <input 
                type="text"
                [(ngModel)]="searchQuery"
                (input)="filterMembers()"
                placeholder="Search members..."
                class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-64">
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div class="divide-y divide-gray-200">
          <div *ngFor="let member of filteredMembers" class="p-6 hover:bg-gray-50 transition-colors">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <!-- Avatar -->
                <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                  {{ member.firstName.charAt(0) || 'U' }}{{ member.lastName.charAt(0) || '' }}
                </div>
                
                <!-- Member Info -->
                <div>
                  <h3 class="text-lg font-medium text-gray-900">{{ member.firstName }} {{ member.lastName }}</h3>
                  <p class="text-sm text-gray-600">{{ member.email }}</p>
                </div>
              </div>
              
              <!-- Role Badge -->
              <div class="flex items-center space-x-3">
                <span class="px-3 py-1 rounded-full text-xs font-medium"
                      [class]="getRoleBadgeClass(member.role)">
                  {{ getRoleDisplayName(member.role) }}
                </span>
                
                <!-- Actions -->
                <div class="flex items-center space-x-2">
                  <!-- Promote to Admin (Owner only) -->
                  <button 
                    *ngIf="canPromoteToAdmin(member)"
                    (click)="promoteToAdmin(member)"
                    class="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Promote to Admin">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path>
                    </svg>
                  </button>
                  
                  <!-- Demote from Admin (Owner only) -->
                  <button 
                    *ngIf="canDemoteFromAdmin(member)"
                    (click)="demoteFromAdmin(member)"
                    class="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Demote to Member">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"></path>
                    </svg>
                  </button>
                  
                  <!-- Remove Member -->
                  <button 
                    *ngIf="canRemoveMember(member)"
                    (click)="removeMember(member)"
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove member">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Invitations -->
      <div *ngIf="invitations.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200" data-section="invitations">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Pending Invitations</h2>
        </div>
        
        <div class="divide-y divide-gray-200">
          <div *ngFor="let invitation of invitations" class="p-6 hover:bg-gray-50 transition-colors">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <!-- Avatar -->
                <div class="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                  {{ invitation.invitedEmail.charAt(0).toUpperCase() }}
                </div>
                
                <!-- Invitation Info -->
                <div>
                  <h3 class="text-lg font-medium text-gray-900">{{ invitation.invitedEmail }}</h3>
                  <p class="text-sm text-gray-600">Invited by {{ invitation.inviter.firstName }} {{ invitation.inviter.lastName }}</p>
                  <p class="text-xs text-gray-500">Expires {{ formatDate(invitation.expiresAt) }}</p>
                </div>
              </div>
              
              <!-- Status and Actions -->
              <div class="flex items-center space-x-3">
                <span class="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {{ invitation.status }}
                </span>
                
                <div class="flex items-center space-x-2">
                  <button 
                    (click)="resendInvitation(invitation)"
                    class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Resend invitation">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                  </button>
                  
                  <button 
                    (click)="cancelInvitation(invitation)"
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Cancel invitation">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Invite Modal -->
    <div *ngIf="showInviteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" (click)="closeInviteModal()">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-bold text-gray-900">Invite Team Member</h3>
          <p class="text-sm text-gray-600 mt-1">Send an invitation to join your organization</p>
        </div>

        <!-- Form -->
        <form (ngSubmit)="sendInvitation()" class="p-6 space-y-4">
          <!-- Email -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
            <input type="email"
                   [(ngModel)]="inviteForm.email"
                   name="email"
                   placeholder="colleague@company.com"
                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                   required>
          </div>

          <!-- Role -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Role</label>
            <select [(ngModel)]="inviteForm.role"
                    name="role"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
              <option value="member">Member - Can create and edit tasks</option>
              <option value="admin">Admin - Can manage members and settings</option>
              <option value="viewer">Viewer - Read-only access</option>
            </select>
          </div>

          <!-- Message -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Personal Message (Optional)</label>
            <textarea [(ngModel)]="inviteForm.message"
                      name="message"
                      placeholder="Add a personal note..."
                      rows="3"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"></textarea>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end space-x-3 pt-4">
            <button type="button" 
                    (click)="closeInviteModal()"
                    class="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
              Cancel
            </button>
            <button type="submit"
                    [disabled]="!inviteForm.email.trim() || isLoading"
                    class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2">
              <svg *ngIf="isLoading" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>{{ isLoading ? 'Sending...' : 'Send Invitation' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class MembersComponent implements OnInit, OnDestroy {
  members: Member[] = [];
  filteredMembers: Member[] = [];
  invitations: InvitationDto[] = [];
  organizations: WorkspaceDto[] = [];
  currentOrganization: WorkspaceDto | null = null;
  showInviteModal = false;
  showOrganizationDropdown = false;
  isLoading = false;
  searchQuery = '';
  userLookupResult: any = null;
  isLookingUpUser = false;
  
  // Make Permission enum available in template
  Permission = Permission;
  
  inviteForm: CreateInvitationDto = {
    email: '',
    role: 'member',
    message: ''
  };

  private subscriptions: Subscription = new Subscription();

  constructor(
    public authService: AngularAuthService,
    private membersService: MembersService,
    private invitationService: InvitationService,
    private notificationService: NotificationService,
    private memberManagementService: MemberManagementService,
    private workspaceService: WorkspaceService,
    private userLookupService: UserLookupService
  ) {}

  ngOnInit(): void {
    this.loadOrganizations();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Data loading
  loadOrganizations(): void {
    const subscription = this.workspaceService.getUserWorkspaces().subscribe({
      next: (workspaces: WorkspaceDto[]) => {
        this.organizations = workspaces;
        // Set current organization to the one marked as current
        this.currentOrganization = workspaces.find(w => w.isCurrent) || workspaces[0] || null;
        
        if (this.currentOrganization) {
          // Load members and invitations for the current organization
          this.loadMembers();
          this.loadInvitations();
        }
      },
      error: (error) => {
        console.error('Error loading organizations:', error);
        this.notificationService.error(
          'Failed to Load Organizations',
          'Could not load your organizations. Please refresh the page.',
          { label: 'Retry', callback: () => this.loadOrganizations() }
        );
      }
    });
    this.subscriptions.add(subscription);
  }

  loadMembers(): void {
    if (!this.currentOrganization) return;
    
    const subscription = this.membersService.getOrganizationMembers().subscribe({
      next: (members: Member[]) => {
        this.members = members;
        this.filteredMembers = [...members];
      },
      error: (error) => {
        console.error('Error loading members:', error);
      }
    });
    this.subscriptions.add(subscription);
  }

  loadInvitations(): void {
    const organizationId = this.getCurrentOrganizationId();
    if (!organizationId) {
      console.error('No organization ID found');
      return;
    }
    
    const subscription = this.invitationService.getInvitations(organizationId).subscribe({
      next: (invitations: InvitationDto[]) => {
        this.invitations = invitations;
      },
      error: (error) => {
        console.error('Error loading invitations:', error);
      }
    });
    this.subscriptions.add(subscription);
  }

  // Organization switching
  switchOrganization(org: WorkspaceDto): void {
    this.showOrganizationDropdown = false;
    
    // If already the current organization, do nothing
    if (this.currentOrganization?.id === org.id) {
      return;
    }
    
    // Switch workspace via API
    const subscription = this.workspaceService.switchWorkspace(org.id).subscribe({
      next: () => {
        this.currentOrganization = org;
        this.loadMembers();
        this.loadInvitations();
        
        this.notificationService.success(
          'Workspace Switched!',
          `Switched to ${org.name}`,
          { label: 'View Members', callback: () => this.scrollToMembers() }
        );
      },
      error: (error) => {
        console.error('Error switching workspace:', error);
        this.notificationService.error(
          'Switch Failed',
          'Failed to switch workspace. Please try again.',
          { label: 'Retry', callback: () => this.switchOrganization(org) }
        );
      }
    });
    this.subscriptions.add(subscription);
  }

  // Modal management
  openInviteModal(): void {
    this.inviteForm = {
      email: '',
      role: 'member',
      message: ''
    };
    this.userLookupResult = null;
    this.isLookingUpUser = false;
    this.showInviteModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeInviteModal(): void {
    this.showInviteModal = false;
    document.body.style.overflow = 'auto';
  }

  // Invitation actions
  sendInvitation(): void {
    console.log('🚀 Starting invitation process...');
    console.log('📧 Email:', this.inviteForm.email);
    console.log('🏢 Current organization:', this.currentOrganization);
    
    if (!this.inviteForm.email.trim()) {
      console.log('❌ No email provided');
      return;
    }

    this.isLoading = true;
    const organizationId = this.currentOrganization?.id;
    if (!organizationId) {
      console.error('❌ No organization ID found');
      this.isLoading = false;
      this.notificationService.error('Error', 'No organization selected. Please select an organization first.');
      return;
    }
    
    console.log('📤 Sending invitation to API...');
    console.log('🏢 Organization ID:', organizationId);
    console.log('📝 Invite form:', this.inviteForm);
    
    const subscription = this.invitationService.createInvitation(organizationId, this.inviteForm).subscribe({
      next: (invitation: InvitationDto) => {
        console.log('✅ Invitation created successfully:', invitation);
        this.invitations.unshift(invitation);
        this.closeInviteModal();
        this.isLoading = false;
        
        // Show success notification
        this.notificationService.success(
          'Invitation Sent!',
          `Invitation sent to ${invitation.invitedEmail} for ${this.getRoleDisplayName(invitation.role)} role. They'll receive an email invitation.`,
          { label: 'View Invitations', callback: () => this.scrollToInvitations() }
        );
      },
      error: (error) => {
        console.error('❌ Error sending invitation:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        this.isLoading = false;
        
        const message = error?.error?.message || '';
        // If already a member of THIS org, treat as a no-op success for UX
        if (message.toLowerCase().includes('already a member')) {
          this.closeInviteModal();
          this.notificationService.info(
            'Already a Member',
            `${this.inviteForm.email} is already part of this organization.`,
            { label: 'View Members', callback: () => this.scrollToMembers() }
          );
          return;
        }

        // Otherwise, show error
        this.notificationService.error(
          'Invitation Failed',
          message || 'Failed to send invitation. Please try again.',
          { label: 'Retry', callback: () => this.openInviteModal() }
        );
      }
    });
    this.subscriptions.add(subscription);
  }

  resendInvitation(invitation: InvitationDto): void {
    const organizationId = this.currentOrganization?.id;
    if (!organizationId) {
      console.error('No organization ID found');
      return;
    }
    
    const subscription = this.invitationService.resendInvitation(organizationId, invitation.id).subscribe({
      next: () => {
        console.log('Invitation resent successfully');
      },
      error: (error) => {
        console.error('Error resending invitation:', error);
      }
    });
    this.subscriptions.add(subscription);
  }

  cancelInvitation(invitation: InvitationDto): void {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;
    
    const organizationId = this.currentOrganization?.id;
    if (!organizationId) {
      console.error('No organization ID found');
      return;
    }
    
    const subscription = this.invitationService.cancelInvitation(organizationId, invitation.id).subscribe({
      next: () => {
        this.invitations = this.invitations.filter(inv => inv.id !== invitation.id);
      },
      error: (error) => {
        console.error('Error canceling invitation:', error);
      }
    });
    this.subscriptions.add(subscription);
  }

  // Member actions
  promoteToAdmin(member: Member): void {
    if (!confirm(`Are you sure you want to promote ${member.firstName} ${member.lastName} to Admin?`)) return;
    
    const organizationId = this.currentOrganization?.id;
    if (!organizationId) {
      this.notificationService.error('Error', 'No organization ID found');
      return;
    }

    const subscription = this.memberManagementService.updateMemberRole(organizationId, member.id, { role: 'admin' }).subscribe({
      next: () => {
        this.notificationService.success(
          'Member Promoted!',
          `${member.firstName} ${member.lastName} has been promoted to Admin`,
          { label: 'Refresh', callback: () => this.loadMembers() }
        );
      },
      error: (error) => {
        console.error('Error promoting member:', error);
        this.notificationService.error(
          'Promotion Failed',
          'Failed to promote member. Please try again.',
          { label: 'Retry', callback: () => this.promoteToAdmin(member) }
        );
      }
    });
    this.subscriptions.add(subscription);
  }

  demoteFromAdmin(member: Member): void {
    if (!confirm(`Are you sure you want to demote ${member.firstName} ${member.lastName} to Member?`)) return;
    
    const organizationId = this.currentOrganization?.id;
    if (!organizationId) {
      this.notificationService.error('Error', 'No organization ID found');
      return;
    }

    const subscription = this.memberManagementService.updateMemberRole(organizationId, member.id, { role: 'member' }).subscribe({
      next: () => {
        this.notificationService.success(
          'Member Demoted!',
          `${member.firstName} ${member.lastName} has been demoted to Member`,
          { label: 'Refresh', callback: () => this.loadMembers() }
        );
      },
      error: (error) => {
        console.error('Error demoting member:', error);
        this.notificationService.error(
          'Demotion Failed',
          'Failed to demote member. Please try again.',
          { label: 'Retry', callback: () => this.demoteFromAdmin(member) }
        );
      }
    });
    this.subscriptions.add(subscription);
  }

  removeMember(member: Member): void {
    if (!confirm(`Are you sure you want to remove ${member.firstName} ${member.lastName} from the organization?`)) return;
    
    const organizationId = this.currentOrganization?.id;
    if (!organizationId) {
      this.notificationService.error('Error', 'No organization ID found');
      return;
    }

    const subscription = this.memberManagementService.removeMember(organizationId, member.id).subscribe({
      next: () => {
        this.notificationService.success(
          'Member Removed!',
          `${member.firstName} ${member.lastName} has been removed from the organization`,
          { label: 'Refresh', callback: () => this.loadMembers() }
        );
      },
      error: (error) => {
        console.error('Error removing member:', error);
        this.notificationService.error(
          'Removal Failed',
          'Failed to remove member. Please try again.',
          { label: 'Retry', callback: () => this.removeMember(member) }
        );
      }
    });
    this.subscriptions.add(subscription);
  }

  // Permission checks
  canInviteMembers(): boolean {
    // Owners and admins can invite members
    return this.authService.hasRole(Role.OWNER) || this.authService.hasRole(Role.ADMIN);
  }

  canPromoteToAdmin(member: Member): boolean {
    // Only owners can promote members to admin
    // Can only promote members (not admins or owners)
    return this.authService.hasRole(Role.OWNER) && member.role === 'member';
  }

  canDemoteFromAdmin(member: Member): boolean {
    // Only owners can demote admins to members
    // Can only demote admins (not owners or members)
    return this.authService.hasRole(Role.OWNER) && member.role === 'admin';
  }

  canRemoveMember(member: Member): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Prevent users from removing themselves
    if (member.id === currentUser.id) {
      return false;
    }
    
    // Only owners can remove members (including admins)
    // Admins can remove members but not other admins or owners
    if (this.authService.hasRole(Role.OWNER)) {
      return true; // Owners can remove anyone except themselves
    }
    if (this.authService.hasRole(Role.ADMIN)) {
      return member.role === 'member' || member.role === 'viewer'; // Admins can only remove members/viewers
    }
    return false;
  }

  // Helper methods
  get computedStats() {
    return {
      pendingInvitations: this.invitations.filter(inv => inv.status === 'pending').length,
      activeMembers: this.members.length
    };
  }

  get pendingInvitations(): number {
    return this.invitations.filter(inv => inv.status === 'pending').length;
  }

  get activeMembers(): number {
    return this.members.length;
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'owner': return 'Owner';
      case 'admin': return 'Admin';
      case 'member': return 'Member';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString();
  }

  // Search functionality
  filterMembers(): void {
    if (!this.searchQuery.trim()) {
      this.filteredMembers = [...this.members];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredMembers = this.members.filter(member => 
      member.firstName.toLowerCase().includes(query) ||
      member.lastName.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query)
    );
  }

  // Helper method to scroll to members section
  scrollToMembers(): void {
    const membersElement = document.querySelector('[data-section="members"]');
    if (membersElement) {
      membersElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Helper method to scroll to invitations section
  scrollToInvitations(): void {
    const invitationsElement = document.querySelector('[data-section="invitations"]');
    if (invitationsElement) {
      invitationsElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Helper method to get organization ID from JWT token
  private getCurrentOrganizationId(): string | null {
    const token = this.authService.getToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.organizationId || null;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }
}
