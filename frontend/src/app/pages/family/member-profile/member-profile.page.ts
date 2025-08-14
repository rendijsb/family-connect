import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText,
  IonBackButton, IonButtons, IonGrid, IonRow, IonCol, IonAvatar,
  IonChip, IonLabel, IonBadge, IonList, IonItem, IonToggle,
  IonActionSheet, ActionSheetController, AlertController, ToastController
} from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, finalize, combineLatest } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, personOutline, chatbubbleOutline, callOutline,
  videocamOutline, mailOutline, phonePortraitOutline, locationOutline,
  calendarOutline, shieldCheckmarkOutline, settingsOutline,
  ellipsisVerticalOutline, informationCircleOutline, timeOutline,
  radioButtonOnOutline, cropOutline, personRemoveOutline,
  createOutline, bookOutline, flagOutline
} from 'ionicons/icons';

import { FamilyService } from '../../../core/services/family/family.service';
import { FamilyMemberService } from '../../../core/services/family/family-member.service';
import {
  Family,
  FamilyMember,
  FamilyRoleEnum,
  UpdateMemberRequest
} from '../../../models/families/family.models';

@Component({
  selector: 'app-member-profile',
  templateUrl: './member-profile.page.html',
  styleUrls: ['./member-profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText,
    IonBackButton, IonButtons, IonGrid, IonRow, IonCol, IonAvatar,
    IonChip, IonLabel, IonBadge, IonList, IonItem, IonToggle
  ]
})
export class MemberProfilePage implements OnInit, OnDestroy {
  private readonly familyService = inject(FamilyService);
  private readonly memberService = inject(FamilyMemberService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly destroy$ = new Subject<void>();

  currentFamily = signal<Family | null>(null);
  member = signal<FamilyMember | null>(null);
  currentUserMember = signal<FamilyMember | null>(null);
  isLoading = signal<boolean>(false);
  memberId = signal<number | null>(null);

  readonly FamilyRoleEnum = FamilyRoleEnum;

  constructor() {
    addIcons({
      arrowBackOutline, personOutline, chatbubbleOutline, callOutline,
      videocamOutline, mailOutline, phonePortraitOutline, locationOutline,
      calendarOutline, shieldCheckmarkOutline, settingsOutline,
      ellipsisVerticalOutline, informationCircleOutline, timeOutline,
      radioButtonOnOutline, cropOutline, personRemoveOutline,
      createOutline, bookOutline, flagOutline
    });
  }

  ngOnInit() {
    this.loadMemberId();
    this.loadCurrentFamily();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMemberId() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.memberId.set(parseInt(id, 10));
      this.loadMemberData();
    }
  }

  private loadCurrentFamily() {
    this.familyService.currentFamily$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(family => {
      this.currentFamily.set(family);
      if (family) {
        this.loadCurrentUserMembership(family.id);
      }
    });
  }

