import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
  IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonAvatar,
  IonSegment, IonSegmentButton, IonLabel, IonRefresher, IonRefresherContent,
  IonFab, IonFabButton, IonFabList, IonSkeletonText,
  ActionSheetController, AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, homeOutline, peopleOutline, pulseOutline, chatbubbleOutline,
  cameraOutline, calendarOutline, locationOutline, heartOutline, personAddOutline,
  notificationsOutline, ellipsisVerticalOutline, ellipsisHorizontalOutline,
  copyOutline, shareOutline, refreshOutline, addOutline, timeOutline,
  globeOutline, lockClosedOutline, keyOutline, settingsOutline, exitOutline,
  trashOutline, createOutline
} from 'ionicons/icons';

import { FamilyService } from '../../../core/services/family/family.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import {
  Family,
  FamilyMember,
  FamilyRoleEnum,
  FamilyPrivacyEnum,
  getFamilyRoleName
} from '../../../models/families/family.models';

interface FamilyActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user: string;
  userAvatar: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-family-detail',
  templateUrl: './family-detail.page.html',
  styleUrls: ['./family-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
    IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonAvatar,
    IonSegment, IonSegmentButton, IonLabel, IonRefresher, IonRefresherContent,
    IonFab, IonFabButton, IonFabList, IonSkeletonText
  ]
})
export class FamilyDetailPage implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  readonly familyService = inject(FamilyService);
  readonly authService = inject(AuthService);

  family: Family | null = null;
  selectedSegment = 'overview';
  familySlug = '';

  // Mock data - in real app this would come from API
  recentActivities: FamilyActivity[] = [
    {
      id: 1,
      type: 'member_joined',
      title: 'New Member Joined',
      description: 'Emma Johnson joined the family',
      timestamp: '2 hours ago',
      user: 'Emma Johnson',
      userAvatar: '/assets/avatars/emma.jpg',
      icon: 'person-add-outline',
      color: '#22c55e'
    },
    {
      id: 2,
      type: 'photo_shared',
      title: 'Photos Shared',
      description: 'Michael shared 5 new photos from vacation',
      timestamp: '5 hours ago',
      user: 'Michael Johnson',
      userAvatar: '/assets/avatars/michael.jpg',
      icon: 'camera-outline',
      color: '#3b82f6'
    },
    {
      id: 3,
      type: 'event_created',
      title: 'Event Created',
      description: 'Family BBQ scheduled for this weekend',
      timestamp: '1 day ago',
      user: 'John Johnson',
      userAvatar: '/assets/avatars/john.jpg',
      icon: 'calendar-outline',
      color: '#f59e0b'
    }
  ];

  constructor() {
    this.addIcons();
  }

  ngOnInit() {
    this.familySlug = this.route.snapshot.paramMap.get('slug') || '';
    if (this.familySlug) {
      this.loadFamily();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private addIcons() {
    addIcons({
      arrowBackOutline, homeOutline, peopleOutline, pulseOutline, chatbubbleOutline,
      cameraOutline, calendarOutline, locationOutline, heartOutline, personAddOutline,
      notificationsOutline, ellipsisVerticalOutline, ellipsisHorizontalOutline,
      copyOutline, shareOutline, refreshOutline, addOutline, timeOutline,
      globeOutline, lockClosedOutline, keyOutline, settingsOutline, exitOutline,
      trashOutline, createOutline
    });
  }

  private loadFamily() {
    this.familyService.getFamilyBySlug(this.familySlug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (family) => {
          this.family = family.data;
        },
        error: (error) => {
          console.error('Load family error:', error);
          this.router.navigate(['/tabs/family']);
        }
      });
  }

  // Event Handlers
  async goBack() {
    await this.router.navigate(['/tabs/family']);
  }

  doRefresh(event: any) {
    if (this.familySlug) {
      this.familyService.getFamilyBySlug(this.familySlug)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          complete: () => {
            event.target.complete();
          },
          error: () => {
            event.target.complete();
          }
        });
    } else {
      event.target.complete();
    }
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  // Quick Actions
  async openFamilyChat() {
    await this.router.navigate(['/family', this.familySlug, 'chat']);
  }

  async openFamilyPhotos() {
    await this.router.navigate(['/family', this.familySlug, 'photos']);
  }

  async openFamilyEvents() {
    await this.router.navigate(['/family', this.familySlug, 'events']);
  }

  async openFamilyLocations() {
    await this.router.navigate(['/family', this.familySlug, 'locations']);
  }

  async openFamilyMemories() {
    await this.router.navigate(['/family', this.familySlug, 'memories']);
  }

  // Member Actions
  async inviteMembers() {
    const alert = await this.alertController.create({
      header: 'Invite Family Member',
      message: 'Enter the email address of the person you want to invite.',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Email address'
        },
        {
          name: 'role',
          type: 'radio',
          label: 'Family Member',
          value: FamilyRoleEnum.MEMBER,
          checked: true
        },
        {
          name: 'role',
          type: 'radio',
          label: 'Family Moderator',
          value: FamilyRoleEnum.MODERATOR
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Send Invite',
          handler: (data) => {
            if (data.email && data.email.trim()) {
              this.handleInviteMember(data.email.trim(), data.role);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private handleInviteMember(email: string, role: FamilyRoleEnum) {
    if (this.family) {
      this.familyService.inviteFamilyMember(this.family.slug, email, role)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
  }

  async chatWithMember(member: FamilyMember) {
// Navigate to direct chat with member
    await this.router.navigate(['/chat', 'direct', member.userId]);
  }

// Join Code Actions
  async copyJoinCode() {
    if (this.family?.joinCode) {
      try {
        await navigator.clipboard.writeText(this.family.joinCode);
        const toast = await this.toastController.create({
          message: 'Join code copied to clipboard!',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
      } catch (error) {
        console.error('Failed to copy join code:', error);
      }
    }
  }

  async shareJoinCode() {
    if (this.family?.joinCode) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Join ${this.family.name}`,
            text: `You're invited to join the "${this.family.name}" family on Family Connect!`,
            url: `familyconnect://join/${this.family.joinCode}`
          });
        } catch (error) {
          console.error('Share failed:', error);
          this.copyJoinCode();
        }
      } else {
        this.copyJoinCode();
      }
    }
  }

  async regenerateJoinCode() {
    if (!this.family) return;

    const alert = await this.alertController.create({
      header: 'Generate New Join Code',
      message: 'This will invalidate the current join code. Are you sure?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Generate',
          handler: () => {
            this.familyService.generateJoinCode(this.family!.slug)
              .pipe(takeUntil(this.destroy$))
              .subscribe();
          }
        }
      ]
    });

    await alert.present();
  }

// Action Sheets
  async presentFamilyOptions() {
    const buttons: any[] = [
      {
        text: 'Family Chat',
        icon: 'chatbubble-outline',
        handler: () => this.openFamilyChat()
      },
      {
        text: 'Share Family',
        icon: 'share-outline',
        handler: () => this.shareFamily()
      }
    ];

    if (this.canManageFamily()) {
      buttons.push(
        {
          text: 'Family Settings',
          icon: 'settings-outline',
          handler: () => this.openFamilySettings()
        },
        {
          text: 'Invite Members',
          icon: 'person-add-outline',
          handler: () => this.inviteMembers()
        }
      );
    }

    if (this.isOwner()) {
      buttons.push({
        text: 'Delete Family',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => this.confirmDeleteFamily()
      });
    } else {
      buttons.push({
        text: 'Leave Family',
        icon: 'exit-outline',
        role: 'destructive',
        handler: () => this.confirmLeaveFamily()
      });
    }

    buttons.push({
      text: 'Cancel',
      role: 'cancel',
      icon: 'close-outline'
    });

    const actionSheet = await this.actionSheetController.create({
      header: 'Family Options',
      buttons
    });

    await actionSheet.present();
  }

  async presentMemberActions(member: FamilyMember) {
    const buttons: any[] = [
      {
        text: 'Send Message',
        icon: 'chatbubble-outline',
        handler: () => this.chatWithMember(member)
      },
      {
        text: 'View Profile',
        icon: 'person-outline',
        handler: () => this.viewMemberProfile(member)
      }
    ];

    if (this.canManageMember(member)) {
      buttons.push(
        {
          text: 'Edit Member',
          icon: 'create-outline',
          handler: () => this.editMember(member)
        },
        {
          text: 'Remove Member',
          icon: 'person-remove-outline',
          role: 'destructive',
          handler: () => this.confirmRemoveMember(member)
        }
      );
    }

    buttons.push({
      text: 'Cancel',
      role: 'cancel',
      icon: 'close-outline'
    });

    const actionSheet = await this.actionSheetController.create({
      header: member.user?.name || 'Member',
      buttons
    });

    await actionSheet.present();
  }

  async presentFabOptions() {
// This is handled by the ion-fab-list in the template
  }

// Family Management
  async openFamilySettings() {
    await this.router.navigate(['/family', this.familySlug, 'settings']);
  }

  async shareFamily() {
    if (this.family) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: this.family.name,
            text: `Check out the "${this.family.name}" family on Family Connect!`,
            url: `familyconnect://family/${this.family.slug}`
          });
        } catch (error) {
          console.error('Share failed:', error);
        }
      }
    }
  }

  async confirmLeaveFamily() {
    if (!this.family) return;

    const alert = await this.alertController.create({
      header: 'Leave Family',
      message: `Are you sure you want to leave "${this.family.name}"? You'll need a new invitation to rejoin.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Leave',
          role: 'destructive',
          handler: () => {
            this.familyService.leaveFamily(this.family!.slug)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.router.navigate(['/tabs/family']);
                }
              });
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmDeleteFamily() {
    if (!this.family) return;

    const alert = await this.alertController.create({
      header: 'Delete Family',
      message: `Are you sure you want to permanently delete "${this.family.name}"? This action cannot be undone.`,
      inputs: [
        {
          name: 'confirmation',
          type: 'text',
          placeholder: `Type "${this.family.name}" to confirm`
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: (data) => {
            if (data.confirmation === this.family!.name) {
              this.familyService.deleteFamily(this.family!.slug)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => {
                    this.router.navigate(['/tabs/family']);
                  }
                });
            } else {
              this.showErrorToast('Family name does not match. Please try again.');
            }
          }
        }
      ]
    });

    await alert.present();
  }

// Member Management
  async viewMemberProfile(member: FamilyMember) {
    await this.router.navigate(['/profile', member.userId]);
  }

  async editMember(member: FamilyMember) {
// Open member edit modal/page
    console.log('Edit member:', member);
  }

  async confirmRemoveMember(member: FamilyMember) {
    const alert = await this.alertController.create({
      header: 'Remove Member',
      message: `Are you sure you want to remove ${member.user?.name} from the family?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.familyService.removeFamilyMember(this.family!.slug, member.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe();
          }
        }
      ]
    });

    await alert.present();
  }

