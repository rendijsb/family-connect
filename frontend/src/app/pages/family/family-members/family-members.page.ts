// family-members.page.ts
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText, IonInput,
  IonItem, IonLabel, IonBackButton, IonButtons, IonSearchbar,
  IonGrid, IonRow, IonCol, IonAvatar, IonChip, IonBadge,
  IonFab, IonFabButton, IonSegment, IonSegmentButton, IonRefresher,
  IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent,
  AlertController, ToastController, ActionSheetController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize, combineLatest } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, personAddOutline, peopleOutline, searchOutline,
  filterOutline, ellipsisVerticalOutline, chatbubbleOutline,
  callOutline, videocamOutline, settingsOutline, mailOutline,
  personRemoveOutline, shieldCheckmarkOutline, radioButtonOnOutline
} from 'ionicons/icons';

import { FamilyService } from '../../../core/services/family/family.service';
import { FamilyMemberService } from '../../../core/services/family/family-member.service';
import { MemberCardComponent } from '../../../components/family/member-card/member-card.component';
import {
  Family,
  FamilyMember,
  FamilyRoleEnum
} from '../../../models/families/family.models';

@Component({
  selector: 'app-family-members',
  templateUrl: './family-members.page.html',
  styleUrls: ['./family-members.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText, IonInput,
    IonItem, IonLabel, IonBackButton, IonButtons, IonSearchbar,
    IonGrid, IonRow, IonCol, IonAvatar, IonChip, IonBadge,
    IonFab, IonFabButton, IonSegment, IonSegmentButton, IonRefresher,
    IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent,
    MemberCardComponent
  ]
})
export class FamilyMembersPage implements OnInit, OnDestroy {
  private readonly familyService = inject(FamilyService);
  private readonly memberService = inject(FamilyMemberService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly destroy$ = new Subject<void>();

  currentFamily = signal<Family | null>(null);
  members = signal<FamilyMember[]>([]);
  filteredMembers = signal<FamilyMember[]>([]);
  currentUserMember = signal<FamilyMember | null>(null);
  isLoading = signal<boolean>(false);
  searchTerm = signal<string>('');
  selectedFilter = signal<string>('all');

  // Filter options
  filterOptions = [
    { value: 'all', label: 'All Members', icon: 'people-outline' },
    { value: 'online', label: 'Online', icon: 'radio-button-on-outline' },
    { value: 'owners', label: 'Owners', icon: 'shield-checkmark-outline' },
    { value: 'admins', label: 'Admins', icon: 'settings-outline' },
    { value: 'members', label: 'Members', icon: 'person-outline' }
  ];

  constructor() {
    addIcons({
      arrowBackOutline, personAddOutline, peopleOutline, searchOutline,
      filterOutline, ellipsisVerticalOutline, chatbubbleOutline,
      callOutline, videocamOutline, settingsOutline, mailOutline,
      personRemoveOutline, shieldCheckmarkOutline, radioButtonOnOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData() {
    combineLatest([
      this.familyService.currentFamily$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([family]) => {
      if (family) {
        this.currentFamily.set(family);
        this.loadFamilyMembers(family.id);
        this.loadCurrentUserMembership(family.id);
      }
    });
  }

  private loadFamilyMembers(familyId: number) {
    this.isLoading.set(true);

    this.memberService.getFamilyMembers(familyId).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (members) => {
        this.members.set(members);
        this.applyFilters();
      },
      error: async (error) => {
        await this.showToast('Failed to load family members', 'danger');
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

  // Search and Filter
  onSearchChange(event: any) {
    this.searchTerm.set(event.detail.value);
    this.applyFilters();
  }

  onFilterChange(event: any) {
    this.selectedFilter.set(event.detail.value);
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = [...this.members()];
    const search = this.searchTerm().toLowerCase();
    const filter = this.selectedFilter();

    // Apply search filter
    if (search) {
      filtered = filtered.filter(member =>
        member.displayName.toLowerCase().includes(search) ||
        member.user.email.toLowerCase().includes(search)
      );
    }

    // Apply role/status filter
    switch (filter) {
      case 'online':
        filtered = filtered.filter(member => member.isOnline);
        break;
      case 'owners':
        filtered = filtered.filter(member => member.role === FamilyRoleEnum.OWNER);
        break;
      case 'admins':
        filtered = filtered.filter(member => member.role === FamilyRoleEnum.ADMIN);
        break;
      case 'members':
        filtered = filtered.filter(member => member.role === FamilyRoleEnum.MEMBER);
        break;
      // 'all' shows all members
    }

    this.filteredMembers.set(filtered);
  }

  // Member Actions
  onMemberClick(member: FamilyMember) {
    this.router.navigate(['/family/members', member.id]);
  }

  onChatClick(member: FamilyMember) {
    // Navigate to chat with member
    // TODO: Implement chat navigation
    this.showToast(`Opening chat with ${member.displayName}`, 'success');
  }

  onCallClick(member: FamilyMember) {
    // Initiate voice call
    // TODO: Implement calling functionality
    this.showToast(`Calling ${member.displayName}`, 'success');
  }

  onVideoCallClick(member: FamilyMember) {
    // Initiate video call
    // TODO: Implement video calling functionality
    this.showToast(`Starting video call with ${member.displayName}`, 'success');
  }

  async onManageClick(member: FamilyMember) {
    const currentUser = this.currentUserMember();
    if (!currentUser) return;

    const canManage = this.memberService.canUserManageMember(currentUser, member);
    const canRemove = this.memberService.canUserRemoveMember(currentUser, member);
    const canChangeRole = this.memberService.canUserChangeRole(currentUser, member);

    const buttons = [];

    if (canChangeRole) {
      buttons.push({
        text: 'Change Role',
        icon: 'shield-checkmark-outline',
        handler: () => {
          this.showChangeRoleDialog(member);
        }
      });
    }

    if (canManage) {
      buttons.push({
        text: 'Edit Nickname',
        icon: 'create-outline',
        handler: () => {
          this.showEditNicknameDialog(member);
        }
      });
    }

    if (canRemove) {
      buttons.push({
        text: 'Remove Member',
        icon: 'person-remove-outline',
        role: 'destructive',
        handler: () => {
          this.confirmRemoveMember(member);
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

  private async showChangeRoleDialog(member: FamilyMember) {
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
              this.updateMemberRole(member, data.role);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async showEditNicknameDialog(member: FamilyMember) {
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
              this.updateMemberNickname(member, data.nickname);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async confirmRemoveMember(member: FamilyMember) {
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
            this.removeMember(member);
          }
        }
      ]
    });

    await alert.present();
  }

  private updateMemberRole(member: FamilyMember, newRole: FamilyRoleEnum) {
    const family = this.currentFamily();
    if (!family) return;

    this.memberService.updateMemberRole(family.id, member.id, newRole).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loadFamilyMembers(family.id);
      }
    });
  }

  private updateMemberNickname(member: FamilyMember, nickname: string) {
    const family = this.currentFamily();
    if (!family) return;

    this.memberService.updateMemberNickname(family.id, member.id, nickname).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loadFamilyMembers(family.id);
      }
    });
  }

  private async removeMember(member: FamilyMember) {
    const family = this.currentFamily();
    if (!family) return;

    this.memberService.removeMember(family.id, member.id).then(observable => {
      observable.pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadFamilyMembers(family.id);
        }
      });
    });
  }

  // Navigation
  onInviteMembers() {
    this.router.navigate(['/family/invite']);
  }

  onRefresh(event: any) {
    const family = this.currentFamily();
    if (family) {
      this.loadFamilyMembers(family.id);
    }
    event.target.complete();
  }

  // Stats and Helpers
  get totalMembers(): number {
    return this.members().length;
  }

  get onlineMembers(): number {
    return this.members().filter(m => m.isOnline).length;
  }

  get adminCount(): number {
    return this.members().filter(m =>
      m.role === FamilyRoleEnum.OWNER || m.role === FamilyRoleEnum.ADMIN
    ).length;
  }

  canUserInviteMembers(): boolean {
    const currentUser = this.currentUserMember();
    const family = this.currentFamily();

    if (!currentUser || !family) return false;

    return currentUser.permissions.canInviteMembers ||
      currentUser.role === FamilyRoleEnum.OWNER ||
      currentUser.role === FamilyRoleEnum.ADMIN;
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
