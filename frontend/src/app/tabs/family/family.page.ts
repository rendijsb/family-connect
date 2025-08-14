import {Component, inject, OnInit, OnDestroy, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText, IonAvatar,
  IonRefresher, IonRefresherContent, IonFab, IonFabButton, IonButtons,
  IonMenuButton, IonChip, IonLabel, IonItem, IonList, IonBadge,
  IonSegment, IonSegmentButton, IonGrid, IonRow, IonCol, IonProgressBar,
  IonSpinner, IonActionSheet, ActionSheetController
} from '@ionic/angular/standalone';
import {Router} from '@angular/router';
import {Subject, takeUntil, combineLatest} from 'rxjs';
import {addIcons} from 'ionicons';
import {
  peopleOutline, addOutline, settingsOutline, statsChartOutline,
  notificationsOutline, mailOutline, locationOutline, calendarOutline,
  cameraOutline, heartOutline, chatbubbleOutline, callOutline,
  videocamOutline, ellipsisVerticalOutline, createOutline,
  personAddOutline, shareOutline, informationCircleOutline,
  chevronForwardOutline, timeOutline, checkmarkCircleOutline,
  alertCircleOutline, warningOutline
} from 'ionicons/icons';

import {FamilyService} from '../../core/services/family/family.service';
import {FamilyMemberService} from '../../core/services/family/family-member.service';
import {InvitationService} from '../../core/services/family/invitation.service';
import {AuthService} from '../../core/services/auth/auth.service';
import {
  Family,
  FamilyMember,
  FamilyInvitation,
  FamilyStats,
  FamilyActivity,
  InvitationStatusEnum
} from '../../models/families/family.models';

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  route?: string;
  action?: () => void;
}

