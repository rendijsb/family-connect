import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonBackButton, IonButtons, IonRefresher, IonRefresherContent,
  IonSpinner, IonSearchbar, IonSegment, IonSegmentButton, IonLabel, IonChip,
  IonFab, IonFabButton, IonCardHeader, IonCardTitle, PopoverController,
  AlertController, ModalController, IonPopover, IonList, IonItem, IonItemGroup, IonItemDivider
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  peopleOutline, addOutline, addCircleOutline, refreshOutline, linkOutline,
  ellipsisVerticalOutline, chatbubbleOutline, cameraOutline, calendarOutline,
  personAddOutline, checkmarkCircleOutline, archiveOutline, globeOutline,
  lockClosedOutline, cropOutline, shieldOutline, personOutline, pulseOutline,
  settingsOutline, exitOutline, trashOutline, shareOutline, copyOutline
} from 'ionicons/icons';
import { FamilyService } from '../../../core/services/families/family.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Family } from '../../../models/families/family.models';
import {from, Subject, switchMap, takeUntil} from 'rxjs';
import { FamilyMenuComponent } from '../family-menu/family-menu.component';

@Component({
  selector: 'app-family-list',
  templateUrl: './family-list.page.html',
  styleUrls: ['./family-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonButton, IonIcon, IonBackButton, IonButtons, IonRefresher, IonRefresherContent,
    IonSpinner, IonSearchbar, IonSegment, IonSegmentButton, IonLabel, IonChip,
    IonFab, IonFabButton,
  ]
})
export class FamilyListPage implements OnInit, OnDestroy {
  private readonly familyService = inject(FamilyService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly popoverController = inject(PopoverController);
  private readonly alertController = inject(AlertController);
  private readonly modalController = inject(ModalController);
  private readonly destroy$ = new Subject<void>();

  // State
  searchTerm = signal<string>('');
  selectedFilter = signal<string>('all');

  // Computed properties
  families = computed(() => this.familyService.families());
  isLoading = computed(() => this.familyService.isLoading());

  filteredFamilies = computed(() => {
    const allFamilies = this.families();
    const search = this.searchTerm().toLowerCase();
    const filter = this.selectedFilter();
    const userId = this.authService.user()?.id;

    let filtered = allFamilies;

    // Apply text search
    if (search) {
      filtered = filtered.filter(family =>
        family.name.toLowerCase().includes(search) ||
        family.description?.toLowerCase().includes(search)
      );
    }

    // Apply role filter
    if (filter !== 'all' && userId) {
      filtered = filtered.filter(family => {
        if (filter === 'owner') {
          return family.ownerId === userId;
        } else if (filter === 'member') {
          return family.ownerId !== userId;
        }
        return true;
      });
    }

    // Sort by: owner first, then by creation date
    return filtered.sort((a, b) => {
      if (userId) {
        const aIsOwner = a.ownerId === userId ? 1 : 0;
        const bIsOwner = b.ownerId === userId ? 1 : 0;
        if (aIsOwner !== bIsOwner) {
          return bIsOwner - aIsOwner; // Owner families first
        }
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  constructor() {
    addIcons({
      peopleOutline, addOutline, addCircleOutline, refreshOutline, linkOutline,
      ellipsisVerticalOutline, chatbubbleOutline, cameraOutline, calendarOutline,
      personAddOutline, checkmarkCircleOutline, archiveOutline, globeOutline,
      lockClosedOutline, cropOutline, shieldOutline, personOutline, pulseOutline,
      settingsOutline, exitOutline, trashOutline, shareOutline, copyOutline
    });
  }

  ngOnInit() {
    this.loadFamilies();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Data loading
  loadFamilies() {
    this.familyService.getFamilies()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  onRefresh() {
    this.loadFamilies();
  }

  doRefresh(event: any) {
    this.familyService.getFamilies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        complete: () => event.target.complete(),
        error: () => event.target.complete()
      });
  }

  // Search and filtering
  onSearch(event: any) {
    this.searchTerm.set(event.target.value || '');
  }

  onFilterChange(event: any) {
    this.selectedFilter.set(event.detail.value);
  }

  onSelectFamily(family: Family) {
    this.familyService.setCurrentFamily(family);
    this.router.navigate(['/families', family.id, 'dashboard']);
  }

  onCreateFamily() {
    this.router.navigate(['/families/create']);
  }

  async onJoinByCode() {
    const alert = await this.alertController.create({
      header: 'Join Family',
      message: 'Enter the family invite code',
      inputs: [
        {
          name: 'inviteCode',
          type: 'text',
          placeholder: 'Enter invite code',
          attributes: {
            maxlength: 8,
            style: 'text-transform: uppercase;'
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
            if (data.inviteCode) {
              this.joinByCode(data.inviteCode.toUpperCase());
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private joinByCode(code: string) {
    this.familyService.joinFamilyByCode(code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (family) => {
          this.router.navigate(['/families', family.id, 'dashboard']);
        }
      });
  }

  // Family actions
  async onShowFamilyMenu(event: Event, family: Family) {
    event.stopPropagation();

    const popover = await this.popoverController.create({
      component: FamilyMenuComponent,
      componentProps: {
        family: family,
        userRole: this.getUserRole(family)
      },
      event: event,
      translucent: true
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();
    if (data?.action) {
      this.handleFamilyAction(data.action, family);
    }
  }

  private handleFamilyAction(action: string, family: Family) {
    switch (action) {
      case 'view':
        this.onSelectFamily(family);
        break;
      case 'settings':
        this.router.navigate(['/families', family.id, 'settings']);
        break;
      case 'members':
        this.router.navigate(['/families', family.id, 'members']);
        break;
      case 'invite':
        this.router.navigate(['/families', family.id, 'invite']);
        break;
      case 'share':
        this.shareFamily(family);
        break;
      case 'leave':
        this.leaveFamily(family);
        break;
      case 'delete':
        this.deleteFamily(family);
        break;
      case 'archive':
        this.archiveFamily(family);
        break;
      case 'restore':
        this.restoreFamily(family);
        break;
    }
  }

  // Quick actions
  onFamilyChat(event: Event, family: Family) {
    event.stopPropagation();
    // Navigate to family chat
    this.router.navigate(['/families', family.id, 'chat']);
  }

  onFamilyPhotos(event: Event, family: Family) {
    event.stopPropagation();
    // Navigate to family photos
    this.router.navigate(['/families', family.id, 'photos']);
  }

  onFamilyEvents(event: Event, family: Family) {
    event.stopPropagation();
    // Navigate to family events
    this.router.navigate(['/families', family.id, 'events']);
  }

  onInviteMembers(event: Event, family: Family) {
    event.stopPropagation();
    this.router.navigate(['/families', family.id, 'invite']);
  }

  // Family operations
  private shareFamily(family: Family) {
    if (navigator.share) {
      navigator.share({
        title: `Join ${family.name} on Family Connect`,
        text: `You've been invited to join ${family.name}!`,
        url: `${window.location.origin}/families/join/${family.inviteCode}`
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(family.inviteCode);
      // Show toast with copied message
    }
  }

  private async leaveFamily(family: Family) {
    const alert = await this.alertController.create({
      header: 'Leave Family',
      message: `Are you sure you want to leave "${family.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Leave',
          role: 'destructive',
          handler: () => {
            from(this.familyService.leaveFamily(family.id))
              .pipe(
                switchMap(obs => obs),
                takeUntil(this.destroy$)
              )
              .subscribe();
          }
        }
      ]
    });

    await alert.present();
  }

  private async deleteFamily(family: Family) {
    const alert = await this.alertController.create({
      header: 'Delete Family',
      message: `Are you sure you want to permanently delete "${family.name}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            from(this.familyService.deleteFamily(family.id))
              .pipe(
                switchMap(obs => obs),
                takeUntil(this.destroy$)
              )
              .subscribe();
          }
        }
      ]
    });

    await alert.present();
  }

  private archiveFamily(family: Family) {
    from(this.familyService.archiveFamily(family.id))
      .pipe(
        switchMap(obs => obs),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private restoreFamily(family: Family) {
    this.familyService.restoreFamily(family.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  // Utility methods
  getUserRole(family: Family): string {
    const userId = this.authService.user()?.id;
    if (!userId) return 'member';

    return this.familyService.getUserRoleInFamily(family, userId) || 'member';
  }

  getRoleIcon(family: Family): string {
    const role = this.getUserRole(family);
    switch (role) {
      case 'owner': return 'crown-outline';
      case 'admin': return 'shield-outline';
      default: return 'person-outline';
    }
  }

  getRoleDisplayName(family: Family): string {
    const role = this.getUserRole(family);
    switch (role) {
      case 'owner': return 'Owner';
      case 'admin': return 'Admin';
      case 'member': return 'Member';
      case 'child': return 'Child';
      default: return 'Member';
    }
  }

  canInviteMembers(family: Family): boolean {
    const userId = this.authService.user()?.id;
    if (!userId) return false;

    return this.familyService.canManageFamily(family, userId) ||
      family.settings?.privacy?.allowMemberInvites === true;
  }

  getTotalMembers(): number {
    return this.families().reduce((total, family) => total + (family.memberCount || 0), 0);
  }

  getActiveFamilies(): number {
    return this.families().filter(family => family.isActive).length;
  }

  trackByFamilyId(index: number, family: Family): number {
    return family.id;
  }
}
