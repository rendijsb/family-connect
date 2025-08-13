// frontend/src/app/pages/families/family-members/family-members.page.ts
import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonIcon, IonBackButton, IonButtons, IonRefresher, IonRefresherContent, IonBadge,
  IonSpinner, IonSegment, IonSegmentButton, IonLabel, IonAvatar, IonSearchbar, IonFab, IonFabButton,
  PopoverController, AlertController, ToastController, ActionSheetController
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  peopleOutline, personAddOutline, ellipsisVerticalOutline, ellipsisHorizontalOutline,
  cropOutline, shieldOutline, personOutline, banOutline, chatbubbleOutline,
  searchOutline, checkmarkOutline, closeOutline, warningOutline, callOutline
} from 'ionicons/icons';
import { FamilyService } from '../../../core/services/families/family.service';
import { FamilyMemberService } from '../../../core/services/families/family-member.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import {
  Family, FamilyMember, FamilyRole, FamilyMemberStatus
} from '../../../models/families/family.models';
import { Subject, takeUntil, switchMap, finalize } from 'rxjs';

@Component({
  selector: 'app-family-members',
  templateUrl: './family-members.page.html',
  styleUrls: ['./family-members.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonButton, IonIcon, IonBackButton, IonButtons, IonRefresher, IonRefresherContent, IonBadge,
    IonSpinner, IonSegment, IonSegmentButton, IonLabel, IonAvatar, IonSearchbar, IonFab, IonFabButton
  ]
})
export class FamilyMembersPage implements OnInit, OnDestroy {
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
  searchTerm = signal<string>('');
  selectedFilter = signal<string>('all');
  isLoading = signal<boolean>(false);
  members = signal<FamilyMember[]>([]);

  // Computed properties
  family = computed(() => this.familyService.currentFamily());
  currentUser = computed(() => this.authService.user());

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

