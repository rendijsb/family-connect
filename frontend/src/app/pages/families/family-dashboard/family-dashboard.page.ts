import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonIcon, IonBackButton, IonButtons, IonRefresher, IonRefresherContent, IonBadge,
  IonSpinner, IonSegment, IonSegmentButton, IonLabel, IonAvatar, IonChip, IonFab, IonFabButton,
  IonFabList, PopoverController, AlertController, ToastController
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  homeOutline, peopleOutline, pulseOutline, notificationsOutline, ellipsisVerticalOutline,
  cameraOutline, chatbubbleOutline, calendarOutline, personAddOutline, locationOutline,
  copyOutline, shareOutline, refreshOutline, linkOutline, alertCircleOutline, addOutline,
  ellipsisHorizontalOutline, paperPlaneOutline, closeOutline, cropOutline, shieldOutline,
  personOutline, checkmarkCircleOutline, archiveOutline
} from 'ionicons/icons';
import { FamilyService } from '../../../core/services/families/family.service';
import { FamilyInvitationService } from '../../../core/services/families/family-invitation.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import {
  Family,
  FamilyDashboardData,
  FamilyMember,
  FamilyInvitation,
  FamilyActivity,
  ActivityType
} from '../../../models/families/family.models';
import { Subject, takeUntil, switchMap } from 'rxjs';

@Component({
  selector: 'app-family-dashboard',
  templateUrl: './family-dashboard.page.html',
  styleUrls: ['./family-dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonButton, IonIcon, IonBackButton, IonButtons, IonRefresher, IonRefresherContent, IonBadge,
    IonSpinner, IonSegment, IonSegmentButton, IonLabel, IonAvatar, IonChip, IonFab, IonFabButton,
    IonFabList
  ]
})
export class FamilyDashboardPage implements OnInit, OnDestroy {
  private readonly familyService = inject(FamilyService);
  private readonly invitationService = inject(FamilyInvitationService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly popoverController = inject(PopoverController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly destroy$ = new Subject<void>();

  // State
  selectedTab = signal<string>('overview');
  activityFilter = signal<string>('all');
  familyId = signal<number>(0);
  isLoadingMore = signal<boolean>(false);
  hasMoreActivities = signal<boolean>(true);
  notificationCount = signal<number>(0);
  error = signal<string | null>(null);

  // Data
  family = computed(() => this.familyService.currentFamily());
  isLoading = computed(() => this.familyService.isLoading());
  dashboardData = signal<FamilyDashboardData | null>(null);
  pendingInvitations = signal<FamilyInvitation[]>([]);

  // User context
  currentUser = computed(() => this.authService.user());
  userRole = computed(() => {
    const fam = this.family();
    const user = this.currentUser();
    if (!fam || !user) return 'member';
    return this.familyService.getUserRoleInFamily(fam, user.id) || 'member';
  });

  // Permissions
  canManage = computed(() => {
    const fam = this.family();
    const user = this.currentUser();
    if (!fam || !user) return false;
    return this.familyService.canManageFamily(fam, user.id);
  });

  canInvite = computed(() => {
    const fam = this.family();
    const user = this.currentUser();
    if (!fam || !user) return false;
    return this.canManage() || fam.settings?.privacy?.allowMemberInvites === true;
  });

  canManageMembers = computed(() => this.canManage());

  // Activity filtering
  filteredActivities = computed(() => {
    const activities = this.dashboardData()?.recentActivities || [];
    const filter = this.activityFilter();
    const now = new Date();

    switch (filter) {
      case 'today':
        return activities.filter(activity => {
          const activityDate = new Date(activity.createdAt);
          return activityDate.toDateString() === now.toDateString();
        });
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return activities.filter(activity => {
          const activityDate = new Date(activity.createdAt);
          return activityDate >= weekAgo;
        });
      default:
        return activities;
    }
  });

  constructor() {
    addIcons({
      homeOutline, peopleOutline, pulseOutline, notificationsOutline, ellipsisVerticalOutline,
      cameraOutline, chatbubbleOutline, calendarOutline, personAddOutline, locationOutline,
      copyOutline, shareOutline, refreshOutline, linkOutline, alertCircleOutline, addOutline,
      ellipsisHorizontalOutline, paperPlaneOutline, closeOutline, cropOutline, shieldOutline,
      personOutline, checkmarkCircleOutline, archiveOutline
    });
  }

  ngOnInit() {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const id = parseInt(params['id']);
        this.familyId.set(id);
        return this.familyService.getFamily(id);
      })
    ).subscribe({
      next: () => {
        this.loadDashboardData();
        this.loadPendingInvitations();
      },
      error: (error) => {
        this.error.set('Failed to load family. Please try again.');
        console.error('Error loading family:', error);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Data loading
  private loadDashboardData() {
    const id = this.familyId();
    if (!id) return;

    this.familyService.getFamilyDashboard(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboardData.set(data);
          this.error.set(null);
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
        }
      });
  }

  private loadPendingInvitations() {
    const id = this.familyId();
    if (!id || !this.canManage()) return;

    this.invitationService.getInvitations(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (invitations) => {
          const pending = invitations.filter(inv => inv.status === 'pending');
          this.pendingInvitations.set(pending);
        },
        error: (error) => {
          console.error('Error loading invitations:', error);
        }
      });
  }

