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
  templateUrl: './members.component.html'
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
          // Update user's role to match current organization
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              role: this.currentOrganization.role,
              organizationId: this.currentOrganization.id
            };
            this.authService.updateCurrentUser(updatedUser);
          }
          
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
        // Only show pending invitations (filter out accepted, declined, expired)
        this.invitations = invitations.filter(inv => inv.status === 'pending');
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
        
        // Update user's role to match current organization
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            role: org.role,
            organizationId: org.id
          };
          this.authService.updateCurrentUser(updatedUser);
        }
        
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
          `Invitation sent to ${invitation.invitedEmail} for ${this.getRoleDisplayName(invitation.role)} role. They'll receive an email invitation and in-app notification.`,
          { label: 'View Invitations', callback: () => this.scrollToInvitations() }
        );
      },
      error: (error) => {
        console.error('❌ Error sending invitation:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        this.isLoading = false;
        
        const message = error?.error?.message || '';
        
        // Handle different error cases with idempotent UX
        if (message.toLowerCase().includes('already a member')) {
          this.closeInviteModal();
          this.notificationService.info(
            'Already a Member',
            `${this.inviteForm.email} is already part of this organization.`,
            { label: 'View Members', callback: () => this.scrollToMembers() }
          );
          return;
        }
        
        if (message.toLowerCase().includes('pending invitation already exists')) {
          this.closeInviteModal();
          this.notificationService.info(
            'Invitation Already Sent',
            `A pending invitation already exists for ${this.inviteForm.email}.`,
            { label: 'View Invitations', callback: () => this.scrollToInvitations() }
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
  updateMemberRole(member: Member, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newRole = target.value as 'member' | 'admin';
    
    // Don't do anything if role hasn't changed
    if (newRole === member.role) {
      return;
    }
    
    const organizationId = this.currentOrganization?.id;
    if (!organizationId) {
      this.notificationService.error('Error', 'No organization ID found');
      return;
    }

    const action = newRole === 'admin' ? 'promote' : 'demote';
    const actionText = newRole === 'admin' ? 'promoted to Admin' : 'demoted to Member';
    
    const subscription = this.memberManagementService.updateMemberRole(organizationId, member.id, { role: newRole }).subscribe({
      next: () => {
        // Update the member in the local array immediately for instant UI feedback
        const memberIndex = this.members.findIndex(m => m.id === member.id);
        if (memberIndex !== -1) {
          this.members[memberIndex].role = newRole;
          this.filteredMembers = [...this.members]; // Trigger change detection
        }
        
        this.notificationService.success(
          'Role Updated!',
          `${member.firstName} ${member.lastName} has been ${actionText}`,
          { label: 'Refresh', callback: () => this.loadMembers() }
        );
      },
      error: (error) => {
        console.error(`Error ${action}ing member:`, error);
        // Revert the dropdown selection on error
        target.value = member.role;
        
        this.notificationService.error(
          `${action === 'promote' ? 'Promotion' : 'Demotion'} Failed`,
          `Failed to ${action} member. Please try again.`,
          { label: 'Retry', callback: () => this.updateMemberRole(member, event) }
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

  canChangeRole(member: Member): boolean {
    // Only owners can change roles
    // Can only change roles for members and admins (not owners)
    return this.authService.hasRole(Role.OWNER) && member.role !== 'owner';
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
      return member.role === 'member'; // Admins can only remove members
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
      default: return role;
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
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