@Component({
  selector: 'app-family',
  templateUrl: './family.page.html',
  styleUrls: ['./family.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonAvatar,
    IonRefresher, IonRefresherContent, IonFab, IonFabButton, IonButtons,
    IonChip, IonLabel, IonItem, IonList, IonBadge,
    IonSegment, IonSegmentButton, IonProgressBar,
    IonSpinner
  ]
})
export class FamilyPage implements OnInit, OnDestroy {
  private readonly familyService = inject(FamilyService);
  private readonly memberService = inject(FamilyMemberService);
  private readonly invitationService = inject(InvitationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly destroy$ = new Subject<void>();

  // Signals for reactive state
  selectedSegment = signal<string>('overview');
  isLoading = signal<boolean>(false);
  currentFamily = signal<Family | null>(null);
  familyStats = signal<FamilyStats | null>(null);
  familyMembers = signal<FamilyMember[]>([]);
  recentActivities = signal<FamilyActivity[]>([]);
  pendingInvitations = signal<FamilyInvitation[]>([]);
  currentUser = this.authService.user();

  quickActions: QuickAction[] = [
    {
      id: 'invite',
      title: 'Invite Member',
      icon: 'person-add-outline',
      color: '#3b82f6',
      action: () => this.onInviteMember()
    },
    {
      id: 'chat',
      title: 'Family Chat',
      icon: 'chatbubble-outline',
      color: '#22c55e',
      route: '/family/chat'
    },
    {
      id: 'photos',
      title: 'Share Photos',
      icon: 'camera-outline',
      color: '#f59e0b',
      route: '/family/photos'
    },
    {
      id: 'events',
      title: 'Events',
      icon: 'calendar-outline',
      color: '#8b5cf6',
      route: '/family/events'
    },
    {
      id: 'location',
      title: 'Locations',
      icon: 'location-outline',
      color: '#ec4899',
      route: '/family/locations'
    },
    {
      id: 'call',
      title: 'Video Call',
      icon: 'videocam-outline',
      color: '#06b6d4',
      action: () => this.onVideoCall()
    }
  ];

  constructor() {
    this.addIcons();
  }

  ngOnInit() {
    this.loadFamilyData();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private addIcons() {
    addIcons({
      peopleOutline, addOutline, settingsOutline, statsChartOutline,
      notificationsOutline, mailOutline, locationOutline, calendarOutline,
      cameraOutline, heartOutline, chatbubbleOutline, callOutline,
      videocamOutline, ellipsisVerticalOutline, createOutline,
      personAddOutline, shareOutline, informationCircleOutline,
      chevronForwardOutline, timeOutline, checkmarkCircleOutline,
      alertCircleOutline, warningOutline
    });
  }

  private setupSubscriptions() {
    // Subscribe to family service state
    combineLatest([
      this.familyService.currentFamily$,
      this.familyService.familyStats$,
      this.memberService.familyMembers$,
      this.familyService.activities$,
      this.invitationService.familyInvitations$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([family, stats, members, activities, invitations]) => {
      this.currentFamily.set(family);
      this.familyStats.set(stats);
      this.familyMembers.set(members);
      this.recentActivities.set(activities);

      // Filter pending invitations
      const pending = invitations.filter(inv =>
        inv.status === InvitationStatusEnum.PENDING && !inv.isExpired
      );
      this.pendingInvitations.set(pending);
    });

    // Subscribe to loading states
    combineLatest([
      this.familyService.isLoading,
      this.memberService.isLoading,
      this.invitationService.isLoading
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([familyLoading, memberLoading, invitationLoading]: any) => {
      this.isLoading.set(familyLoading || memberLoading || invitationLoading);
    });
  }

  private loadFamilyData() {
    const family = this.familyService.currentFamily();

    if (!family) {
      // Load user family first
      this.familyService.loadUserFamilies().pipe(
        takeUntil(this.destroy$)
      ).subscribe();
      return;
    }

    // Load family data
    this.loadFamilyDetails(family.id);
  }

  private loadFamilyDetails(familyId: number) {
    // Load family stats
    this.familyService.getFamilyStats(familyId).pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    // Load family members
    this.memberService.getFamilyMembers(familyId).pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    // Load recent activities
    this.familyService.getFamilyActivities(familyId, 1, 10).pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    // Load family invitations
    this.invitationService.getFamilyInvitations(familyId).pipe(
      takeUntil(this.destroy$)
    ).subscribe();
  }

  // Event handlers
  doRefresh(event: any) {
    const family = this.currentFamily();
    if (family) {
      this.loadFamilyDetails(family.id);
    } else {
      this.familyService.loadUserFamilies().pipe(
        takeUntil(this.destroy$)
      ).subscribe();
    }

    setTimeout(() => {
      event.target.complete();
    }, 1500);
  }

  segmentChanged(event: any) {
    this.selectedSegment.set(event.detail.value);
  }

  onQuickAction(action: QuickAction) {
    if (action.action) {
      action.action();
    } else if (action.route) {
      this.router.navigate([action.route]);
    }
  }

  onViewMember(member: FamilyMember) {
    this.router.navigate(['/family/members', member.id]);
  }

  onViewAllMembers() {
    this.router.navigate(['/family/members']);
  }

  onViewActivity(activity: FamilyActivity) {
    // Navigate to activity details or expand inline
    console.log('View activity:', activity);
  }

  onViewAllActivities() {
    this.router.navigate(['/family/activities']);
  }

  onViewInvitation(invitation: FamilyInvitation) {
    this.router.navigate(['/family/invitations', invitation.id]);
  }

  onViewAllInvitations() {
    this.router.navigate(['/family/invitations']);
  }

  onInviteMember() {
    this.router.navigate(['/family/invite']);
  }

  onFamilySettings() {
    this.router.navigate(['/family/settings']);
  }

  onCreateFamily() {
    this.router.navigate(['/family/create']);
  }

  onVideoCall() {
    console.log('Starting video call...');
    // Implement video call functionality
  }

  async onFabActions() {
    const family = this.currentFamily();
    const canManage = family?.canManage || false;

    const buttons: any = [
      {
        text: 'Invite Member',
        icon: 'person-add-outline',
        handler: () => this.onInviteMember()
      },
      {
        text: 'Share Photos',
        icon: 'camera-outline',
        handler: () => this.router.navigate(['/family/photos/share'])
      },
      {
        text: 'Create Event',
        icon: 'calendar-outline',
        handler: () => this.router.navigate(['/family/events/create'])
      }
    ];

    if (canManage) {
      buttons.push({
        text: 'Family Settings',
        icon: 'settings-outline',
        handler: () => this.onFamilySettings()
      });
    }

    if (!family) {
      buttons.unshift({
        text: 'Create Family',
        icon: 'add-outline',
        handler: () => this.onCreateFamily()
      });
    }

    buttons.push({
      text: 'Cancel',
      icon: 'close-outline',
      role: 'cancel'
    });

    const actionSheet = await this.actionSheetController.create({
      header: 'Family Actions',
      buttons
    });

    await actionSheet.present();
  }

  onSwitchFamily() {
    this.router.navigate(['/family/switch']);
  }

  // Utility methods
  getMemberStatusColor(member: FamilyMember): string {
    return member.isOnline ? '#22c55e' : '#6b7280';
  }

  getActivityIcon(activity: FamilyActivity): string {
    switch (activity.type) {
      case 'member_joined':
        return 'person-add-outline';
      case 'photo_shared':
        return 'camera-outline';
      case 'event_created':
        return 'calendar-outline';
      case 'message_sent':
        return 'chatbubble-outline';
      case 'milestone_reached':
        return 'trophy-outline';
      default:
        return 'information-circle-outline';
    }
  }

  getInvitationStatusIcon(status: InvitationStatusEnum): string {
    switch (status) {
      case InvitationStatusEnum.PENDING:
        return 'time-outline';
      case InvitationStatusEnum.ACCEPTED:
        return 'checkmark-circle-outline';
      case InvitationStatusEnum.DECLINED:
        return 'close-circle-outline';
      case InvitationStatusEnum.EXPIRED:
        return 'warning-outline';
      default:
        return 'help-circle-outline';
    }
  }

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  getConnectionStrengthColor(strength: number): string {
    if (strength >= 80) return '#22c55e';
    if (strength >= 60) return '#f59e0b';
    return '#ef4444';
  }

  getConnectionStrengthText(strength: number): string {
    if (strength >= 90) return 'Excellent';
    if (strength >= 80) return 'Very Good';
    if (strength >= 70) return 'Good';
    if (strength >= 60) return 'Fair';
    return 'Needs Improvement';
  }

  // Template getters for computed values
  get hasFamily(): boolean {
    return !!this.currentFamily();
  }

  get canInviteMembers(): boolean {
    const family = this.currentFamily();
    return family?.canManage || false;
  }

  get onlineMembersCount(): number {
    return this.familyMembers().filter(member => member.isOnline).length;
  }

  get recentMembersPreview(): FamilyMember[] {
    return this.familyMembers().slice(0, 4);
  }

  get recentActivitiesPreview(): FamilyActivity[] {
    return this.recentActivities().slice(0, 3);
  }

  get pendingInvitationsCount(): number {
    return this.pendingInvitations().length;
  }
}