  // UI Event Handlers
  onTabChange(event: any) {
    this.selectedTab.set(event.detail.value);
  }

  onActivityFilterChange(event: any) {
    this.activityFilter.set(event.detail.value);
  }

  doRefresh(event: any) {
    this.loadDashboardData();
    this.loadPendingInvitations();

    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  onRetry() {
    this.error.set(null);
    this.loadDashboardData();
  }

  // Navigation
  onViewMembers() {
    this.selectedTab.set('members');
  }

  onViewAllActivity() {
    this.selectedTab.set('activity');
  }

  onViewMemberProfile(member: FamilyMember) {
    this.router.navigate(['/families', this.familyId(), 'members', member.userId]);
  }

  // Family Actions
  onStartChat() {
    this.router.navigate(['/families', this.familyId(), 'chat']);
  }

  onSharePhotos() {
    this.router.navigate(['/families', this.familyId(), 'photos']);
  }

  onCreateEvent() {
    this.router.navigate(['/families', this.familyId(), 'events', 'create']);
  }

  onInviteMembers() {
    this.router.navigate(['/families', this.familyId(), 'invite']);
  }

  onShareLocation() {
    // Implement location sharing
    this.showToast('Location sharing coming soon!', 'primary');
  }

  // Invite Code Actions
  async onCopyInviteCode() {
    const code = this.family()?.inviteCode;
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      this.showToast('Invite code copied to clipboard', 'success');
    } catch (error) {
      this.showToast('Failed to copy invite code', 'danger');
    }
  }

