// join-family.page.ts
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText, IonInput,
  IonItem, IonLabel, IonTextarea, IonBackButton, IonButtons,
  IonGrid, IonRow, IonCol, IonAvatar, IonChip, IonBadge,
  AlertController, ToastController, IonSpinner
} from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, enterOutline, peopleOutline, linkOutline,
  checkmarkCircleOutline, warningOutline, mailOutline,
  searchOutline, personAddOutline
} from 'ionicons/icons';

import { FamilyService } from '../../../core/services/family/family.service';
import { InvitationService } from '../../../core/services/family/invitation.service';
import {
  FamilyInvitation,
  JoinFamilyRequest,
  Family
} from '../../../models/families/family.models';

@Component({
  selector: 'app-join-family',
  templateUrl: './join-family.page.html',
  styleUrls: ['./join-family.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText, IonInput,
    IonItem, IonLabel, IonTextarea, IonBackButton, IonButtons,
    IonGrid, IonRow, IonCol, IonAvatar, IonChip, IonBadge, IonSpinner
  ]
})
export class JoinFamilyPage implements OnInit, OnDestroy {
  private readonly familyService = inject(FamilyService);
  private readonly invitationService = inject(InvitationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly destroy$ = new Subject<void>();

  isLoading = signal<boolean>(false);
  isLoadingInvitation = signal<boolean>(false);
  joinForm!: FormGroup;
  invitation = signal<FamilyInvitation | null>(null);
  hasToken = signal<boolean>(false);
  tokenFromUrl = signal<string | null>(null);

  constructor() {
    addIcons({
      arrowBackOutline, enterOutline, peopleOutline, linkOutline,
      checkmarkCircleOutline, warningOutline, mailOutline,
      searchOutline, personAddOutline
    });
    this.initializeForm();
  }

  ngOnInit() {
    this.checkForInvitationToken();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.joinForm = this.formBuilder.group({
      token: ['', [Validators.required]],
      nickname: ['', [Validators.maxLength(50)]]
    });
  }

  private checkForInvitationToken() {
    const token = this.route.snapshot.paramMap.get('token');

    if (token) {
      this.tokenFromUrl.set(token);
      this.hasToken.set(true);
      this.joinForm.patchValue({ token });
      this.loadInvitationDetails(token);
    }
  }

  private loadInvitationDetails(token: string) {
    this.isLoadingInvitation.set(true);

    this.invitationService.getInvitationByToken(token).pipe(
      finalize(() => this.isLoadingInvitation.set(false)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (invitation) => {
        this.invitation.set(invitation);
      },
      error: async (error) => {
        await this.showInvalidTokenAlert();
      }
    });
  }

  onTokenChange() {
    const token = this.joinForm.get('token')?.value;
    if (token && token.length > 10) { // Basic validation
      this.loadInvitationDetails(token);
    } else {
      this.invitation.set(null);
    }
  }

  async onJoinFamily() {
    if (!this.joinForm.valid) {
      this.joinForm.markAllAsTouched();
      await this.showToast('Please enter a valid invitation token', 'warning');
      return;
    }

    const invitation = this.invitation();
    if (!invitation) {
      await this.showToast('Please enter a valid invitation token', 'warning');
      return;
    }

    if (invitation.isExpired) {
      await this.showExpiredInvitationAlert();
      return;
    }

    this.isLoading.set(true);

    const joinRequest: JoinFamilyRequest = {
      token: this.joinForm.get('token')?.value,
      nickname: this.joinForm.get('nickname')?.value || undefined
    };

    this.familyService.joinFamilyByToken(joinRequest.token, joinRequest.nickname).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: async (family) => {
        await this.showSuccessAlert(family);
      },
      error: async (error) => {
        const errorMessage = this.getErrorMessage(error);
        await this.showToast(errorMessage, 'danger');
      }
    });
  }

  private getErrorMessage(error: any): string {
    if (error.status === 404) {
      return 'Invitation not found or has expired';
    } else if (error.status === 409) {
      return 'You are already a member of this family';
    } else if (error.status === 403) {
      return 'This invitation is no longer valid';
    }
    return 'Failed to join family. Please try again.';
  }

  private async showInvalidTokenAlert() {
    const alert = await this.alertController.create({
      header: 'Invalid Invitation',
      message: 'The invitation token is invalid or has expired. Please check the link and try again.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.invitation.set(null);
            this.joinForm.patchValue({ token: '' });
          }
        }
      ]
    });

    await alert.present();
  }

  private async showExpiredInvitationAlert() {
    const alert = await this.alertController.create({
      header: 'Invitation Expired',
      message: 'This invitation has expired. Please ask the family owner to send you a new invitation.',
      buttons: ['OK']
    });

    await alert.present();
  }

  private async showSuccessAlert(family: Family) {
    const alert = await this.alertController.create({
      header: 'Welcome to the Family!',
      message: `You have successfully joined ${family.name}. Start connecting with your family members!`,
      buttons: [
        {
          text: 'View Family',
          handler: () => {
            this.router.navigate(['/tabs/family'], { replaceUrl: true });
          }
        }
      ]
    });

    await alert.present();
  }

  async onRequestInvitation() {
    const alert = await this.alertController.create({
      header: 'Request Invitation',
      message: 'Contact your family member to get an invitation link or token.',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Your email address'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Send Request',
          handler: (data) => {
            // This would typically send a request to the family
            // For now, just show a message
            this.showToast('Request sent! Please wait for an invitation.', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  onCancel() {
    this.router.navigate(['/family/welcome']);
  }

  // Helper Methods
  getInvitationStatusColor(): string {
    const invitation = this.invitation();
    if (!invitation) return '#6b7280';

    if (invitation.isExpired) return '#ef4444';
    return '#22c55e';
  }

  getInvitationStatusIcon(): string {
    const invitation = this.invitation();
    if (!invitation) return 'mail-outline';

    if (invitation.isExpired) return 'warning-outline';
    return 'checkmark-circle-outline';
  }

  getInvitationStatusText(): string {
    const invitation = this.invitation();
    if (!invitation) return 'Enter invitation token';

    if (invitation.isExpired) return 'Expired';
    return 'Valid invitation';
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
      return `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Expires in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `Expires in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  }

  // Form Validation
  getFieldError(fieldName: string): string | null {
    const field = this.joinForm.get(fieldName);
    if (!field || !field.touched || !field.errors) {
      return null;
    }

    const errors = field.errors;
    if (errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
    if (errors['maxlength']) return `${this.getFieldDisplayName(fieldName)} is too long`;

    return 'Invalid value';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      token: 'Invitation token',
      nickname: 'Nickname'
    };
    return displayNames[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.getFieldError(fieldName);
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

  getPrivacyIcon() {
    return '';
  }
}
