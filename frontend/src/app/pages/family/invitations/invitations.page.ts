// invitations.page.ts
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText,
  IonBackButton, IonButtons, IonSegment, IonSegmentButton,
  IonBadge, IonRefresher, IonRefresherContent, IonSearchbar,
  IonFab, IonFabButton, ToastController, AlertController, IonChip, IonLabel
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize, combineLatest } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, mailOutline, sendOutline, downloadOutline,
  personAddOutline, searchOutline, refreshOutline, filterOutline,
  checkmarkCircleOutline, closeCircleOutline, timeOutline,
  warningOutline, reloadOutline, trashOutline
} from 'ionicons/icons';

import { InvitationService } from '../../../core/services/family/invitation.service';
import { FamilyService } from '../../../core/services/family/family.service';
import { InvitationCardComponent } from '../../../components/family/invitation-card/invitation-card.component';
import {
  FamilyInvitation,
  InvitationStatusEnum,
  Family
} from '../../../models/families/family.models';

@Component({
  selector: 'app-invitations',
  templateUrl: './invitations.page.html',
  styleUrls: ['./invitations.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText,
    IonBackButton, IonButtons, IonSegment, IonSegmentButton,
    IonBadge, IonRefresher, IonRefresherContent, IonSearchbar,
    IonFab, IonFabButton, InvitationCardComponent, IonChip, IonLabel
  ]
})
export class InvitationsPage implements OnInit, OnDestroy {
  private readonly invitationService = inject(InvitationService);
  private readonly familyService = inject(FamilyService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);
  private readonly destroy$ = new Subject<void>();

  currentFamily = signal<Family | null>(null);
  receivedInvitations = signal<FamilyInvitation[]>([]);
  sentInvitations = signal<FamilyInvitation[]>([]);
  filteredReceived = signal<FamilyInvitation[]>([]);
  filteredSent = signal<FamilyInvitation[]>([]);

  selectedSegment = signal<'received' | 'sent'>('received');
  selectedFilter = signal<string>('all');
  searchTerm = signal<string>('');
  isLoading = signal<boolean>(false);
  showSearch = signal<boolean>(false);

  // Filter options
  filterOptions = [
    { value: 'all', label: 'All', icon: 'mail-outline' },
    { value: 'pending', label: 'Pending', icon: 'time-outline' },
    { value: 'accepted', label: 'Accepted', icon: 'checkmark-circle-outline' },
    { value: 'declined', label: 'Declined', icon: 'close-circle-outline' },
    { value: 'expired', label: 'Expired', icon: 'warning-outline' }
  ];

  readonly InvitationStatusEnum = InvitationStatusEnum;

  constructor() {
    addIcons({
      arrowBackOutline, mailOutline, sendOutline, downloadOutline,
      personAddOutline, searchOutline, refreshOutline, filterOutline,
      checkmarkCircleOutline, closeCircleOutline, timeOutline,
      warningOutline, reloadOutline, trashOutline
    });
  }