  async onShareInviteCode() {
    const family = this.family();
    if (!family) return;

    const shareData = {
      title: `Join ${family.name} on Family Connect`,
      text: `You've been invited to join our family! Use invite code: ${family.inviteCode}`,
      url: `${window.location.origin}/families/join/${family.inviteCode}`
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled
      }
    } else {
      // Fallback to copy
      await this.onCopyInviteCode();
    }
  }

  async onRegenerateInviteCode() {
    const familyId = this.familyId();
    if (!familyId) return;

    const alert = await this.alertController.create({
      header: 'Regenerate Invite Code',
      message: 'This will create a new invite code and invalidate the current one. Continue?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Regenerate',
          handler: () => {
            this.familyService.regenerateInviteCode(familyId)
              .pipe(takeUntil(this.destroy$))
              .subscribe();
          }
        }
      ]
    });

    await alert.present();
  }

  // Member Actions
  async onMemberActions(event: Event, member: FamilyMember) {
    event.stopPropagation();

    // Show member action menu
    const popover = await this.popoverController.create({
      component: MemberActionMenuComponent,
      componentProps: {
        member: member,
        canManage: this.canManage(),
        currentUserRole: this.userRole()
      },
      event: event,
      translucent: true
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();
    if (data?.action) {
      this.handleMemberAction(data.action, member);
    }
  }

  private handleMemberAction(action: string, member: FamilyMember) {
    switch (action) {
      case 'promote':
        this.promoteMember(member);
        break;
      case 'demote':
        this.demoteMember(member);
        break;
      case 'remove':
        this.removeMember(member);
        break;
      case 'block':
        this.blockMember(member);
        break;
    }
  }

  private async promoteMember(member: FamilyMember) {
    // Implementation for promoting member
    this.showToast('Member promotion coming soon!', 'primary');
  }

  private async demoteMember(member: FamilyMember) {
    // Implementation for demoting member
    this.showToast('Member demotion coming soon!', 'primary');
  }

  private async removeMember(member: FamilyMember) {
    // Implementation for removing member
    this.showToast('Member removal coming soon!', 'primary');
  }

  private async blockMember(member: FamilyMember) {
    // Implementation for blocking member
    this.showToast('Member blocking coming soon!', 'primary');
  }

  // Invitation Actions
  onResendInvitation(invitation: FamilyInvitation) {
    this.invitationService.resendInvitation(invitation.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast('Invitation resent successfully', 'success');
        }
      });
  }

  async onCancelInvitation(invitation: FamilyInvitation) {
    const alert = await this.alertController.create({
      header: 'Cancel Invitation',
      message: `Cancel invitation to ${invitation.email}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Yes, Cancel',
          handler: () => {
            this.invitationService.cancelInvitation(invitation.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  const current = this.pendingInvitations();
                  const updated = current.filter(inv => inv.id !== invitation.id);
                  this.pendingInvitations.set(updated);
                }
              });
          }
        }
      ]
    });

    await alert.present();
  }

  // Activity Actions
  onLoadMoreActivities() {
    this.isLoadingMore.set(true);

    // Simulate loading more activities
    setTimeout(() => {
      this.isLoadingMore.set(false);
      this.hasMoreActivities.set(false);
    }, 1000);
  }

  // Menu Actions
  async onShowFamilyMenu(event: Event) {
    // Show family menu popover
    this.showToast('Family menu coming soon!', 'primary');
  }

  // Utility methods
  getFamilyBackground(): string {
    const family = this.family();
    if (family?.settings?.theme?.backgroundImage) {
      return `url(${family.settings.theme.backgroundImage})`;
    }
    return 'linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(185, 28, 28, 0.1))';
  }

  getFamilyInitials(): string {
    const family = this.family();
    if (!family) return '';

    return family.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  }

  getRoleIcon(): string {
    const role = this.userRole();
    switch (role) {
      case 'owner': return 'crown-outline';
      case 'admin': return 'shield-outline';
      default: return 'person-outline';
    }
  }

  getRoleDisplayName(): string {
    const role = this.userRole();
    switch (role) {
      case 'owner': return 'Owner';
      case 'admin': return 'Admin';
      case 'member': return 'Member';
      case 'child': return 'Child';
      default: return 'Member';
    }
  }

  getMemberRoleDisplay(role: string): string {
    switch (role) {
      case 'owner': return 'Owner';
      case 'admin': return 'Admin';
      case 'member': return 'Member';
      case 'child': return 'Child';
      default: return 'Member';
    }
  }

  isMemberOnline(member: FamilyMember): boolean {
    if (!member.lastActivityAt) return false;

    const lastActivity = new Date(member.lastActivityAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

    return diffMinutes < 5; // Consider online if active within 5 minutes
  }

  getActivityIcon(type: ActivityType): string {
    switch (type) {
      case ActivityType.MEMBER_JOINED: return 'person-add-outline';
      case ActivityType.MEMBER_LEFT: return 'exit-outline';
      case ActivityType.PHOTO_SHARED: return 'camera-outline';
      case ActivityType.EVENT_CREATED: return 'calendar-outline';
      case ActivityType.MESSAGE_SENT: return 'chatbubble-outline';
      default: return 'pulse-outline';
    }
  }

  // Track by functions
  trackByActivityId(index: number, activity: FamilyActivity): number {
    return activity.id;
  }

  trackByMemberId(index: number, member: FamilyMember): number {
    return member.id;
  }

  trackByInvitationId(index: number, invitation: FamilyInvitation): number {
    return invitation.id;
  }

  // Utility
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}


// Member Action Menu Component (placeholder)
@Component({
  template: `<div>Member action menu will be implemented</div>`,
  standalone: true
})
class MemberActionMenuComponent {
  member!: FamilyMember;
  canManage!: boolean;
  currentUserRole!: string;
}
