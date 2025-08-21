import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
  IonIcon, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonRadio, IonRadioGroup, ToastController, LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, homeOutline, documentTextOutline, lockClosedOutline,
  keyOutline, globeOutline, peopleOutline, timeOutline, languageOutline,
  informationCircleOutline, reloadOutline
} from 'ionicons/icons';

import { FamilyService } from '../../../core/services/family/family.service';
import { FamilyPrivacyEnum, CreateFamilyRequest } from '../../../models/families/family.models';

interface TimezoneOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-family-create',
  templateUrl: './family-create.page.html',
  styleUrls: ['./family-create.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
    IonIcon, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonRadio, IonRadioGroup
  ]
})
export class FamilyCreatePage implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly familyService = inject(FamilyService);
  private readonly toastController = inject(ToastController);
  private readonly loadingController = inject(LoadingController);

  createForm!: FormGroup;
  isLoading = false;

  timezones: TimezoneOption[] = [
    { value: 'UTC', label: 'UTC - Coordinated Universal Time' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
  ];

  constructor() {
    this.addIcons();
    this.initializeForm();
  }

  ngOnInit() {
    this.detectUserTimezone();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private addIcons() {
    addIcons({
      arrowBackOutline, homeOutline, documentTextOutline, lockClosedOutline,
      keyOutline, globeOutline, peopleOutline, timeOutline, languageOutline,
      informationCircleOutline, reloadOutline
    });
  }

  private initializeForm() {
    this.createForm = this.formBuilder.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      description: ['', [
        Validators.maxLength(500)
      ]],
      privacy: [FamilyPrivacyEnum.PRIVATE, [Validators.required]],
      maxMembers: [20, [Validators.required]],
      timezone: ['UTC', [Validators.required]],
      language: ['en', [Validators.required]]
    });
  }

  private detectUserTimezone() {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const matchingTimezone = this.timezones.find(tz => tz.value === userTimezone);

      if (matchingTimezone) {
        this.createForm.patchValue({ timezone: userTimezone });
      }
    } catch (error) {
      console.log('Could not detect user timezone:', error);
    }
  }

// Event Handlers
  async goBack() {
    if (this.createForm.dirty && !this.isLoading) {
      const shouldLeave = await this.confirmDiscardChanges();
      if (!shouldLeave) return;
    }

    await this.router.navigate(['/tabs/family']);
  }

  selectPrivacy(privacy: string) {
    this.createForm.patchValue({ privacy });
  }

  async onCreateFamily() {
    if (!this.createForm.valid) {
      this.markFormGroupTouched();
      await this.showToast('Please fill in all required fields correctly.', 'warning');
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Creating your family...',
      spinner: 'crescent'
    });
    await loading.present();

    const familyData: CreateFamilyRequest = {
      name: this.createForm.value.name.trim(),
      description: this.createForm.value.description?.trim() || undefined,
      privacy: this.createForm.value.privacy,
      maxMembers: this.createForm.value.maxMembers,
      timezone: this.createForm.value.timezone,
      language: this.createForm.value.language
    };

    this.familyService.createFamily(familyData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (response) => {
          await loading.dismiss();
          this.isLoading = false;
          await this.showToast('Family created successfully!', 'success');
          await this.router.navigate(['/family', response.data.slug]);
        },
        error: async (error) => {
          await loading.dismiss();
          this.isLoading = false;
          console.error('Create family error:', error);
          await this.showToast('Failed to create family. Please try again.', 'danger');
        }
      });
  }

// Utility Methods
  private markFormGroupTouched() {
    Object.keys(this.createForm.controls).forEach(key => {
      this.createForm.get(key)?.markAsTouched();
    });
  }

  private async confirmDiscardChanges(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = document.createElement('ion-alert');
      alert.header = 'Discard Changes?';
      alert.message = 'You have unsaved changes. Are you sure you want to leave?';
      alert.buttons = [
        {
          text: 'Stay',
          role: 'cancel',
          handler: () => resolve(false)
        },
        {
          text: 'Leave',
          role: 'destructive',
          handler: () => resolve(true)
        }
      ];

      document.body.appendChild(alert);
      await alert.present();
    });
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}