  ngOnInit() {
    this.loadCurrentFamily();
    this.loadInvitations();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentFamily() {
    this.familyService.currentFamily$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(family => {
      this.currentFamily.set(family);
    });
  }

  private loadInvitations() {
    this.isLoading.set(true);

    combineLatest([
      this.invitationService.getUserInvitations(),
      this.loadSentInvitations()
    ]).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([received, sent]) => {
        this.receivedInvitations.set(received);
        this.sentInvitations.set(sent);
        this.applyFilters();
      },
      error: async () => {
        await this.showToast('Failed to load invitations', 'danger');
      }
    });
  }

  private loadSentInvitations() {
    const family = this.currentFamily();
    if (!family) {
      return Promise.resolve([]);
    }

    return this.invitationService.getFamilyInvitations(family.id);
  }

  // Segment and Filter Management
  onSegmentChange(event: any) {
    this.selectedSegment.set(event.detail.value);
    this.applyFilters();
  }

  onFilterChange(filter: string) {
    this.selectedFilter.set(filter);
    this.applyFilters();
  }

  onSearchChange(event: any) {
    this.searchTerm.set(event.detail.value);
    this.applyFilters();
  }

  protected applyFilters() {
    const segment = this.selectedSegment();
    const filter = this.selectedFilter();
    const search = this.searchTerm().toLowerCase();

    if (segment === 'received') {
      let filtered = [...this.receivedInvitations()];

      // Apply status filter
      if (filter !== 'all') {
        if (filter === 'expired') {
          filtered = filtered.filter(inv => inv.isExpired);
        } else {
          filtered = filtered.filter(inv => inv.status === filter && !inv.isExpired);
        }
      }

      // Apply search filter
      if (search) {
        filtered = filtered.filter(inv =>
          inv.family?.name.toLowerCase().includes(search) ||
          inv.inviter?.displayName.toLowerCase().includes(search)
        );
      }

      this.filteredReceived.set(filtered);
    } else {
      let filtered = [...this.sentInvitations()];

      // Apply status filter
      if (filter !== 'all') {
        if (filter === 'expired') {
          filtered = filtered.filter(inv => inv.isExpired);
        } else {
          filtered = filtered.filter(inv => inv.status === filter && !inv.isExpired);
        }
      }

      // Apply search filter
      if (search) {
        filtered = filtered.filter(inv =>
          inv.email.toLowerCase().includes(search)
        );
      }

      this.filteredSent.set(filtered);
    }
  }

  // Invitation Actions
  onInvitationClicked(invitation: FamilyInvitation) {
    this.router.navigate(['/family/invitations', invitation.id]);
  }

  async onAcceptClicked(invitation: FamilyInvitation) {
    const alert = await this.alertController.create({
      header: 'Accept Invitation',
      message: `Do you want to join ${invitation.family?.name}?`,
      inputs: [
        {
          name: 'nickname',
          type: 'text',
          placeholder: 'Nickname (optional)',
          attributes: {
            maxlength: 50
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Accept',
          handler: (data) => {
            this.acceptInvitation(invitation, data.nickname);
          }
        }
      ]
    });

    await alert.present();
  }

  private acceptInvitation(invitation: FamilyInvitation, nickname?: string) {
    this.invitationService.acceptInvitation(invitation.id, nickname).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: async () => {
        await this.showToast(`Welcome to ${invitation.family?.name}!`, 'success');
        this.loadInvitations();

        // Navigate to the family
        if (invitation.family) {
          this.familyService.switchFamily(invitation.family.id).subscribe(() => {
            this.router.navigate(['/tabs/family']);
          });
        }
      },
      error: async () => {
        await this.showToast('Failed to accept invitation', 'danger');
      }
    });
  }

  async onDeclineClicked(invitation: FamilyInvitation) {
    this.invitationService.declineInvitation(invitation.id).then(observable => {
      observable.pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadInvitations();
        }
      });
    });
  }

  onResendClicked(invitation: FamilyInvitation) {
    this.invitationService.resendInvitation(invitation.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loadInvitations();
      }
    });
  }

  async onCancelClicked(invitation: FamilyInvitation) {
    this.invitationService.cancelInvitation(invitation.id).then(observable => {
      observable.pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadInvitations();
        }
      });
    });
  }

  // Navigation and Actions
  onInviteMembers() {
    this.router.navigate(['/family/invite']);
  }

  onRefresh(event: any) {
    this.loadInvitations();
    event.target.complete();
  }

  // Stats and Helpers
  get receivedStats() {
    const invitations = this.receivedInvitations();
    return {
      total: invitations.length,
      pending: invitations.filter(inv => inv.status === InvitationStatusEnum.PENDING && !inv.isExpired).length,
      accepted: invitations.filter(inv => inv.status === InvitationStatusEnum.ACCEPTED).length,
      declined: invitations.filter(inv => inv.status === InvitationStatusEnum.DECLINED).length,
      expired: invitations.filter(inv => inv.isExpired).length
    };
  }

  get sentStats() {
    const invitations = this.sentInvitations();
    return {
      total: invitations.length,
      pending: invitations.filter(inv => inv.status === InvitationStatusEnum.PENDING && !inv.isExpired).length,
      accepted: invitations.filter(inv => inv.status === InvitationStatusEnum.ACCEPTED).length,
      declined: invitations.filter(inv => inv.status === InvitationStatusEnum.DECLINED).length,
      expired: invitations.filter(inv => inv.isExpired).length
    };
  }

  getCurrentInvitations(): FamilyInvitation[] {
    return this.selectedSegment() === 'received'
      ? this.filteredReceived()
      : this.filteredSent();
  }

  getFilterBadgeCount(filter: string): number {
    const stats = this.selectedSegment() === 'received' ? this.receivedStats : this.sentStats;

    switch (filter) {
      case 'all': return stats.total;
      case 'pending': return stats.pending;
      case 'accepted': return stats.accepted;
      case 'declined': return stats.declined;
      case 'expired': return stats.expired;
      default: return 0;
    }
  }

  trackByInvitationId(index: number, invitation: FamilyInvitation): number {
    return invitation.id;
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

  getEmptyStateTitle() {
    return "";
  }

  getEmptyStateDescription() {
    return "";
  }
}
