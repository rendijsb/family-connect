// src/app/pages/families/family-invite/family-invite.page.ts
import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonIcon, IonBackButton, IonButtons, IonItem, IonInput, IonTextarea, IonSelect,
  IonSelectOption, IonLabel, IonChip, IonAvatar, IonSegment, IonSegmentButton, IonList,
  IonItemSliding, IonItemOptions, IonItemOption, IonSpinner, IonAlert, IonText, IonGrid,
  IonRow, IonCol, IonFab, IonFabButton, LoadingController, AlertController, ToastController, IonBadge
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, personAddOutline, mailOutline, shareOutline, copyOutline,
  linkOutline, checkmarkOutline, closeOutline, trashOutline, refreshOutline,
  paperPlaneOutline, peopleOutline, qrCodeOutline, addOutline, ellipsisHorizontalOutline
} from 'ionicons/icons';
import { FamilyService } from '../../../core/services/families/family.service';
import { FamilyInvitationService } from '../../../core/services/families/family-invitation.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import {
  Family, FamilyInvitation, FamilyRole, InviteMemberRequest, InvitationStatus
} from '../../../models/families/family.models';
import { Subject, takeUntil, switchMap, finalize } from 'rxjs';

interface InviteFormData {
  emails: string[];
  role: FamilyRole;
  personalMessage: string;
}

