import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText, IonInput,
  IonItem, IonLabel, IonTextarea, IonBackButton, IonButtons,
  IonGrid, IonRow, IonCol, IonAvatar, IonChip, IonBadge,
  IonList, IonModal, AlertController, ToastController
} from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, mailOutline, timeOutline, personOutline,
  checkmarkCircleOutline, closeCircleOutline, refreshOutline,
  copyOutline, shareOutline, warningOutline, informationCircleOutline,
  calendarOutline, locationOutline, linkOutline, sendOutline,
  trashOutline, createOutline
} from 'ionicons/icons';

import { InvitationService } from '../../../core/services/family/invitation.service';
import { FamilyService } from '../../../core/services/family/family.service';
import {
  FamilyInvitation,
  InvitationStatusEnum,
  FamilyRoleEnum,
  Family
} from '../../../models/families/family.models';

@Component({
  selector: 'app-invitation-detail',
  templateUrl: './invitation-detail.page.html',
  styleUrls: ['./invitation-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonInput,
    IonItem, IonLabel, IonBackButton, IonButtons,
    IonGrid, IonRow, IonCol, IonAvatar, IonChip,
    IonList, IonModal
  ]
})
export class InvitationDetailPage implements OnInit, OnDestroy {
  private readonly invitationService = inject(InvitationService);
  private readonly familyService = inject(FamilyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly destroy$ = new Subject<void>();

  invitation = signal<FamilyInvitation | null>(null);
  currentFamily = signal<Family | null>(null);
  isLoading = signal<boolean>(false);
  isProcessing = signal<boolean>(false);
  invitationId = signal<number | null>(null);
  acceptForm!: FormGroup;
  isAcceptModalOpen = signal<boolean>(false);

  readonly InvitationStatusEnum = InvitationStatusEnum;
  readonly FamilyRoleEnum = FamilyRoleEnum;

  constructor() {
    addIcons({
      arrowBackOutline, mailOutline, timeOutline, personOutline,
      checkmarkCircleOutline, closeCircleOutline, refreshOutline,
      copyOutline, shareOutline, warningOutline, informationCircleOutline,
      calendarOutline, locationOutline, linkOutline, sendOutline,
      trashOutline, createOutline
    });
    this.initializeForm();
  }

  ngOnInit() {
    this.loadInvitationId();
    this.loadCurrentFamily();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.acceptForm = this.formBuilder.group({
      nickname: ['', [Validators.maxLength(50)]]
    });
  }

  private loadInvitationId() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.invitationId.set(parseInt(id, 10));
      this.loadInvitationDetails();
    }
  }

  private loadCurrentFamily() {
    this.familyService.currentFamily$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(family => {
      this.currentFamily.set(family);
    });
  }

  private loadInvitationDetails() {
    const invitationId = this.invitationId();
    if (!invitationId) return;

    this.isLoading.set(true);

    // For this example, we'll use a placeholder method
    // In a real app, you'd have a getInvitationById method
    // this.loadInvitationFromService(invitationId).pipe(
    //   finalize(() => this.isLoading.set(false)),
    //   takeUntil(this.destroy$)
    // ).subscribe({
    //   next: (invitation) => {
    //     this.invitation.set(invitation);
    //   },
    //   error: async () => {
    //     await this.showToast('Failed to load invitation details', 'danger');
    //     this.router.navigate(['/family/invitations']);
    //   }
    // });
  }

  // private loadInvitationFromService(id: number) {
  //   // This is a placeholder - in a real app you'd have a specific endpoint
  //   // For now, we'll try to find it in the user's invitations
  //   return this.invitationService.getUserInvitations().pipe(
  //     // Find the specific invitation by ID
  //     // In a real app, you'd have a direct API call
  //   );
  // }

  // Invitation Actions
  async onAcceptInvitation() {
    if (!this.acceptForm.valid) {
      this.acceptForm.markAllAsTouched();
      return;
    }

    const invitation = this.invitation();
    if (!invitation) return;

    this.isProcessing.set(true);
    const nickname = this.acceptForm.get('nickname')?.value;

    this.invitationService.acceptInvitation(invitation.id, nickname).pipe(
      finalize(() => this.isProcessing.set(false)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: async (updatedInvitation) => {
        this.invitation.set(updatedInvitation);
        this.isAcceptModalOpen.set(false);

        await this.showSuccessAlert('Welcome to the Family!',
          `You have successfully joined ${invitation.family?.name}. Start connecting with your family members!`);

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

  async onDeclineInvitation() {
    const invitation = this.invitation();
    if (!invitation) return;

    const alert = await this.alertController.create({
      header: 'Decline Invitation',
      message: `Are you sure you want to decline the invitation to join ${invitation.family?.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Decline',
          role: 'destructive',
          handler: () => {
            this.declineInvitation();
          }
        }
      ]
    });

    await alert.present();
  }

  private declineInvitation() {
    const invitation = this.invitation();
    if (!invitation) return;

    this.isProcessing.set(true);

    this.invitationService.declineInvitation(invitation.id).then(observable => {
      observable.pipe(
        finalize(() => this.isProcessing.set(false)),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (updatedInvitation) => {
          this.invitation.set(updatedInvitation);
          this.showToast('Invitation declined', 'warning');
        }
      });
    });
  }

  onResendInvitation() {
    const invitation = this.invitation();
    if (!invitation) return;

    this.isProcessing.set(true);

    this.invitationService.resendInvitation(invitation.id).pipe(
      finalize(() => this.isProcessing.set(false)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedInvitation) => {
        this.invitation.set(updatedInvitation);
        this.showToast('Invitation resent successfully!', 'success');
      }
    });
  }

  async onCancelInvitation() {
    const invitation = this.invitation();
    if (!invitation) return;

    this.invitationService.cancelInvitation(invitation.id).then(observable => {
      observable.pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: async () => {
          await this.showToast('Invitation cancelled', 'success');
          this.router.navigate(['/family/invitations']);
        }
      });
    });
  }

  // Sharing and Link Actions
  async copyInvitationLink() {
    const invitation = this.invitation();
    if (!invitation) return;

    const inviteLink = `https://app.families.com/join/${invitation.token}`;

    try {
      await navigator.clipboard.writeText(inviteLink);
      await this.showToast('Invitation link copied!', 'success');
    } catch (error) {
      await this.showToast('Failed to copy link', 'danger');
    }
  }

  async shareInvitation() {
    const invitation = this.invitation();
    if (!invitation || !invitation.family) return;

    const inviteLink = `https://app.families.com/join/${invitation.token}`;
    const shareData = {
      title: `Join ${invitation.family.name}`,
      text: `You're invited to join our family on the Families app!`,
      url: inviteLink
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        await this.copyInvitationLink();
      }
    } else {
      await this.copyInvitationLink();
    }
  }

  // Modal Controls
  openAcceptModal() {
    this.isAcceptModalOpen.set(true);
  }

  closeAcceptModal() {
    this.isAcceptModalOpen.set(false);
    this.acceptForm.reset();
  }

  // Helper Methods
  getStatusIcon(): string {
    const invitation = this.invitation();
    if (!invitation) return 'mail-outline';

    if (invitation.isExpired) return 'warning-outline';

    switch (invitation.status) {
      case InvitationStatusEnum.PENDING: return 'time-outline';
      case InvitationStatusEnum.ACCEPTED: return 'checkmark-circle-outline';
      case InvitationStatusEnum.DECLINED: return 'close-circle-outline';
      case InvitationStatusEnum.EXPIRED: return 'warning-outline';
      default: return 'mail-outline';
    }
  }

  getStatusColor(): string {
    const invitation = this.invitation();
    if (!invitation) return '#6b7280';

    if (invitation.isExpired) return '#ef4444';

    switch (invitation.status) {
      case InvitationStatusEnum.PENDING: return '#f59e0b';
      case InvitationStatusEnum.ACCEPTED: return '#22c55e';
      case InvitationStatusEnum.DECLINED: return '#ef4444';
      case InvitationStatusEnum.EXPIRED: return '#6b7280';
      default: return '#6b7280';
    }
  }

  getStatusText(): string {
    const invitation = this.invitation();
    if (!invitation) return 'Unknown';

    if (invitation.isExpired) return 'Expired';

    switch (invitation.status) {
      case InvitationStatusEnum.PENDING: return 'Pending';
      case InvitationStatusEnum.ACCEPTED: return 'Accepted';
      case InvitationStatusEnum.DECLINED: return 'Declined';
      case InvitationStatusEnum.EXPIRED: return 'Expired';
      default: return 'Unknown';
    }
  }

  getRoleColor(): string {
    const invitation = this.invitation();
    if (!invitation) return '#6b7280';

    switch (invitation.role) {
      case FamilyRoleEnum.OWNER: return '#dc2626';
      case FamilyRoleEnum.ADMIN: return '#3b82f6';
      case FamilyRoleEnum.MEMBER: return '#22c55e';
      default: return '#6b7280';
    }
  }

  getRoleIcon(): string {
    const invitation = this.invitation();
    if (!invitation) return 'person-outline';

    switch (invitation.role) {
      case FamilyRoleEnum.OWNER: return 'crown-outline';
      case FamilyRoleEnum.ADMIN: return 'shield-checkmark-outline';
      case FamilyRoleEnum.MEMBER: return 'person-outline';
      default: return 'person-outline';
    }
  }

  formatTimeRemaining(): string {
    const invitation = this.invitation();
    if (!invitation) return '';

    if (invitation.isExpired) return 'Expired';

    const now = new Date();
    const expires = new Date(invitation.expiresAt);
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} remaining`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} remaining`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} remaining`;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  canAccept(): boolean {
    const invitation = this.invitation();
    return invitation?.status === InvitationStatusEnum.PENDING && !invitation.isExpired;
  }

  canDecline(): boolean {
    const invitation = this.invitation();
    return invitation?.status === InvitationStatusEnum.PENDING && !invitation.isExpired;
  }

  canResend(): boolean|undefined {
    const invitation = this.invitation();
    return invitation?.status === InvitationStatusEnum.PENDING || invitation?.isExpired;
  }

  canCancel(): boolean {
    const invitation = this.invitation();
    return invitation?.status === InvitationStatusEnum.PENDING && !invitation.isExpired;
  }

  getViewType(): 'sent' | 'received' {
    // Determine if this is a sent or received invitation
    // This would typically be based on whether the current user sent it
    return 'received'; // Placeholder
  }

  // Form Validation
  getFieldError(fieldName: string): string | null {
    const field = this.acceptForm.get(fieldName);
    if (!field || !field.touched || !field.errors) {
      return null;
    }

    const errors = field.errors;
    if (errors['maxlength']) return 'Nickname is too long';

    return 'Invalid value';
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.getFieldError(fieldName);
  }

  private async showSuccessAlert(title: string, message: string) {
    const alert = await this.alertController.create({
      header: title,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
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