  private loadCurrentUserMembership(familyId: number) {
    this.memberService.getCurrentUserMembership(familyId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (membership) => {
        this.currentUserMember.set(membership);
      }
    });
  }

  private loadMemberData() {
    const family = this.currentFamily();
    const memberId = this.memberId();

    if (!family || !memberId) return;

    this.isLoading.set(true);

    this.memberService.getMemberById(family.id, memberId).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (member) => {
        this.member.set(member);
      },
      error: async () => {
        await this.showToast('Failed to load member profile', 'danger');
        this.router.navigate(['/family/members']);
      }
    });
  }

  // Member Actions
  onChatClick() {
    const member = this.member();
    if (member) {
      // Navigate to chat with member
      // TODO: Implement chat navigation
      this.showToast(`Opening chat with ${member.displayName}`, 'success');
    }
  }

  onCallClick() {
    const member = this.member();
    if (member) {
      // Initiate voice call
      // TODO: Implement calling functionality
      this.showToast(`Calling ${member.displayName}`, 'success');
    }
  }

  onVideoCallClick() {
    const member = this.member();
    if (member) {
      // Initiate video call
      // TODO: Implement video calling functionality
      this.showToast(`Starting video call with ${member.displayName}`, 'success');
    }
  }

  onEmailClick() {
    const member = this.member();
    if (member?.user.email) {
      window.open(`mailto:${member.user.email}`, '_system');
    }
  }

  onPhoneClick() {
    const member = this.member();
    if (member?.user.phone) {
      window.open(`tel:${member.user.phone}`, '_system');
    }
  }

  async onManageClick() {
    const member = this.member();
    const currentUser = this.currentUserMember();

    if (!member || !currentUser) return;

    const canManage = this.memberService.canUserManageMember(currentUser, member);
    const canRemove = this.memberService.canUserRemoveMember(currentUser, member);
    const canChangeRole = this.memberService.canUserChangeRole(currentUser, member);

    const buttons = [];

    if (canChangeRole) {
      buttons.push({
        text: 'Change Role',
        icon: 'shield-checkmark-outline',
        handler: () => {
          this.showChangeRoleDialog();
        }
      });
    }

    if (canManage) {
      buttons.push({
        text: 'Edit Nickname',
        icon: 'create-outline',
        handler: () => {
          this.showEditNicknameDialog();
        }
      });
    }

    if (currentUser.userId !== member.userId) {
      buttons.push({
        text: 'Report Member',
        icon: 'flag-outline',
        handler: () => {
          this.reportMember();
        }
      });
    }

    if (canRemove) {
      buttons.push({
        text: 'Remove Member',
        icon: 'person-remove-outline',
        role: 'destructive',
        handler: () => {
          this.confirmRemoveMember();
        }
      });
    }

    buttons.push({
      text: 'Cancel',
      icon: 'close-outline',
      role: 'cancel'
    });

    const actionSheet = await this.actionSheetController.create({
      header: `Manage ${member.displayName}`,
      buttons
    });

    await actionSheet.present();
  }

  private async showChangeRoleDialog() {
    const member = this.member();
    if (!member) return;

    const alert = await this.alertController.create({
      header: 'Change Role',
      message: `Select a new role for ${member.displayName}`,
      inputs: [
        {
          name: 'role',
          type: 'radio',
          label: 'Owner',
          value: FamilyRoleEnum.OWNER,
          checked: member.role === FamilyRoleEnum.OWNER
        },
        {
          name: 'role',
          type: 'radio',
          label: 'Admin',
          value: FamilyRoleEnum.ADMIN,
          checked: member.role === FamilyRoleEnum.ADMIN
        },
        {
          name: 'role',
          type: 'radio',
          label: 'Member',
          value: FamilyRoleEnum.MEMBER,
          checked: member.role === FamilyRoleEnum.MEMBER
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Update',
          handler: (data) => {
            if (data.role && data.role !== member.role) {
              this.updateMemberRole(data.role);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async showEditNicknameDialog() {
    const member = this.member();
    if (!member) return;

    const alert = await this.alertController.create({
      header: 'Edit Nickname',
      message: `Change nickname for ${member.user.name}`,
      inputs: [
        {
          name: 'nickname',
          type: 'text',
          placeholder: 'Enter nickname',
          value: member.nickname || ''
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Update',
          handler: (data) => {
            if (data.nickname !== undefined) {
              this.updateMemberNickname(data.nickname);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async confirmRemoveMember() {
    const member = this.member();
    if (!member) return;

    const alert = await this.alertController.create({
      header: 'Remove Member',
      message: `Are you sure you want to remove ${member.displayName} from the family?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.removeMember();
          }
        }
      ]
    });

    await alert.present();
  }

  private async reportMember() {
    const member = this.member();
    if (!member) return;

    const alert = await this.alertController.create({
      header: 'Report Member',
      message: `Report ${member.displayName} for inappropriate behavior?`,
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Describe the issue...'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Report',
          handler: (data) => {
            // TODO: Implement reporting functionality
            this.showToast('Report submitted', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  private updateMemberRole(newRole: FamilyRoleEnum) {
    const family = this.currentFamily();
    const member = this.member();

    if (!family || !member) return;

    this.memberService.updateMemberRole(family.id, member.id, newRole).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedMember) => {
        this.member.set(updatedMember);
        this.showToast('Role updated successfully', 'success');
      }
    });
  }

  private updateMemberNickname(nickname: string) {
    const family = this.currentFamily();
    const member = this.member();

    if (!family || !member) return;

    this.memberService.updateMemberNickname(family.id, member.id, nickname).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedMember) => {
        this.member.set(updatedMember);
        this.showToast('Nickname updated successfully', 'success');
      }
    });
  }

  private async removeMember() {
    const family = this.currentFamily();
    const member = this.member();

    if (!family || !member) return;

    this.memberService.removeMember(family.id, member.id).then(observable => {
      observable.pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: async () => {
          await this.showToast('Member removed successfully', 'success');
          this.router.navigate(['/family/members']);
        }
      });
    });
  }

  // Helper Methods
  getRoleIcon(): string {
    const member = this.member();
    if (!member) return 'person-outline';

    switch (member.role) {
      case FamilyRoleEnum.OWNER: return 'crown-outline';
      case FamilyRoleEnum.ADMIN: return 'shield-checkmark-outline';
      case FamilyRoleEnum.MEMBER: return 'person-outline';
      default: return 'person-outline';
    }
  }

  getRoleColor(): string {
    const member = this.member();
    if (!member) return '#6b7280';

    switch (member.role) {
      case FamilyRoleEnum.OWNER: return '#dc2626';
      case FamilyRoleEnum.ADMIN: return '#3b82f6';
      case FamilyRoleEnum.MEMBER: return '#22c55e';
      default: return '#6b7280';
    }
  }

  getRoleDescription(): string {
    const member = this.member();
    if (!member) return '';

    switch (member.role) {
      case FamilyRoleEnum.OWNER: return 'Can manage all family settings and members';
      case FamilyRoleEnum.ADMIN: return 'Can manage members and family settings';
      case FamilyRoleEnum.MEMBER: return 'Can participate in family activities';
      default: return '';
    }
  }

  getStatusColor(): string {
    const member = this.member();
    return member?.isOnline ? '#22c55e' : '#6b7280';
  }

  formatLastSeen(): string {
    const member = this.member();
    if (!member) return 'Unknown';

    if (member.isOnline) return 'Online now';
    return this.memberService.formatLastSeen(member.lastActiveAt);
  }

  formatJoinDate(): string {
    const member = this.member();
    if (!member) return '';

    return new Date(member.joinedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  canManageMember(): boolean {
    const currentUser = this.currentUserMember();
    const member = this.member();

    if (!currentUser || !member) return false;

    return this.memberService.canUserManageMember(currentUser, member);
  }

  canRemoveMember(): boolean {
    const currentUser = this.currentUserMember();
    const member = this.member();

    if (!currentUser || !member) return false;

    return this.memberService.canUserRemoveMember(currentUser, member);
  }

  isCurrentUser(): boolean {
    const currentUser = this.currentUserMember();
    const member = this.member();

    return currentUser?.userId === member?.userId;
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
