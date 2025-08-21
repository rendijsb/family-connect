import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonButtons, IonRefresher, IonRefresherContent,
  IonFab, IonFabButton, IonFabList, IonSkeletonText, IonAvatar,
  ActionSheetController, AlertController, ToastController, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, peopleOutline, addOutline, notificationsOutline,
  ellipsisVerticalOutline, ellipsisHorizontalOutline, eyeOutline,
  chatbubbleOutline, settingsOutline, timeOutline, globeOutline,
  lockClosedOutline, keyOutline, copyOutline, shareOutline,
  trashOutline, createOutline, exitOutline, personAddOutline
} from 'ionicons/icons';

import { FamilyService } from '../../core/services/family/family.service';
import { AuthService } from '../../core/services/auth/auth.service';
import {
  Family,
  FamilyRoleEnum,
  FamilyPrivacyEnum,
  getFamilyRoleName
} from '../../models/families/family.models';

@Component({
  selector: 'app-family',
  templateUrl: './family.page.html',
  styleUrls: ['./family.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonButton, IonIcon, IonButtons, IonRefresher, IonRefresherContent,
    IonFab, IonFabButton, IonFabList, IonSkeletonText, IonAvatar
  ]
})
export class FamilyPage implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly router = inject(Router);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly modalController = inject(ModalController);

  readonly familyService = inject(FamilyService);
  readonly authService = inject(AuthService);

  families: Family[] = [];
  isLoading = false;

  constructor() {
    this.addIcons();
  }

  ngOnInit() {
    this.loadFamilies();
    this.subscribeToFamilies();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private addIcons() {
    addIcons({
      homeOutline, peopleOutline, addOutline, notificationsOutline,
      ellipsisVerticalOutline, ellipsisHorizontalOutline, eyeOutline,
      chatbubbleOutline, settingsOutline, timeOutline, globeOutline,
      lockClosedOutline, keyOutline, copyOutline, shareOutline,
      trashOutline, createOutline, exitOutline, personAddOutline
    });
  }

  private subscribeToFamilies() {
    this.familyService.families$
      .pipe(takeUntil(this.destroy$))
      .subscribe(families => {
        this.families = families;
      });
  }

  private loadFamilies() {
    this.isLoading = true;
    this.familyService.getMyFamilies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  // Event Handlers
  doRefresh(event: any) {
    this.familyService.getMyFamilies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        complete: () => {
          event.target.complete();
        },
        error: () => {
          event.target.complete();
        }
      });
  }

  async createFamily() {
    await this.router.navigate(['/family/create']);
  }

  async joinFamily() {
    const alert = await this.alertController.create({
      header: 'Join Family',
      message: 'Enter the family join code to join an existing family.',
      cssClass: 'custom-alert',
      inputs: [
        {
          name: 'joinCode',
          type: 'text',
          placeholder: 'Enter join code',
          attributes: {
            maxlength: 8,
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Join',
          handler: (data) => {
            if (data.joinCode && data.joinCode.trim()) {
              this.handleJoinFamily(data.joinCode.trim().toUpperCase());
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private handleJoinFamily(joinCode: string) {
    this.familyService.joinFamilyByCode({ joinCode })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (family) => {
          this.router.navigate(['/family', family.data.slug]);
        },
        error: (error) => {
          console.error('Join family error:', error);
        }
      });
  }

  async openFamily(family: Family, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

      if (!family.slug) {
        await this.showErrorToast('Invalid family data');
        return;
      }

      if (!family.currentUserRole) {
        await this.showErrorToast('You do not have access to this family');
        return;
      }

      const navigationSuccess = await this.router.navigate(['/family', family.slug]);

      if (!navigationSuccess) {
        await this.showErrorToast('Failed to open family page');
      }
  }

  async openFamilyChat(family: Family, event: Event) {
    event.stopPropagation();
    await this.router.navigate(['/family', family.slug, 'chat']);
  }

  async openFamilySettings(family: Family, event: Event) {
    event.stopPropagation();
    await this.router.navigate(['/family', family.slug, 'settings']);
  }

  async presentFamilyOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Family Options',
      buttons: [
        {
          text: 'Create New Family',
          icon: 'home-outline',
          handler: () => this.createFamily()
        },
        {
          text: 'Join Family',
          icon: 'people-outline',
          handler: () => this.joinFamily()
        },
        {
          text: 'Refresh',
          icon: 'refresh-outline',
          handler: () => this.loadFamilies()
        },
        {
          text: 'Cancel',
          role: 'cancel',
          icon: 'close-outline'
        }
      ]
    });

    await actionSheet.present();
  }

  async presentFamilyActionSheet(family: Family, event: Event) {
    event.stopPropagation();

    const buttons: any[] = [
      {
        text: 'View Family',
        icon: 'eye-outline',
        handler: () => this.openFamily(family)
      },
      {
        text: 'Chat',
        icon: 'chatbubble-outline',
        handler: () => this.openFamilyChat(family, event)
      }
    ];

    if (this.canManageFamily(family)) {
      buttons.push(
        {
          text: 'Settings',
          icon: 'settings-outline',
          handler: () => this.openFamilySettings(family, event)
        },
        {
          text: 'Invite Members',
          icon: 'person-add-outline',
          handler: () => this.inviteToFamily(family)
        }
      );

      if (family.joinCode) {
        buttons.push({
          text: 'Share Join Code',
          icon: 'share-outline',
          handler: () => this.shareJoinCode(family)
        });
      }
    }

    if (family.currentUserRole === FamilyRoleEnum.OWNER) {
      buttons.push({
        text: 'Delete Family',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => this.confirmDeleteFamily(family)
      });
    } else {
      buttons.push({
        text: 'Leave Family',
        icon: 'exit-outline',
        role: 'destructive',
        handler: () => this.confirmLeaveFamily(family)
      });
    }

    buttons.push({
      text: 'Cancel',
      role: 'cancel',
      icon: 'close-outline'
    });

    const actionSheet = await this.actionSheetController.create({
      header: family.name,
      buttons
    });

    await actionSheet.present();
  }

  async presentFabOptions() {
    // This is handled by the ion-fab-list in the template
  }

  // Family Actions
  async copyJoinCode(joinCode: string, event: Event) {
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(joinCode);
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

  async shareJoinCode(family: Family) {
    if (navigator.share && family.joinCode) {
      try {
        await navigator.share({
          title: `Join ${family.name}`,
          text: `You're invited to join the "${family.name}" family on Family Connect!`,
          url: `familyconnect://join/${family.joinCode}`
        });
      } catch (error) {
        console.error('Share failed:', error);
        this.copyJoinCode(family.joinCode, {} as Event);
      }
    } else if (family.joinCode) {
      this.copyJoinCode(family.joinCode, {} as Event);
    }
  }

  async inviteToFamily(family: Family) {
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
              this.handleInviteMember(family, data.email.trim(), data.role);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private handleInviteMember(family: Family, email: string, role: FamilyRoleEnum) {
    this.familyService.inviteFamilyMember(family.slug, email, role)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  async confirmLeaveFamily(family: Family) {
    const alert = await this.alertController.create({
      header: 'Leave Family',
      message: `Are you sure you want to leave "${family.name}"? You'll need a new invitation to rejoin.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Leave',
          role: 'destructive',
          handler: () => {
            this.familyService.leaveFamily(family.slug)
              .pipe(takeUntil(this.destroy$))
              .subscribe();
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmDeleteFamily(family: Family) {
    const alert = await this.alertController.create({
      header: 'Delete Family',
      message: `Are you sure you want to permanently delete "${family.name}"? This action cannot be undone and all family data will be lost.`,
      inputs: [
        {
          name: 'confirmation',
          type: 'text',
          placeholder: `Type "${family.name}" to confirm`
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
            if (data.confirmation === family.name) {
              this.familyService.deleteFamily(family.slug)
                .pipe(takeUntil(this.destroy$))
                .subscribe();
            } else {
              this.showErrorToast('Family name does not match. Please try again.');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Utility Methods
  trackByFamilyId(index: number, family: Family): number {
    return family.id;
  }

  getFamilyRoleName(role: FamilyRoleEnum): string {
    return getFamilyRoleName(role);
  }

  getPrivacyLabel(privacy: FamilyPrivacyEnum): string {
    switch (privacy) {
      case FamilyPrivacyEnum.PUBLIC: return 'Public';
      case FamilyPrivacyEnum.PRIVATE: return 'Private';
      case FamilyPrivacyEnum.INVITE_ONLY: return 'Invite Only';
      default: return 'Unknown';
    }
  }

  getTimeAgo(dateString?: string): string {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInDays < 7) return `${Math.floor(diffInDays)}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return `${Math.floor(diffInDays / 30)}mo ago`;
  }

  canManageFamily(family: Family): boolean {
    return this.familyService.canManageFamily(family);
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
