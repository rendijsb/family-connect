// src/app/pages/families/create-family/create-family.page.ts
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonIcon, IonBackButton, IonButtons, IonItem, IonInput, IonTextarea, IonToggle,
  IonLabel, IonSelect, IonSelectOption, IonCheckbox, IonGrid, IonRow, IonCol, IonSpinner,
  IonProgressBar, IonText, IonChip, IonAvatar, IonAlert, LoadingController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, peopleOutline, lockClosedOutline, globeOutline, imageOutline,
  colorPaletteOutline, checkmarkOutline, closeOutline, informationCircleOutline,
  shieldCheckmarkOutline, eyeOutline, addOutline, cameraOutline
} from 'ionicons/icons';
import { FamilyService } from '../../../core/services/families/family.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { CreateFamilyRequest, FamilySettings } from '../../../models/families/family.models';
import { Subject, takeUntil, finalize } from 'rxjs';

interface CreateFamilyFormData {
  name: string;
  description: string;
  isPublic: boolean;
  allowMemberInvites: boolean;
  requireApprovalForJoining: boolean;
  enableLocationSharing: boolean;
  enablePhotoSharing: boolean;
  enableEventPlanning: boolean;
  enableFamilyChat: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  digestFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
  primaryColor: string;
}

@Component({
  selector: 'app-create-family',
  templateUrl: './create-family.page.html',
  styleUrls: ['./create-family.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonButton, IonIcon, IonBackButton, IonButtons, IonItem, IonInput, IonTextarea, IonToggle,
    IonLabel, IonSelect, IonSelectOption, IonCheckbox, IonGrid, IonRow, IonCol, IonSpinner,
    IonProgressBar, IonText, IonChip, IonAvatar, IonAlert
  ]
})
export class CreateFamilyPage implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly familyService = inject(FamilyService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly loadingController = inject(LoadingController);
  private readonly destroy$ = new Subject<void>();

  createFamilyForm!: FormGroup;

  // Signals for reactive state
  currentStep = signal<number>(1);
  totalSteps = signal<number>(3);
  isSubmitting = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  formErrors = signal<string[]>([]);

  // Form validation signals
  step1Valid = signal<boolean>(false);
  step2Valid = signal<boolean>(true); // Optional settings
  step3Valid = signal<boolean>(true); // Optional customization

  // Available color themes
  colorThemes = [
    { name: 'Red', value: '#dc2626', gradient: 'linear-gradient(135deg, #dc2626, #b91c1c)' },
    { name: 'Blue', value: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
    { name: 'Green', value: '#16a34a', gradient: 'linear-gradient(135deg, #16a34a, #15803d)' },
    { name: 'Purple', value: '#9333ea', gradient: 'linear-gradient(135deg, #9333ea, #7c3aed)' },
    { name: 'Orange', value: '#ea580c', gradient: 'linear-gradient(135deg, #ea580c, #c2410c)' },
    { name: 'Pink', value: '#db2777', gradient: 'linear-gradient(135deg, #db2777, #be185d)' },
    { name: 'Teal', value: '#0d9488', gradient: 'linear-gradient(135deg, #0d9488, #0f766e)' },
    { name: 'Indigo', value: '#4f46e5', gradient: 'linear-gradient(135deg, #4f46e5, #4338ca)' }
  ];

  constructor() {
    this.addIcons();
    this.initializeForm();
  }

  ngOnInit() {
    this.setupFormValidation();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private addIcons() {
    addIcons({
      arrowBackOutline, peopleOutline, lockClosedOutline, globeOutline, imageOutline,
      colorPaletteOutline, checkmarkOutline, closeOutline, informationCircleOutline,
      shieldCheckmarkOutline, eyeOutline, addOutline, cameraOutline
    });
  }

  private initializeForm() {
    this.createFamilyForm = this.formBuilder.group({
      // Step 1: Basic Information
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        this.familyNameValidator
      ]],
      description: ['', [
        Validators.maxLength(500)
      ]],

      // Step 2: Privacy & Features
      isPublic: [false],
      allowMemberInvites: [true],
      requireApprovalForJoining: [false],
      enableLocationSharing: [true],
      enablePhotoSharing: [true],
      enableEventPlanning: [true],
      enableFamilyChat: [true],

      // Step 3: Notifications & Customization
      emailNotifications: [true],
      pushNotifications: [true],
      digestFrequency: ['weekly'],
      primaryColor: ['#dc2626']
    });
  }

  private familyNameValidator(control: any) {
    if (!control.value) return null;

    const name = control.value.trim();
    if (name.length < 2) return { tooShort: true };
    if (name.length > 100) return { tooLong: true };
    if (!/^[\w\s\-'.,&]+$/.test(name)) return { invalidCharacters: true };

    return null;
  }

  private setupFormValidation() {
    // Watch for changes in step 1 fields
    this.createFamilyForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.validateCurrentStep();
    });

    // Initial validation
    this.validateCurrentStep();
  }

  private validateCurrentStep() {
    switch (this.currentStep()) {
      case 1:
        const nameControl = this.createFamilyForm.get('name');
        this.step1Valid.set(!!(nameControl?.valid && nameControl?.value?.trim()));
        break;
      case 2:
        this.step2Valid.set(true); // Privacy settings are all optional
        break;
      case 3:
        this.step3Valid.set(true); // Customization is optional
        break;
    }
  }

  // Navigation methods
  nextStep() {
    if (this.currentStep() < this.totalSteps()) {
      if (!this.canProceedToNextStep()) {
        this.markCurrentStepFieldsAsTouched();
        return;
      }

      this.currentStep.set(this.currentStep() + 1);
      this.validateCurrentStep();
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
      this.validateCurrentStep();
    }
  }

  private canProceedToNextStep(): boolean {
    switch (this.currentStep()) {
      case 1: return this.step1Valid();
      case 2: return this.step2Valid();
      case 3: return this.step3Valid();
      default: return false;
    }
  }

  private markCurrentStepFieldsAsTouched() {
    const fieldsToMark: string[] = [];

    switch (this.currentStep()) {
      case 1:
        fieldsToMark.push('name', 'description');
        break;
      case 2:
        // All step 2 fields are optional
        break;
      case 3:
        // All step 3 fields are optional
        break;
    }

    fieldsToMark.forEach(field => {
      this.createFamilyForm.get(field)?.markAsTouched();
    });
  }

  // Color theme selection
  selectColorTheme(theme: any) {
    this.createFamilyForm.patchValue({ primaryColor: theme.value });
  }

  getSelectedTheme() {
    const selectedColor = this.createFamilyForm.get('primaryColor')?.value;
    return this.colorThemes.find(theme => theme.value === selectedColor) || this.colorThemes[0];
  }

  // Form submission
  async onCreateFamily() {
    if (!this.createFamilyForm.valid) {
      this.markAllFieldsAsTouched();
      this.formErrors.set(['Please fill in all required fields correctly.']);
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creating your family...',
      spinner: 'crescent'
    });

    await loading.present();
    this.isSubmitting.set(true);

    try {
      const formValue = this.createFamilyForm.value;

      const familyData: CreateFamilyRequest = {
        name: formValue.name.trim(),
        description: formValue.description?.trim() || undefined,
        settings: this.buildFamilySettings(formValue)
      };

      this.familyService.createFamily(familyData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(async () => {
            await loading.dismiss();
            this.isSubmitting.set(false);
          })
        )
        .subscribe({
          next: (family) => {
            // Navigate to the new family dashboard
            this.router.navigate(['/families', family.id, 'dashboard']);
          },
          error: (error) => {
            console.error('Error creating family:', error);
            this.formErrors.set(['Failed to create family. Please try again.']);
          }
        });

    } catch (error) {
      await loading.dismiss();
      this.isSubmitting.set(false);
      this.formErrors.set(['An unexpected error occurred. Please try again.']);
    }
  }

  private buildFamilySettings(formValue: any): FamilySettings {
    return {
      privacy: {
        isPublic: formValue.isPublic,
        allowMemberInvites: formValue.allowMemberInvites,
        requireApprovalForJoining: formValue.requireApprovalForJoining
      },
      features: {
        enableLocationSharing: formValue.enableLocationSharing,
        enablePhotoSharing: formValue.enablePhotoSharing,
        enableEventPlanning: formValue.enableEventPlanning,
        enableFamilyChat: formValue.enableFamilyChat
      },
      notifications: {
        emailNotifications: formValue.emailNotifications,
        pushNotifications: formValue.pushNotifications,
        digestFrequency: formValue.digestFrequency
      },
      theme: {
        primaryColor: formValue.primaryColor
      }
    };
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.createFamilyForm.controls).forEach(key => {
      this.createFamilyForm.get(key)?.markAsTouched();
    });
  }

  // Utility methods
  getFieldError(fieldName: string): string | null {
    const field = this.createFamilyForm.get(fieldName);
    if (!field || !field.touched || !field.errors) {
      return null;
    }

    const errors = field.errors;

    if (errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
    if (errors['minlength']) return `${this.getFieldDisplayName(fieldName)} is too short`;
    if (errors['maxlength']) return `${this.getFieldDisplayName(fieldName)} is too long`;
    if (errors['tooShort']) return 'Family name must be at least 2 characters';
    if (errors['tooLong']) return 'Family name must be less than 100 characters';
    if (errors['invalidCharacters']) return 'Family name contains invalid characters';

    return 'Invalid value';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      name: 'Family name',
      description: 'Description'
    };
    return displayNames[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.getFieldError(fieldName);
  }

  // Getters for template
  get canCreateFamily(): boolean {
    return this.createFamilyForm.valid && !this.isSubmitting();
  }

  get progressPercentage(): number {
    return (this.currentStep() / this.totalSteps()) * 100;
  }
}
