import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText, IonInput,
  IonItem, IonLabel, IonTextarea, IonSelect, IonSelectOption, IonToggle,
  IonBackButton, IonButtons, IonGrid, IonRow, IonCol, IonRange,
  IonChip, IonBadge, IonList, IonAlert, AlertController, IonActionSheet,
  ActionSheetController, IonModal, ModalController, IonAvatar
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, settingsOutline, saveOutline, trashOutline,
  peopleOutline, lockClosedOutline, globeOutline, keyOutline,
  notificationsOutline, cameraOutline, calendarOutline, locationOutline,
  shieldCheckmarkOutline, warningOutline, informationCircleOutline,
  ellipsisVerticalOutline, exitOutline, imageOutline
} from 'ionicons/icons';

import { FamilyService } from '../../../core/services/family/family.service';
import { FamilyMemberService } from '../../../core/services/family/family-member.service';
import {
  Family,
  FamilyPrivacyLevelEnum,
  UpdateFamilyRequest,
  FamilySettings,
  DEFAULT_FAMILY_SETTINGS
} from '../../../models/families/family.models';
import { catchError, EMPTY, finalize, tap } from 'rxjs';

@Component({
  selector: 'app-family-settings',
  templateUrl: './family-settings.page.html',
  styleUrls: ['./family-settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonInput,
    IonItem, IonLabel, IonTextarea, IonSelect, IonSelectOption, IonToggle,
    IonBackButton, IonButtons, IonRange, IonList, IonAvatar
  ]
})
export class FamilySettingsPage implements OnInit, OnDestroy {
  private readonly familyService = inject(FamilyService);
  private readonly memberService = inject(FamilyMemberService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly alertController = inject(AlertController);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly modalController = inject(ModalController);
  private readonly destroy$ = new Subject<void>();

  // Signals for reactive state
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  currentFamily = signal<Family | null>(null);
  hasUnsavedChanges = signal<boolean>(false);

  // Forms
  basicInfoForm!: FormGroup;
  privacyForm!: FormGroup;
  settingsForm!: FormGroup;

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

  // Timezone options (simplified list)
  timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Australia/Sydney', label: 'Sydney' }
  ];