// Utility Methods
  trackByMemberId(index: number, member: FamilyMember): number {
    return member.id;
  }

  getFamilyRoleName(role: FamilyRoleEnum): string {
    return getFamilyRoleName(role);
  }

  getRoleInitial(role: FamilyRoleEnum): string {
    switch (role) {
      case FamilyRoleEnum.OWNER: return 'O';
      case FamilyRoleEnum.MODERATOR: return 'M';
      case FamilyRoleEnum.MEMBER: return 'F';
      case FamilyRoleEnum.CHILD: return 'C';
      default: return '?';
    }
  }

  getRoleBadgeClass(role: FamilyRoleEnum): string {
    switch (role) {
      case FamilyRoleEnum.OWNER: return 'owner';
      case FamilyRoleEnum.MODERATOR: return 'moderator';
      case FamilyRoleEnum.MEMBER: return 'member';
      case FamilyRoleEnum.CHILD: return 'child';
      default: return 'member';
    }
  }

  getPrivacyLabel(privacy: FamilyPrivacyEnum): string {
    switch (privacy) {
      case FamilyPrivacyEnum.PUBLIC: return 'Public';
      case FamilyPrivacyEnum.PRIVATE: return 'Private';
      case FamilyPrivacyEnum.INVITE_ONLY: return 'Invite Only';
      default: return 'Unknown';
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInDays < 1) return 'today';
    if (diffInDays < 7) return `${Math.floor(diffInDays)} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  }

  isCurrentUser(member: FamilyMember): boolean {
    const currentUser = this.authService.user();
    return currentUser?.id === member.userId;
  }

  canManageFamily(): boolean {
    return this.family ? this.familyService.canManageFamily(this.family) : false;
  }

  canInviteMembers(): boolean {
    return this.family ? this.familyService.canInviteMembers(this.family) : false;
  }

  canManageMembers(): boolean {
    return this.family ? this.familyService.canManageMembers(this.family) : false;
  }

  canManageMember(member: FamilyMember): boolean {
    if (!this.family || !this.canManageMembers()) return false;

// Owners can manage everyone except other owners
// Moderators can manage members and children but not owners or other moderators
    const currentRole = this.family.currentUserRole;
    if (currentRole === FamilyRoleEnum.OWNER) {
      return member.role !== FamilyRoleEnum.OWNER || this.isCurrentUser(member);
    }

    if (currentRole === FamilyRoleEnum.MODERATOR) {
      return member.role === FamilyRoleEnum.MEMBER || member.role === FamilyRoleEnum.CHILD;
    }

    return false;
  }

  isOwner(): boolean {
    return this.family ? this.familyService.isOwner(this.family) : false;
  }

  getMemberStatusIcon(member: FamilyMember): string {
    if (member.lastSeenAt) {
      const lastSeen = new Date(member.lastSeenAt);
      const now = new Date();
      const diffInHours = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) return 'radio-button-on-outline';
      if (diffInHours < 24) return 'time-outline';
      return 'radio-button-off-outline';
    }
    return 'radio-button-off-outline';
  }

  getMemberStatusColor(member: FamilyMember): string {
    if (member.lastSeenAt) {
      const lastSeen = new Date(member.lastSeenAt);
      const now = new Date();
      const diffInHours = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) return '#22c55e';
      if (diffInHours < 24) return '#f59e0b';
      return '#6b7280';
    }
    return '#6b7280';
  }

  getMemberStatusText(member: FamilyMember): string {
    if (member.lastSeenAt) {
      const lastSeen = new Date(member.lastSeenAt);
      const now = new Date();
      const diffInHours = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) return 'Active now';
      if (diffInHours < 24) return `Active ${Math.floor(diffInHours)}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      return `Active ${diffInDays}d ago`;
    }
    return 'Never active';
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }
}
