// src/app/pages/families/family-settings/family-settings.page.ts
import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonIcon, IonBackButton, IonButtons, IonItem, IonInput, IonTextarea, IonToggle,
  IonLabel, IonSelect, IonSelectOption, IonList, IonItemDivider, IonAlert, IonActionSheet,
  IonSegment, IonSegmentButton, IonText, IonChip, IonSpinner, LoadingController, AlertController,
  ActionSheetController, ToastController
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, settingsOutline, lockClosedOutline, globeOutline, eyeOutline,
  notificationsOutline, colorPaletteOutline, peopleOutline, trashOutline, archiveOutline,
  refreshOutline, saveOutline, warningOutline, checkmarkOutline, informationCircleOutline,
  shareOutline, copyOutline, cameraOutline, imageOutline, shieldCheckmarkOutline,
  timeOutline, locationOutline, chatbubbleOutline, calendarOutline, optionsOutline
} from 'ionicons/icons';
import { FamilyService } from '../../../core/services/families/family.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import {
  Family, FamilySettings, UpdateFamilyRequest
} from '../../../models/families/family.models';
import { Subject, takeUntil, switchMap, finalize } from 'rxjs';

@Component({
  selector: 'app-family-settings',
  templateUrl: './family-settings.page.html',
  styleUrls: ['./family-settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonButton, IonIcon, IonBackButton, IonButtons, IonItem, IonInput, IonTextarea, IonToggle,
    IonLabel, IonSelect, IonSelectOption, IonList, IonItemDivider, IonAlert, IonActionSheet,
    IonSegment, IonSegmentButton, IonText, IonChip, IonSpinner
  ]
})
export class FamilySettingsPage implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly familyService = inject(FamilyService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly loadingController = inject(LoadingController);
  private readonly alertController = inject(AlertController);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly toastController = inject(ToastController);
  private readonly destroy$ = new Subject<void>();

  settingsForm!: FormGroup;

  // Signals for reactive state
  familyId = signal<number>(0);
  selectedTab = signal<string>('general');
  isSubmitting = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  hasUnsavedChanges = signal<boolean>(false);

  // Computed properties
  family = computed(() => this.familyService.currentFamily());
  currentUser = computed(() => this.authService.user());

  canManage = computed(() => {
    const fam = this.family();
    const user = this.currentUser();
    if (!fam || !user) return false;
    return this.familyService.canManageFamily(fam, user.id);
  });

  isOwner = computed(() => {
    const fam = this.family();
    const user = this.currentUser();
    if (!fam || !user) return false;
    return fam.ownerId === user.id;
  });

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

  digestFrequencyOptions = [
    { value: 'never', label: 'Never' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
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
      next: (family) => {
        this.populateForm(family);
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
      arrowBackOutline, settingsOutline, lockClosedOutline, globeOutline, eyeOutline,
      notificationsOutline, colorPaletteOutline, peopleOutline, trashOutline, archiveOutline,
      refreshOutline, saveOutline, warningOutline, checkmarkOutline, informationCircleOutline,
      shareOutline, copyOutline, cameraOutline, imageOutline, shieldCheckmarkOutline,
      timeOutline, locationOutline, chatbubbleOutline, calendarOutline, optionsOutline
    });
  }

  private initializeForm() {
    this.settingsForm = this.formBuilder.group({
      // Basic Information
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],

      // Privacy Settings
      isPublic: [false],
      allowMemberInvites: [true],
      requireApprovalForJoining: [false],

      // Feature Settings
      enableLocationSharing: [true],
      enablePhotoSharing: [true],
      enableEventPlanning: [true],
      enableFamilyChat: [true],

      // Notification Settings
      emailNotifications: [true],
      pushNotifications: [true],
      digestFrequency: ['weekly'],

      // Theme Settings
      primaryColor: ['#dc2626']
    });

    // Watch for form changes
    this.settingsForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.hasUnsavedChanges.set(this.settingsForm.dirty);
    });
  }

  private populateForm(family: Family) {
    const settings = family.settings;

    this.settingsForm.patchValue({
      name: family.name,
      description: family.description || '',

      // Privacy settings
      isPublic: settings?.privacy?.isPublic || false,
      allowMemberInvites: settings?.privacy?.allowMemberInvites ?? true,
      requireApprovalForJoining: settings?.privacy?.requireApprovalForJoining || false,

      // Feature settings
      enableLocationSharing: settings?.features?.enableLocationSharing ?? true,
      enablePhotoSharing: settings?.features?.enablePhotoSharing ?? true,
      enableEventPlanning: settings?.features?.enableEventPlanning ?? true,
      enableFamilyChat: settings?.features?.enableFamilyChat ?? true,

      // Notification settings
      emailNotifications: settings?.notifications?.emailNotifications ?? true,
      pushNotifications: settings?.notifications?.pushNotifications ?? true,
      digestFrequency: settings?.notifications?.digestFrequency || 'weekly',

      // Theme settings
      primaryColor: settings?.theme?.primaryColor || '#dc2626'
    });

    // Mark form as pristine after initial population
    this.settingsForm.markAsPristine();
    this.hasUnsavedChanges.set(false);
  }

  // Tab navigation
  onTabChange(event: any) {
    this.selectedTab.set(event.detail.value);
  }

  // Form actions
  async onSaveSettings() {
    if (!this.settingsForm.valid) {
      this.showToast('Please check your form inputs', 'danger');
      return;
    }

    if (!this.canManage()) {
      this.showToast('You do not have permission to modify settings', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Saving settings...',
      spinner: 'crescent'
    });

    await loading.present();
    this.isSubmitting.set(true);

    try {
      const formValue = this.settingsForm.value;
      const familyId = this.familyId();

      const updateData: UpdateFamilyRequest = {
        name: formValue.name.trim(),
        description: formValue.description?.trim() || undefined,
        settings: this.buildFamilySettings(formValue)
      };

      this.familyService.updateFamily(familyId, updateData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(async () => {
            await loading.dismiss();
            this.isSubmitting.set(false);
          })
        )
        .subscribe({
          next: () => {
            this.settingsForm.markAsPristine();
            this.hasUnsavedChanges.set(false);
            this.showToast('Settings saved successfully!', 'success');
          },
          error: (error) => {
            console.error('Error saving settings:', error);
            this.showToast('Failed to save settings. Please try again.', 'danger');
          }
        });

    } catch (error) {
      await loading.dismiss();
      this.isSubmitting.set(false);
      this.showToast('An unexpected error occurred. Please try again.', 'danger');
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

  async onResetSettings() {
    const alert = await this.alertController.create({
      header: 'Reset Settings',
      message: 'This will restore all settings to their default values. Continue?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reset',
          handler: () => {
            this.resetToDefaults();
          }
        }
      ]
    });

    await alert.present();
  }

  private resetToDefaults() {
    this.settingsForm.patchValue({
      isPublic: false,
      allowMemberInvites: true,
      requireApprovalForJoining: false,
      enableLocationSharing: true,
      enablePhotoSharing: true,
      enableEventPlanning: true,
      enableFamilyChat: true,
      emailNotifications: true,
      pushNotifications: true,
      digestFrequency: 'weekly',
      primaryColor: '#dc2626'
    });

    this.showToast('Settings reset to defaults', 'success');
  }

  // Color theme selection
  selectColorTheme(theme: any) {
    this.settingsForm.patchValue({ primaryColor: theme.value });
  }

  getSelectedTheme() {
    const selectedColor = this.settingsForm.get('primaryColor')?.value;
    return this.colorThemes.find(theme => theme.value === selectedColor) || this.colorThemes[0];
  }

  // Invite code management
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
        // User cancelled
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

  // Dangerous actions
  async onArchiveFamily() {
    const family = this.family();
    if (!family) return;

    const alert = await this.alertController.create({
      header: 'Archive Family',
      message: 'This will archive the family and make it inactive. Members will not be able to access it until restored.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Archive',
          role: 'destructive',
          handler: async () => {
            try {
              const archiveObs = await this.familyService.archiveFamily(family.id);
              archiveObs.pipe(takeUntil(this.destroy$)).subscribe({
                next: () => {
                  this.router.navigate(['/families']);
                }
              });
            } catch (error) {
              console.error('Error archiving family:', error);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async onDeleteFamily() {
    const family = this.family();
    if (!family) return;

    const alert = await this.alertController.create({
      header: 'Delete Family',
      message: 'This will permanently delete the family and all its data. This action cannot be undone.',
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
          handler: async (data) => {
            if (data.confirmation !== family.name) {
              this.showToast('Confirmation text does not match', 'danger');
            }

            try {
              const deleteObs = await this.familyService.deleteFamily(family.id);
              deleteObs.pipe(takeUntil(this.destroy$)).subscribe({
                next: () => {
                  this.router.navigate(['/families']);
                }
              });
            } catch (error) {
              console.error('Error deleting family:', error);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async onShowDangerousActions() {
    const family = this.family();
    if (!family || !this.isOwner()) return;

    const actionSheet = await this.actionSheetController.create({
      header: 'Dangerous Actions',
      buttons: [
        {
          text: 'Archive Family',
          icon: 'archive-outline',
          handler: () => {
            this.onArchiveFamily();
          }
        },
        {
          text: 'Delete Family',
          role: 'destructive',
          icon: 'trash-outline',
          handler: () => {
            this.onDeleteFamily();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  // Navigation guards
  async canDeactivate(): Promise<boolean> {
    if (!this.hasUnsavedChanges()) {
      return true;
    }

    const alert = await this.alertController.create({
      header: 'Unsaved Changes',
      message: 'You have unsaved changes. Do you want to leave without saving?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Leave',
          role: 'destructive',
          handler: () => true
        }
      ]
    });

    await alert.present();

    return new Promise((resolve) => {
      alert.onDidDismiss().then((result) => {
        resolve(result.role !== 'cancel');
      });
    });
  }

  // Utility methods
  getFieldError(fieldName: string): string | null {
    const field = this.settingsForm.get(fieldName);
    if (!field || !field.touched || !field.errors) {
      return null;
    }

    const errors = field.errors;

    if (errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
    if (errors['minlength']) return `${this.getFieldDisplayName(fieldName)} is too short`;
    if (errors['maxlength']) return `${this.getFieldDisplayName(fieldName)} is too long`;

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
  get canSaveSettings(): boolean {
    return this.settingsForm.valid && this.hasUnsavedChanges() && !this.isSubmitting();
  }
}
