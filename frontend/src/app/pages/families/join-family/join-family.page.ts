// src/app/pages/families/join-family/join-family.page.ts
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonIcon, IonBackButton, IonButtons, IonItem, IonInput, IonLabel,
  IonText, IonSpinner, IonAlert, LoadingController, AlertController, ToastController
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, linkOutline, peopleOutline, checkmarkOutline, alertCircleOutline,
  informationCircleOutline, homeOutline, searchOutline, qrCodeOutline, keyOutline
} from 'ionicons/icons';
import { FamilyService } from '../../../core/services/families/family.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Family } from '../../../models/families/family.models';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-join-family',
  templateUrl: './join-family.page.html',
  styleUrls: ['./join-family.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonButton, IonIcon, IonBackButton, IonButtons, IonItem, IonInput, IonLabel,
    IonText, IonSpinner, IonAlert
  ]
})
export class JoinFamilyPage implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly familyService = inject(FamilyService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly loadingController = inject(LoadingController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly destroy$ = new Subject<void>();

  joinForm!: FormGroup;

  // Signals for reactive state
  isJoining = signal<boolean>(false);
  prefilledCode = signal<string>('');
  joinedFamily = signal<Family | null>(null);
  error = signal<string | null>(null);

  // Example families for demonstration
  exampleFamilies = [
    { name: 'The Smith Family', code: 'SMITH24', members: 5 },
    { name: 'Johnson Clan', code: 'JOHN123', members: 8 },
    { name: 'Brown Family', code: 'BROWN1', members: 3 }
  ];

  constructor() {
    this.addIcons();
    this.initializeForm();
  }

  ngOnInit() {
    // Check if there's a code in the route parameters
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['code']) {
        const code = params['code'].toUpperCase();
        this.prefilledCode.set(code);
        this.joinForm.patchValue({ inviteCode: code });
        // Auto-join if code is provided in URL
        this.onJoinFamily();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private addIcons() {
    addIcons({
      arrowBackOutline, linkOutline, peopleOutline, checkmarkOutline, alertCircleOutline,
      informationCircleOutline, homeOutline, searchOutline, qrCodeOutline, keyOutline
    });
  }

  private initializeForm() {
    this.joinForm = this.formBuilder.group({
      inviteCode: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(8),
        this.inviteCodeValidator
      ]]
    });
  }

  private inviteCodeValidator(control: any) {
    if (!control.value) return null;

    const code = control.value.trim().toUpperCase();

    // Check if code contains only alphanumeric characters
    if (!/^[A-Z0-9]+$/.test(code)) {
      return { invalidCharacters: true };
    }

    // Check length
    if (code.length < 6 || code.length > 8) {
      return { invalidLength: true };
    }

    return null;
  }

  // Input handling
  onCodeInput(event: any) {
    let value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Limit to 8 characters
    if (value.length > 8) {
      value = value.substring(0, 8);
    }

    this.joinForm.patchValue({ inviteCode: value });
    event.target.value = value;
  }

  onCodePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const cleanCode = pastedText.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8);

    this.joinForm.patchValue({ inviteCode: cleanCode });

    // If it's a valid length, try to join automatically
    if (cleanCode.length >= 6) {
      setTimeout(() => this.onJoinFamily(), 100);
    }
  }

  // Join family action
  async onJoinFamily() {
    if (!this.joinForm.valid) {
      this.markFormFieldsAsTouched();
      return;
    }

    const inviteCode = this.joinForm.get('inviteCode')?.value?.trim().toUpperCase();
    if (!inviteCode) {
      this.showToast('Please enter an invite code', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Joining family...',
      spinner: 'crescent'
    });

    await loading.present();
    this.isJoining.set(true);
    this.error.set(null);

    try {
      this.familyService.joinFamilyByCode(inviteCode)
        .pipe(
          takeUntil(this.destroy$),
          finalize(async () => {
            await loading.dismiss();
            this.isJoining.set(false);
          })
        )
        .subscribe({
          next: (family) => {
            this.joinedFamily.set(family);
            this.showSuccessMessage(family);
          },
          error: (error) => {
            console.error('Error joining family:', error);
            this.handleJoinError(error);
          }
        });

    } catch (error) {
      await loading.dismiss();
      this.isJoining.set(false);
      this.error.set('An unexpected error occurred. Please try again.');
    }
  }

  private async showSuccessMessage(family: Family) {
    const alert = await this.alertController.create({
      header: 'Welcome to the Family!',
      message: `You've successfully joined "${family.name}". You can now access family features and connect with other members.`,
      buttons: [
        {
          text: 'View Family',
          handler: () => {
            this.router.navigate(['/families', family.id, 'dashboard']);
          }
        },
        {
          text: 'Go to Families',
          handler: () => {
            this.router.navigate(['/families']);
          }
        }
      ]
    });

    await alert.present();
  }

  private handleJoinError(error: any) {
    let errorMessage = 'Failed to join family. Please try again.';

    if (error.status === 404) {
      errorMessage = 'Invalid invite code. Please check the code and try again.';
    } else if (error.status === 400) {
      if (error.error?.message?.includes('already a member')) {
        errorMessage = 'You are already a member of this family.';
      } else if (error.error?.message?.includes('expired')) {
        errorMessage = 'This invite code has expired. Please request a new one.';
      } else {
        errorMessage = error.error?.message || errorMessage;
      }
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to join this family.';
    }

    this.error.set(errorMessage);
    this.showToast(errorMessage, 'danger');
  }

  // Example family actions
  onTryExampleCode(exampleFamily: any) {
    this.joinForm.patchValue({ inviteCode: exampleFamily.code });
    // Note: These are just examples, they won't actually work
    this.showToast(`This is just an example. Code "${exampleFamily.code}" won't work in the demo.`, 'warning');
  }

  // Navigation
  onGoToFamilies() {
    this.router.navigate(['/families']);
  }

  onGoHome() {
    this.router.navigate(['/tabs/home']);
  }

  // QR Code scanner (placeholder)
  onScanQRCode() {
    this.showToast('QR Code scanner coming soon!', 'primary');
  }

  // Utility methods
  private markFormFieldsAsTouched() {
    Object.keys(this.joinForm.controls).forEach(key => {
      this.joinForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.joinForm.get(fieldName);
    if (!field || !field.touched || !field.errors) {
      return null;
    }

    const errors = field.errors;

    if (errors['required']) return 'Invite code is required';
    if (errors['minlength'] || errors['invalidLength']) return 'Invite code must be 6-8 characters';
    if (errors['maxlength']) return 'Invite code cannot be longer than 8 characters';
    if (errors['invalidCharacters']) return 'Invite code can only contain letters and numbers';

    return 'Invalid invite code';
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.getFieldError(fieldName);
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

  // Getters for template
  get canJoinFamily(): boolean {
    return this.joinForm.valid && !this.isJoining();
  }

  get codeLength(): number {
    return this.joinForm.get('inviteCode')?.value?.length || 0;
  }
}
