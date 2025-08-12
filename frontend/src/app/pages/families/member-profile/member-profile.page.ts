// frontend/src/app/pages/families/member-profile/member-profile.page.ts
import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonIcon, IonBackButton, IonButtons, IonSpinner, IonAvatar, IonChip, IonLabel,
  IonFab, IonFabButton, IonFabList, PopoverController, AlertController, ToastController,
  ActionSheetController
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  ellipsisVerticalOutline, chatbubbleOutline, callOutline, videocamOutline, locationOutline,
  alertCircleOutline, refreshOutline, informationCircleOutline, pulseOutline, settingsOutline,
  mailOutline, calendarOutline, timeOutline, shieldOutline, notificationsOutline, cameraOutline,
  crownOutline, personOutline, banOutline, trashOutline, arrowUpOutline, arrowDownOutline
} from 'ionicons/icons';
import { FamilyService } from '../../../core/services/families/family.service';
import { FamilyMemberService } from '../../../core/services/families/family-member.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import {
  Family, FamilyMember, FamilyRole, FamilyMemberStatus, FamilyActivity, ActivityType, FamilyPermissions
} from '../../../models/families/family.models';
import { Subject, takeUntil, switchMap, finalize, forkJoin } from 'rxjs';

@Component({
  selector: 'app-member-profile',
  templateUrl: './member-profile.page.html',
  styleUrls: ['./member-profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonButton, IonIcon, IonBackButton, IonButtons, IonSpinner, IonAvatar, IonChip, IonLabel,
    IonFab, IonFabButton, IonFabList
  ]
})
export class MemberProfilePage implements OnInit, OnDestroy {
  private readonly familyService = inject(FamilyService);
  private readonly memberService = inject(FamilyMemberService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly popoverController = inject(PopoverController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly destroy$ = new Subject<void>();

  // State
  familyId = signal<number>(0);
  userId = signal<number>(0);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  member = signal<FamilyMember | null>(null);
  memberActivities = signal<FamilyActivity[]>([]);

  // Computed properties
  family = computed(() => this.familyService.currentFamily());
  currentUser = computed(() => this.authService.user());

  canManageMembers = computed(() => {
    const fam = this.family();
    const user = this.currentUser();
    if (!fam || !user) return false;
    return this.familyService.canManageFamily(fam, user.id);
  });

  canViewPreferences = computed(() => {
    const mem = this.member();
    const user = this.currentUser();
    if (!mem || !user) return false;

    // Members can view their own preferences, or admins can view others
    return mem.userId === user.id || this.canManageMembers();
  });

  isOwnProfile = computed(() => {
    const mem = this.member();
    const user = this.currentUser();
    return mem?.userId === user?.id;
  });

  constructor() {
    addIcons({
      ellipsisVerticalOutline, chatbubbleOutline, callOutline, videocamOutline, locationOutline,
      alertCircleOutline, refreshOutline, informationCircleOutline, pulseOutline, settingsOutline,
      mailOutline, calendarOutline, timeOutline, shieldOutline, notificationsOutline, cameraOutline,
      crownOutline, personOutline, banOutline, trashOutline, arrowUpOutline, arrowDownOutline
    });
  }

  ngOnInit() {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const familyId = parseInt(params['id']);
        const userId = parseInt(params['userId']);

        this.familyId.set(familyId);
        this.userId.set(userId);

        return this.familyService.getFamily(familyId);
      })
    ).subscribe({
      next: () => {
        this.loadMemberProfile();
      },
      error: (error) => {
        console.error('Error loading family:', error);
        this.error.set('Failed to load family information');
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Data loading
  private loadMemberProfile() {
    const familyId = this.familyId();
    const userId = this.userId();

    if (!familyId || !userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    // Load members to find the specific member
    this.memberService.getMembers(familyId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (members) => {
          const member = members.find(m => m.userId === userId);
          if (member) {
            this.member.set(member);
            this.loadMemberActivities();
          } else {
            this.error.set('Member not found in this family');
          }
        },
        error: (error) => {
          console.error('Error loading member:', error);
          this.error.set('Failed to load member profile');
        }
      });
  }

  private loadMemberActivities() {
    // Mock activities for now - in real app, this would come from an API
    const mockActivities: FamilyActivity[] = [
      {
        id: 1,
        familyId: this.familyId(),
        userId: this.userId(),
        type: ActivityType.PHOTO_SHARED,
        title: 'Shared 3 new photos',
        description: 'Family vacation photos from the beach',
        metadata: {},
        isVisible: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        familyId: this.familyId(),
        userId: this.userId(),
        type: ActivityType.MESSAGE_SENT,
        title: 'Sent a message',
        description: 'Good morning everyone! 😊',
        metadata: {},
        isVisible: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        familyId: this.familyId(),
        userId: this.userId(),
        type: ActivityType.EVENT_CREATED,
        title: 'Created family event',
        description: 'Sunday Family BBQ at the park',
        metadata: {},
        isVisible: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        updatedAt: new Date().toISOString()
      }
    ];

    this.memberActivities.set(mockActivities);
  }

  onRetry() {
    this.loadMemberProfile();
  }

  // Member actions
  onMessageMember() {
    const member = this.member();
    if (!member) return;

    // Navigate to chat with this member
    this.router.navigate(['/families', this.familyId(), 'chat'], {
      queryParams: { member: member.userId }
    });
  }

  onCallMember() {
    const member = this.member();
    if (!member?.user?.phone) {
      this.showToast('Phone number not available', 'warning');
      return;
    }

    // In a real app, this would initiate a call
    this.showToast('Voice call feature coming soon!', 'primary');
  }

  onVideoCallMember() {
    // In a real app, this would initiate a video call
    this.showToast('Video call feature coming soon!', 'primary');
  }

  onViewLocation() {
    const member = this.member();
    if (!member?.preferences?.allowLocationTracking) {
      this.showToast('Location sharing is disabled for this member', 'warning');
      return;
    }

    // Navigate to location view
    this.router.navigate(['/families', this.familyId(), 'location'], {
      queryParams: { member: member.userId }
    });
  }

  // Management actions
  async onShowMemberActions(event: Event) {
    const member = this.member();
    if (!member || !this.canManageMembers()) return;

    const canPromote = this.canPromoteMember(member);
    const canDemote = this.canDemoteMember(member);
    const canRemove = this.canRemoveMember(member);
    const canBlock = this.canBlockMember(member);

    const buttons = [];

    if (canPromote) {
      buttons.push({
        text: 'Promote to Admin',
        icon: 'arrow-up-outline',
        handler: () => this.onPromoteMember(member)
      });
    }

    if (canDemote) {
      buttons.push({
        text: 'Demote to Member',
        icon: 'arrow-down-outline',
        handler: () => this.onDemoteMember(member)
      });
    }

    if (canBlock) {
      buttons.push({
        text: 'Block Member',
        icon: 'ban-outline',
        role: 'destructive',
        handler: () => this.onBlockMember(member)
      });
    }

    if (canRemove) {
      buttons.push({
        text: 'Remove from Family',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => this.onRemoveMember(member)
      });
    }

    buttons.push({
      text: 'Cancel',
      role: 'cancel'
    });

    const actionSheet = await this.actionSheetController.create({
      header: `Manage ${member.user?.name}`,
      buttons
    });

    await actionSheet.present();
  }

  private async onPromoteMember(member: FamilyMember) {
    const alert = await this.alertController.create({
      header: 'Promote Member',
      message: `Promote ${member.user?.name} to Admin? They will be able to manage family settings and members.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Promote',
          handler: () => {
            this.memberService.updateMemberRole(
              this.familyId(),
              member.userId,
              { role: FamilyRole.ADMIN }
            ).pipe(takeUntil(this.destroy$)).subscribe({
              next: (updatedMember) => {
                this.member.set(updatedMember);
                this.showToast(`${member.user?.name} promoted to Admin`, 'success');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  private async onDemoteMember(member: FamilyMember) {
    const alert = await this.alertController.create({
      header: 'Demote Member',
      message: `Demote ${member.user?.name} to regular Member? They will lose admin privileges.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Demote',
          handler: () => {
            this.memberService.updateMemberRole(
              this.familyId(),
              member.userId,
              { role: FamilyRole.MEMBER }
            ).pipe(takeUntil(this.destroy$)).subscribe({
              next: (updatedMember) => {
                this.member.set(updatedMember);
                this.showToast(`${member.user?.name} demoted to Member`, 'success');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  private async onBlockMember(member: FamilyMember) {
    const alert = await this.alertController.create({
      header: 'Block Member',
      message: `Block ${member.user?.name}? They will not be able to access the family until unblocked.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Block',
          role: 'destructive',
          handler: () => {
            this.memberService.blockMember(this.familyId(), member.userId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (updatedMember) => {
                  this.member.set(updatedMember);
                  this.showToast(`${member.user?.name} has been blocked`, 'success');
                }
              });
          }
        }
      ]
    });

    await alert.present();
  }

  private async onRemoveMember(member: FamilyMember) {
    const alert = await this.alertController.create({
      header: 'Remove Member',
      message: `Remove ${member.user?.name} from the family? This action cannot be undone.`,
      inputs: [
        {
          name: 'confirmation',
          type: 'text',
          placeholder: `Type "${member.user?.name}" to confirm`
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          role: 'destructive',
          handler: (data) => {
            if (data.confirmation !== member.user?.name) {
              this.showToast('Confirmation name does not match', 'danger');
              return false;
            }

            this.memberService.removeMember(this.familyId(), member.userId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.router.navigate(['/families', this.familyId(), 'members']);
                  this.showToast(`${member.user?.name} removed from family`, 'success');
                }
              });
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  // Permission checks
  private canPromoteMember(member: FamilyMember): boolean {
    return this.canManageMembers() &&
      member.role === FamilyRole.MEMBER &&
      member.status === FamilyMemberStatus.ACTIVE;
  }

  private canDemoteMember(member: FamilyMember): boolean {
    return this.canManageMembers() &&
      member.role === FamilyRole.ADMIN &&
      member.status === FamilyMemberStatus.ACTIVE;
  }

  private canRemoveMember(member: FamilyMember): boolean {
    const fam = this.family();
    return this.canManageMembers() &&
      fam?.ownerId !== member.userId &&
      member.role !== FamilyRole.OWNER;
  }

  private canBlockMember(member: FamilyMember): boolean {
    const fam = this.family();
    return this.canManageMembers() &&
      fam?.ownerId !== member.userId &&
      member.role !== FamilyRole.OWNER &&
      member.status === FamilyMemberStatus.ACTIVE;
  }

  // Utility methods
  getMemberRoleDisplay(role: FamilyRole): string {
    switch (role) {
      case FamilyRole.OWNER: return 'Owner';
      case FamilyRole.ADMIN: return 'Admin';
      case FamilyRole.MEMBER: return 'Member';
      case FamilyRole.CHILD: return 'Child';
      default: return 'Member';
    }
  }

  getRoleIcon(): string {
    const member = this.member();
    if (!member) return 'person-outline';

    switch (member.role) {
      case FamilyRole.OWNER: return 'crown-outline';
      case FamilyRole.ADMIN: return 'shield-outline';
      default: return 'person-outline';
    }
  }

  getStatusDisplay(status: FamilyMemberStatus): string {
    switch (status) {
      case FamilyMemberStatus.ACTIVE: return 'Active';
      case FamilyMemberStatus.INACTIVE: return 'Inactive';
      case FamilyMemberStatus.BLOCKED: return 'Blocked';
      case FamilyMemberStatus.PENDING: return 'Pending';
      default: return status;
    }
  }

  isMemberOnline(): boolean {
    const member = this.member();
    if (!member?.lastActivityAt) return false;

    const lastActivity = new Date(member.lastActivityAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

    return diffMinutes < 5; // Consider online if active within 5 minutes
  }

  getStatusText(): string {
    return this.isMemberOnline() ? 'Online' : 'Offline';
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

  getPermissionDisplay(permission: string): string {
    const permissionMap: Record<string, string> = {
      'manage_family': 'Manage Family',
      'invite_members': 'Invite Members',
      'remove_members': 'Remove Members',
      'manage_settings': 'Manage Settings',
      'create_events': 'Create Events',
      'upload_photos': 'Upload Photos',
      'send_messages': 'Send Messages',
      'view_locations': 'View Locations'
    };

    return permissionMap[permission] || permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

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