  // Filtered members
  filteredMembers = computed(() => {
    const allMembers = this.members();
    const search = this.searchTerm().toLowerCase();
    const filter = this.selectedFilter();

    let filtered = allMembers;

    // Apply text search
    if (search) {
      filtered = filtered.filter(member =>
        member.user?.name?.toLowerCase().includes(search) ||
        member.user?.email?.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    switch (filter) {
      case 'active':
        filtered = filtered.filter(member => member.status === FamilyMemberStatus.ACTIVE);
        break;
      case 'admins':
        filtered = filtered.filter(member =>
          member.role === FamilyRole.ADMIN || member.role === FamilyRole.OWNER
        );
        break;
      // 'all' shows everyone
    }

    return filtered.sort((a, b) => {
      // Sort by role priority: owner > admin > member > child
      const roleOrder = { owner: 0, admin: 1, member: 2, child: 3 };
      const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 99;
      const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 99;

      if (aOrder !== bOrder) return aOrder - bOrder;

      // Then by name
      return (a.user?.name || '').localeCompare(b.user?.name || '');
    });
  });

  // Member categories
  familyOwner = computed(() => {
    const fam = this.family();
    if (!fam) return null;

    return this.members().find(member =>
      member.userId === fam.ownerId || member.role === FamilyRole.OWNER
    ) || null;
  });

  regularMembers = computed(() => {
    const owner = this.familyOwner();
    return this.filteredMembers().filter(member =>
      member.id !== owner?.id &&
      member.status !== FamilyMemberStatus.BLOCKED
    );
  });

  blockedMembers = computed(() => {
    return this.members().filter(member =>
      member.status === FamilyMemberStatus.BLOCKED
    );
  });

  constructor() {
    addIcons({
      peopleOutline, personAddOutline, ellipsisVerticalOutline, ellipsisHorizontalOutline,
      cropOutline, shieldOutline, personOutline, banOutline, chatbubbleOutline,
      searchOutline, checkmarkOutline, closeOutline, warningOutline, callOutline
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
        this.loadMembers();
      },
      error: (error) => {
        console.error('Error loading family:', error);
        this.router.navigate(['/families']);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Data loading
  private loadMembers() {
    const id = this.familyId();
    if (!id) return;

    this.isLoading.set(true);

    this.memberService.getMembers(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (members) => {
          this.members.set(members);
        },
        error: (error) => {
          console.error('Error loading members:', error);
          this.showToast('Failed to load family members', 'danger');
        }
      });
  }

  doRefresh(event: any) {
    this.loadMembers();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  // Search and filtering
  onSearch(event: any) {
    this.searchTerm.set(event.target.value || '');
  }

  onFilterChange(event: any) {
    this.selectedFilter.set(event.detail.value);
  }

  // Navigation
  onViewMemberProfile(member: FamilyMember) {
    this.router.navigate(['/families', this.familyId(), 'members', member.userId]);
  }

  onInviteMembers() {
    this.router.navigate(['/families', this.familyId(), 'invite']);
  }

  // Member actions
  onMessageMember(member: FamilyMember) {
    // Navigate to chat with member
    this.router.navigate(['/families', this.familyId(), 'chat'], {
      queryParams: { member: member.userId }
    });
  }

  async onMemberActions(event: Event, member: FamilyMember) {
    event.stopPropagation();

    const canPromote = this.canPromoteMember(member);
    const canDemote = this.canDemoteMember(member);
    const canRemove = this.canRemoveMember(member);
    const canBlock = this.canBlockMember(member);

    const buttons: any = [
      {
        text: 'View Profile',
        icon: 'person-outline',
        handler: () => this.onViewMemberProfile(member)
      },
      {
        text: 'Message',
        icon: 'chatbubble-outline',
        handler: () => this.onMessageMember(member)
      }
    ];

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
      header: `Actions for ${member.user?.name}`,
      buttons
    });

    await actionSheet.present();
  }

  // Member management actions
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
              next: () => {
                this.loadMembers();
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
              next: () => {
                this.loadMembers();
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
                next: () => {
                  this.loadMembers();
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
                  this.loadMembers();
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

  async onUnblockMember(member: FamilyMember) {
    this.memberService.unblockMember(this.familyId(), member.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadMembers();
          this.showToast(`${member.user?.name} has been unblocked`, 'success');
        }
      });
  }

  // Menu actions
  async onShowMembersMenu(event: Event) {
    // Show members management menu
    this.showToast('Members menu coming soon!', 'primary');
  }

  // Permission checks
  private canPromoteMember(member: FamilyMember): boolean {
    return this.canManage() &&
      member.role === FamilyRole.MEMBER &&
      member.status === FamilyMemberStatus.ACTIVE;
  }

  private canDemoteMember(member: FamilyMember): boolean {
    return this.canManage() &&
      member.role === FamilyRole.ADMIN &&
      member.status === FamilyMemberStatus.ACTIVE;
  }

  private canRemoveMember(member: FamilyMember): boolean {
    const fam = this.family();
    return this.canManage() &&
      fam?.ownerId !== member.userId &&
      member.role !== FamilyRole.OWNER;
  }

  private canBlockMember(member: FamilyMember): boolean {
    const fam = this.family();
    return this.canManage() &&
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

  isMemberOnline(member: FamilyMember): boolean {
    if (!member.lastActivityAt) return false;

    const lastActivity = new Date(member.lastActivityAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

    return diffMinutes < 5; // Consider online if active within 5 minutes
  }

  getTotalMembers(): number {
    return this.members().length;
  }

  getActiveMembers(): number {
    return this.members().filter(m => m.status === FamilyMemberStatus.ACTIVE).length;
  }

  getAdminMembers(): number {
    return this.members().filter(m =>
      m.role === FamilyRole.ADMIN || m.role === FamilyRole.OWNER
    ).length;
  }

  trackByMemberId(index: number, member: FamilyMember): number {
    return member.id;
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