  // Language options
  languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' }
  ];

  constructor() {
    this.addIcons();
    this.initializeForms();
  }

  ngOnInit() {
    this.loadFamilyData();
    this.setupFormChangeDetection();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private addIcons() {
    addIcons({
      arrowBackOutline, settingsOutline, saveOutline, trashOutline,
      peopleOutline, lockClosedOutline, globeOutline, keyOutline,
      notificationsOutline, cameraOutline, calendarOutline, locationOutline,
      shieldCheckmarkOutline, warningOutline, informationCircleOutline,
      ellipsisVerticalOutline, exitOutline, imageOutline
    });
  }

  private initializeForms() {
    this.basicInfoForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      avatar: ['']
    });

    this.privacyForm = this.formBuilder.group({
      privacyLevel: [FamilyPrivacyLevelEnum.PRIVATE, [Validators.required]]
    });

    this.settingsForm = this.formBuilder.group({
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

  private loadFamilyData() {
    combineLatest([
      this.familyService.currentFamily$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([family]) => {
      if (family) {
        this.currentFamily.set(family);
        this.populateForms(family);
      }
    });
  }

  private populateForms(family: Family) {
    this.basicInfoForm.patchValue({
      name: family.name,
      description: family.description || '',
      avatar: family.avatar || ''
    });

    this.privacyForm.patchValue({
      privacyLevel: family.privacyLevel
    });

    if (family.settings) {
      this.settingsForm.patchValue(family.settings);
    }
  }

  private setupFormChangeDetection() {
    combineLatest([
      this.basicInfoForm.valueChanges,
      this.privacyForm.valueChanges,
      this.settingsForm.valueChanges
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.hasUnsavedChanges.set(true);
    });
  }

  // Save methods
  async onSaveBasicInfo() {
    if (!this.basicInfoForm.valid) {
      this.basicInfoForm.markAllAsTouched();
      return;
    }

    await this.saveChanges();
  }

  async onSavePrivacy() {
    if (!this.privacyForm.valid) {
      this.privacyForm.markAllAsTouched();
      return;
    }

    await this.saveChanges();
  }

  async onSaveSettings() {
    if (!this.settingsForm.valid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    await this.saveChanges();
  }

  async onSaveAll() {
    if (!this.basicInfoForm.valid || !this.privacyForm.valid || !this.settingsForm.valid) {
      this.markAllFormsAsTouched();
      return;
    }

    await this.saveChanges();
  }

  private async saveChanges() {
    const family = this.currentFamily();
    if (!family) return;

    this.isSaving.set(true);

    const updateRequest: UpdateFamilyRequest = {
      name: this.basicInfoForm.value.name,
      description: this.basicInfoForm.value.description,
      privacyLevel: this.privacyForm.value.privacyLevel,
      settings: {
        allowMemberInvites: this.settingsForm.value.allowMemberInvites,
        requireApprovalForJoin: this.settingsForm.value.requireApprovalForJoin,
        showMemberLocation: this.settingsForm.value.showMemberLocation,
        enableNotifications: this.settingsForm.value.enableNotifications,
        allowPhotoSharing: this.settingsForm.value.allowPhotoSharing,
        allowEventCreation: this.settingsForm.value.allowEventCreation,
        maxMembers: this.settingsForm.value.maxMembers,
        timezone: this.settingsForm.value.timezone,
        language: this.settingsForm.value.language
      }
    };

    this.familyService.updateFamily(family.id, updateRequest).pipe(
      tap(() => {
        this.hasUnsavedChanges.set(false);
      }),
      catchError(error => {
        console.error('Save error:', error);
        return EMPTY;
      }),
      finalize(() => {
        this.isSaving.set(false);
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  // Avatar management
  onChangeAvatar() {
    // TODO: Implement avatar upload/selection
    console.log('Change avatar');
  }

  // Privacy level selection
  selectPrivacyLevel(level: FamilyPrivacyLevelEnum) {
    this.privacyForm.patchValue({ privacyLevel: level });
  }

  getPrivacyLevelInfo(level: FamilyPrivacyLevelEnum) {
    return this.privacyLevels.find(p => p.value === level);
  }

  // Dangerous actions
  async onLeaveFamily() {
    const family = this.currentFamily();
    if (!family) return;

    const alert = await this.alertController.create({
      header: 'Leave Family',
      message: 'Are you sure you want to leave this family? You will need to be re-invited to rejoin.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Leave',
          role: 'destructive',
          handler: () => {
            this.familyService.leaveFamily(family.id).pipe(
              tap(() => {
                this.router.navigate(['/tabs/home'], { replaceUrl: true });
              }),
              takeUntil(this.destroy$)
            ).subscribe();
          }
        }
      ]
    });

    await alert.present();
  }

  async onDeleteFamily() {
    const family = this.currentFamily();
    if (!family) return;

    const alert = await this.alertController.create({
      header: 'Delete Family',
      message: 'Are you sure you want to permanently delete this family? This action cannot be undone and all family data will be lost.',
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
              this.familyService.deleteFamily(family.id).pipe(
                tap(() => {
                  this.router.navigate(['/tabs/home'], { replaceUrl: true });
                }),
                takeUntil(this.destroy$)
              ).subscribe();
              return true;
            } else {
              this.showConfirmationError();
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async showConfirmationError() {
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'Family name does not match. Please try again.',
      buttons: ['OK']
    });
    await alert.present();
  }

  // Navigation
  async onCancel() {
    if (this.hasUnsavedChanges()) {
      const alert = await this.alertController.create({
        header: 'Unsaved Changes',
        message: 'You have unsaved changes. Do you want to save them before leaving?',
        buttons: [
          {
            text: 'Discard',
            role: 'destructive',
            handler: () => {
              this.router.navigate(['/tabs/family']);
            }
          },
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Save',
            handler: async () => {
              await this.onSaveAll();
              this.router.navigate(['/tabs/family']);
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.router.navigate(['/tabs/family']);
    }
  }

  async onMoreActions() {
    const family = this.currentFamily();
    if (!family) return;

    const actionSheet = await this.actionSheetController.create({
      header: 'Family Actions',
      buttons: [
        {
          text: 'View Members',
          icon: 'people-outline',
          handler: () => {
            this.router.navigate(['/family/members']);
          }
        },
        {
          text: 'Invite Members',
          icon: 'person-add-outline',
          handler: () => {
            this.router.navigate(['/family/invite']);
          }
        },
        {
          text: 'View Invitations',
          icon: 'mail-outline',
          handler: () => {
            this.router.navigate(['/family/invitations']);
          }
        },
        {
          text: 'Family Activities',
          icon: 'stats-chart-outline',
          handler: () => {
            this.router.navigate(['/family/activities']);
          }
        },
        {
          text: 'Leave Family',
          icon: 'exit-outline',
          role: 'destructive',
          handler: () => {
            this.onLeaveFamily();
          }
        },
        {
          text: 'Delete Family',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.onDeleteFamily();
          }
        },
        {
          text: 'Cancel',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  // Form validation helpers
  private markAllFormsAsTouched() {
    this.basicInfoForm.markAllAsTouched();
    this.privacyForm.markAllAsTouched();
    this.settingsForm.markAllAsTouched();
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string | null {
    const field = formGroup.get(fieldName);
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
      maxMembers: 'Maximum members'
    };
    return displayNames[fieldName] || fieldName;
  }

  hasFieldError(formGroup: FormGroup, fieldName: string): boolean {
    return !!this.getFieldError(formGroup, fieldName);
  }

  // Template getters
  get canSave(): boolean {
    return (this.basicInfoForm.valid && this.privacyForm.valid && this.settingsForm.valid)
      && this.hasUnsavedChanges()
      && !this.isSaving();
  }

  get isOwner(): boolean {
    const family = this.currentFamily();
    return family?.isOwner || false;
  }

  get memberCount(): number {
    const family = this.currentFamily();
    return family?.memberCount || 0;
  }
}
