import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText, IonInput,
  IonItem, IonLabel, IonTextarea, IonSelect, IonSelectOption, IonCheckbox,
  IonBackButton, IonButtons, IonGrid, IonRow, IonCol, IonToggle,
  IonSegment, IonSegmentButton, IonProgressBar, IonChip, IonBadge
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, peopleOutline, createOutline, settingsOutline,
  globeOutline, lockClosedOutline, keyOutline, checkmarkCircleOutline,
  informationCircleOutline, cameraOutline, imageOutline
} from 'ionicons/icons';

import { FamilyService } from '../../../core/services/family/family.service';
import {
  CreateFamilyRequest,
  FamilyPrivacyLevelEnum,
  DEFAULT_FAMILY_SETTINGS
} from '../../../models/families/family.models';
import { catchError, EMPTY, finalize, tap } from 'rxjs';

@Component({
  selector: 'app-family-create',
  templateUrl: './family-create.page.html',
  styleUrls: ['./family-create.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText, IonInput,
    IonItem, IonLabel, IonTextarea, IonSelect, IonSelectOption, IonCheckbox,
    IonBackButton, IonButtons, IonGrid, IonRow, IonCol, IonToggle,
    IonSegment, IonSegmentButton, IonProgressBar, IonChip, IonBadge
  ]
})
export class FamilyCreatePage implements OnInit {
  private readonly familyService = inject(FamilyService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  // Signals for reactive state
  currentStep = signal<number>(1);
  totalSteps = signal<number>(3);
  isLoading = signal<boolean>(false);
  selectedAvatar = signal<string | null>(null);

  // Form
  familyForm!: FormGroup;

  // Privacy levels
  privacyLevels = [
    {
      value: FamilyPrivacyLevelEnum.PUBLIC,
      title: 'Public',
      description: 'Anyone can find and request to join your family',
      icon: 'globe-outline',
      color: '#22c55e'
    },
    {
      value: FamilyPrivacyLevelEnum.PRIVATE,
      title: 'Private',
      description: 'Only people you invite can join your family',
      icon: 'lock-closed-outline',
      color: '#f59e0b'
    },
    {
      value: FamilyPrivacyLevelEnum.INVITE_ONLY,
      title: 'Invite Only',
      description: 'Completely private, members can only join by invitation',
      icon: 'key-outline',
      color: '#dc2626'
    }
  ];

  // Avatar options
  avatarOptions = [
    '/assets/family-avatars/family-1.svg',
    '/assets/family-avatars/family-2.svg',
    '/assets/family-avatars/family-3.svg',
    '/assets/family-avatars/family-4.svg',
    '/assets/family-avatars/family-5.svg',
    '/assets/family-avatars/family-6.svg'
  ];

  constructor() {
    this.addIcons();
    this.initializeForm();
  }

  ngOnInit() {
    // Set default avatar
    this.selectedAvatar.set(this.avatarOptions[0]);
    this.familyForm.patchValue({ avatar: this.avatarOptions[0] });
  }

  private addIcons() {
    addIcons({
      arrowBackOutline, peopleOutline, createOutline, settingsOutline,
      globeOutline, lockClosedOutline, keyOutline, checkmarkCircleOutline,
      informationCircleOutline, cameraOutline, imageOutline
    });
  }

  private initializeForm() {
    this.familyForm = this.formBuilder.group({
      // Step 1: Basic Information
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      avatar: [''],

      // Step 2: Privacy Settings
      privacyLevel: [FamilyPrivacyLevelEnum.PRIVATE, [Validators.required]],

      // Step 3: Family Settings
      allowMemberInvites: [DEFAULT_FAMILY_SETTINGS.allowMemberInvites],
      requireApprovalForJoin: [DEFAULT_FAMILY_SETTINGS.requireApprovalForJoin],
      showMemberLocation: [DEFAULT_FAMILY_SETTINGS.showMemberLocation],
      enableNotifications: [DEFAULT_FAMILY_SETTINGS.enableNotifications],
      allowPhotoSharing: [DEFAULT_FAMILY_SETTINGS.allowPhotoSharing],
      allowEventCreation: [DEFAULT_FAMILY_SETTINGS.allowEventCreation],
      maxMembers: [DEFAULT_FAMILY_SETTINGS.maxMembers, [Validators.min(2), Validators.max(100)]],
      timezone: [DEFAULT_FAMILY_SETTINGS.timezone],
      language: [DEFAULT_FAMILY_SETTINGS.language]
    });
  }

  // Step navigation
  nextStep() {
    if (this.currentStep() < this.totalSteps()) {
      if (this.isCurrentStepValid()) {
        this.currentStep.set(this.currentStep() + 1);
      } else {
        this.markCurrentStepFieldsAsTouched();
      }
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  private isCurrentStepValid(): boolean {
    const step = this.currentStep();

    switch (step) {
      case 1:
        return this.familyForm.get('name')?.valid || false;
      case 2:
        return this.familyForm.get('privacyLevel')?.valid || false;
      case 3:
        return true; // Settings are optional
      default:
        return false;
    }
  }

  private markCurrentStepFieldsAsTouched() {
    const step = this.currentStep();

    switch (step) {
      case 1:
        ['name', 'description'].forEach(field => {
          this.familyForm.get(field)?.markAsTouched();
        });
        break;
      case 2:
        this.familyForm.get('privacyLevel')?.markAsTouched();
        break;
      case 3:
        // All settings fields
        Object.keys(this.familyForm.controls).forEach(field => {
          if (!['name', 'description', 'avatar', 'privacyLevel'].includes(field)) {
            this.familyForm.get(field)?.markAsTouched();
          }
        });
        break;
    }
  }

  // Avatar selection
  selectAvatar(avatar: string) {
    this.selectedAvatar.set(avatar);
    this.familyForm.patchValue({ avatar });
  }

  onUploadAvatar() {
    // TODO: Implement custom avatar upload
    console.log('Upload custom avatar');
  }

  // Privacy level selection
  selectPrivacyLevel(level: FamilyPrivacyLevelEnum) {
    this.familyForm.patchValue({ privacyLevel: level });
  }

  getPrivacyLevelInfo(level: FamilyPrivacyLevelEnum) {
    return this.privacyLevels.find(p => p.value === level);
  }

  // Family creation
  onCreateFamily() {
    if (!this.familyForm.valid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading.set(true);

    const formValue = this.familyForm.value;

    const createRequest: CreateFamilyRequest = {
      name: formValue.name,
      description: formValue.description,
      privacyLevel: formValue.privacyLevel,
      settings: {
        allowMemberInvites: formValue.allowMemberInvites,
        requireApprovalForJoin: formValue.requireApprovalForJoin,
        showMemberLocation: formValue.showMemberLocation,
        enableNotifications: formValue.enableNotifications,
        allowPhotoSharing: formValue.allowPhotoSharing,
        allowEventCreation: formValue.allowEventCreation,
        maxMembers: formValue.maxMembers,
        timezone: formValue.timezone,
        language: formValue.language
      }
    };

    this.familyService.createFamily(createRequest).pipe(
      tap((family) => {
        // Navigate to family hub
        this.router.navigate(['/tabs/family'], { replaceUrl: true });
      }),
      catchError(error => {
        console.error('Family creation error:', error);
        return EMPTY;
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    ).subscribe();
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.familyForm.controls).forEach(key => {
      this.familyForm.get(key)?.markAsTouched();
    });
  }

  // Cancel creation
  onCancel() {
    this.router.navigate(['/tabs/home']);
  }

  // Template getters
  get canProceed(): boolean {
    return this.isCurrentStepValid();
  }

  get isLastStep(): boolean {
    return this.currentStep() === this.totalSteps();
  }

  get progressPercentage(): number {
    return (this.currentStep() / this.totalSteps()) * 100;
  }

  get currentStepTitle(): string {
    switch (this.currentStep()) {
      case 1: return 'Basic Information';
      case 2: return 'Privacy Settings';
      case 3: return 'Family Settings';
      default: return '';
    }
  }

  get currentStepDescription(): string {
    switch (this.currentStep()) {
      case 1: return 'Give your family a name and description';
      case 2: return 'Choose who can find and join your family';
      case 3: return 'Configure how your family operates';
      default: return '';
    }
  }

  // Form validation helpers
  getFieldError(fieldName: string): string | null {
    const field = this.familyForm.get(fieldName);
    if (!field || !field.touched || !field.errors) {
      return null;
    }

    const errors = field.errors;
    if (errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
    if (errors['minlength']) return `${this.getFieldDisplayName(fieldName)} is too short`;
    if (errors['maxlength']) return `${this.getFieldDisplayName(fieldName)} is too long`;
    if (errors['min']) return `Value must be at least ${errors['min'].min}`;
    if (errors['max']) return `Value must be at most ${errors['max'].max}`;

    return 'Invalid value';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      name: 'Family name',
      description: 'Description',
      privacyLevel: 'Privacy level',
      maxMembers: 'Maximum members'
    };
    return displayNames[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.getFieldError(fieldName);
  }
}
