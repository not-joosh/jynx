import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AngularAuthService, Permission, Role } from '@challenge/auth/frontend';
import { UserDto } from '@challenge/data';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { NotificationsComponent } from '../../shared/components/notifications/notifications.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationsComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  Permission = Permission;
  Role = Role;

  sidebarCollapsed = false;
  isMobile = false;
  notificationsOpen = false;
  unreadNotifications = 0; // Real count from notification service
  currentUser: UserDto | null = null;
  private userSubscription: Subscription = new Subscription();

  constructor(
    public authService: AngularAuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Get current user immediately
    this.currentUser = this.authService.getCurrentUser();

    // Check if mobile
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());

    // Demo notifications removed - using real notifications only
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
    window.removeEventListener('resize', () => this.checkMobile());
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  closeSidebar(): void {
    if (this.isMobile) {
      this.sidebarCollapsed = true;
    }
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
  }

  closeNotifications(): void {
    this.notificationsOpen = false;
  }

  openInviteModal(): void {
    console.log('Open invite modal');
    // TODO: Implement invite modal
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    return (this.currentUser.firstName?.[0] || '') + (this.currentUser.lastName?.[0] || '');
  }

  getCurrentPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/tasks')) return 'Tasks';
    if (url.includes('/members')) return 'Members';
    if (url.includes('/settings')) return 'Settings';
    if (url.includes('/analytics')) return 'Analytics';
    return 'Dashboard';
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
      this.sidebarCollapsed = true;
    }
  }
}