@Component({
  selector: 'app-family-invite',
  templateUrl: './family-invite.page.html',
  styleUrls: ['./family-invite.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonButton, IonIcon, IonBackButton, IonButtons, IonItem, IonInput, IonTextarea, IonSelect,
    IonSelectOption, IonLabel, IonChip, IonAvatar, IonSegment, IonSegmentButton, IonList,
    IonItemSliding, IonItemOptions, IonItemOption, IonSpinner, IonAlert, IonText, IonGrid,
    IonRow, IonCol, IonFab, IonFabButton, IonBadge
  ]
})
export class FamilyInvitePage implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly familyService = inject(FamilyService);
  private readonly invitationService = inject(FamilyInvitationService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly loadingController = inject(LoadingController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly destroy$ = new Subject<void>();

  inviteForm!: FormGroup;

  // Signals for reactive state
  familyId = signal<number>(0);
  selectedTab = signal<string>('invite');
  isSubmitting = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  pendingInvitations = signal<FamilyInvitation[]>([]);

  // Email input
  currentEmail = signal<string>('');
  emailList = signal<string[]>([]);

  // Computed properties
  family = computed(() => this.familyService.currentFamily());
  currentUser = computed(() => this.authService.user());

  canInvite = computed(() => {
    const fam = this.family();
    const user = this.currentUser();
    if (!fam || !user) return false;

    return this.familyService.canManageFamily(fam, user.id) ||
      fam.settings?.privacy?.allowMemberInvites === true;
  });

  familyRoles = [
    { value: FamilyRole.ADMIN, label: 'Admin', description: 'Can manage family settings and members' },
    { value: FamilyRole.MEMBER, label: 'Member', description: 'Standard family member with basic permissions' },
    { value: FamilyRole.CHILD, label: 'Child', description: 'Limited permissions for younger family members' }
  ];

  constructor() {
    this.addIcons();
    this.initializeForm();
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
        this.loadPendingInvitations();
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

  private addIcons() {
    addIcons({
      arrowBackOutline, personAddOutline, mailOutline, shareOutline, copyOutline,
      linkOutline, checkmarkOutline, closeOutline, trashOutline, refreshOutline,
      paperPlaneOutline, peopleOutline, qrCodeOutline, addOutline, ellipsisHorizontalOutline
    });
  }

  private initializeForm() {
    this.inviteForm = this.formBuilder.group({
      role: [FamilyRole.MEMBER, Validators.required],
      personalMessage: ['', Validators.maxLength(500)]
    });
  }

  private loadPendingInvitations() {
    const id = this.familyId();
    if (!id || !this.canInvite()) return;

    this.isLoading.set(true);

    this.invitationService.getInvitations(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (invitations) => {
          const pending = invitations.filter(inv => inv.status === InvitationStatus.PENDING);
          this.pendingInvitations.set(pending);
        },
        error: (error) => {
          console.error('Error loading invitations:', error);
        }
      });
  }

  // Tab navigation
  onTabChange(event: any) {
    this.selectedTab.set(event.detail.value);
  }

  // Email management
  onEmailInput(event: any) {
    this.currentEmail.set(event.target.value);
  }

  onEmailKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addEmail();
    } else if (event.key === 'Backspace' && this.currentEmail() === '') {
      this.removeLastEmail();
    }
  }

  addEmail() {
    const email = this.currentEmail().trim();
    if (this.isValidEmail(email) && !this.emailList().includes(email)) {
      this.emailList.set([...this.emailList(), email]);
      this.currentEmail.set('');
    }
  }

  removeEmail(email: string) {
    this.emailList.set(this.emailList().filter(e => e !== email));
  }

  removeLastEmail() {
    const emails = this.emailList();
    if (emails.length > 0) {
      this.emailList.set(emails.slice(0, -1));
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Invitation actions
  async onSendInvitations() {
    const emails = this.emailList();
    if (emails.length === 0) {
      this.showToast('Please add at least one email address', 'warning');
      return;
    }

    if (!this.inviteForm.valid) {
      this.showToast('Please check your form inputs', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: `Sending ${emails.length} invitation${emails.length > 1 ? 's' : ''}...`,
      spinner: 'crescent'
    });

    await loading.present();
    this.isSubmitting.set(true);

    try {
      const formValue = this.inviteForm.value;
      const familyId = this.familyId();

      // Send invitations for each email
      const invitePromises = emails.map(email => {
        const invitationData: InviteMemberRequest = {
          email: email,
          role: formValue.role,
          personalMessage: formValue.personalMessage || undefined
        };

        return this.invitationService.inviteMember(familyId, invitationData).toPromise();
      });

      await Promise.all(invitePromises);

      // Reset form and reload invitations
      this.emailList.set([]);
      this.currentEmail.set('');
      this.inviteForm.patchValue({ personalMessage: '' });
      this.loadPendingInvitations();

      this.showToast(
        `${emails.length} invitation${emails.length > 1 ? 's' : ''} sent successfully!`,
        'success'
      );

    } catch (error) {
      console.error('Error sending invitations:', error);
      this.showToast('Failed to send some invitations. Please try again.', 'danger');
    } finally {
      await loading.dismiss();
      this.isSubmitting.set(false);
    }
  }

  async onResendInvitation(invitation: FamilyInvitation) {
    const loading = await this.loadingController.create({
      message: 'Resending invitation...',
      spinner: 'crescent'
    });

    await loading.present();

    this.invitationService.resendInvitation(invitation.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => loading.dismiss())
      )
      .subscribe({
        next: () => {
          this.loadPendingInvitations();
        }
      });
  }

  async onCancelInvitation(invitation: FamilyInvitation) {
    const alert = await this.alertController.create({
      header: 'Cancel Invitation',
      message: `Cancel invitation to ${invitation.email}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Yes, Cancel',
          handler: () => {
            this.invitationService.cancelInvitation(invitation.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.loadPendingInvitations();
                }
              });
          }
        }
      ]
    });

    await alert.present();
  }

  // Invite code sharing
  async onShareInviteCode() {
    const family = this.family();
    if (!family) return;

    const shareData = {
      title: `Join ${family.name} on Family Connect`,
      text: `You've been invited to join our family! Use invite code: ${family.inviteCode}`,
      url: `${window.location.origin}/families/join/${family.inviteCode}`
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      await this.onCopyInviteCode();
    }
  }

  async onCopyInviteCode() {
    const family = this.family();
    if (!family) return;

    try {
      await navigator.clipboard.writeText(family.inviteCode);
      this.showToast('Invite code copied to clipboard', 'success');
    } catch (error) {
      this.showToast('Failed to copy invite code', 'danger');
    }
  }

  async onRegenerateInviteCode() {
    const alert = await this.alertController.create({
      header: 'Regenerate Invite Code',
      message: 'This will create a new invite code and invalidate the current one. Continue?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Regenerate',
          handler: () => {
            const familyId = this.familyId();
            this.familyService.regenerateInviteCode(familyId)
              .pipe(takeUntil(this.destroy$))
              .subscribe();
          }
        }
      ]
    });

    await alert.present();
  }

  // Quick invite actions
  async onQuickInvite() {
    const alert = await this.alertController.create({
      header: 'Quick Invite',
      message: 'Enter email address to send a quick invitation',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Enter email address'
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
            if (data.email && this.isValidEmail(data.email)) {
              this.emailList.set([data.email]);
              this.onSendInvitations();
            } else {
              this.showToast('Please enter a valid email address', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Utility methods
  getRoleDisplayName(role: FamilyRole): string {
    const roleInfo = this.familyRoles.find(r => r.value === role);
    return roleInfo?.label || role;
  }

  getRoleDescription(role: FamilyRole): string {
    const roleInfo = this.familyRoles.find(r => r.value === role);
    return roleInfo?.description || '';
  }

  getInvitationAge(invitation: FamilyInvitation): string {
    const sentDate = new Date(invitation.sentAt);
    const now = new Date();
    const diffMs = now.getTime() - sentDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  getExpirationWarning(invitation: FamilyInvitation): string | null {
    const expiryDate = new Date(invitation.expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs <= 0) {
      return 'Expired';
    } else if (diffDays <= 1) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return `Expires in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays <= 3) {
      return `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }

    return null;
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

  // Getters for template
  get canSendInvitations(): boolean {
    return this.emailList().length > 0 && !this.isSubmitting();
  }

  get hasMaxEmails(): boolean {
    return this.emailList().length >= 10; // Limit to 10 emails at once
  }
}
