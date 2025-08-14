// family-switch.page.ts
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText,
  IonBackButton, IonButtons, IonGrid, IonRow, IonCol, IonAvatar,
  IonChip, IonLabel, IonBadge, IonSearchbar, IonRefresher,
  IonRefresherContent, ToastController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, swapHorizontalOutline, peopleOutline,
  checkmarkCircleOutline, addOutline, searchOutline,
  lockClosedOutline, globeOutline, keyOutline
} from 'ionicons/icons';

import { FamilyService } from '../../../core/services/family/family.service';
import { FamilyCardComponent } from '../../../components/family/family-card/family-card.component';
import { Family, FamilyPrivacyLevelEnum } from '../../../models/families/family.models';

@Component({
  selector: 'app-family-switch',
  templateUrl: './family-switch.page.html',
  styleUrls: ['./family-switch.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText,
    IonBackButton, IonButtons, IonGrid, IonRow, IonCol, IonAvatar,
    IonChip, IonLabel, IonBadge, IonSearchbar, IonRefresher,
    IonRefresherContent, FamilyCardComponent
  ]
})
export class FamilySwitchPage implements OnInit, OnDestroy {
  private readonly familyService = inject(FamilyService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly destroy$ = new Subject<void>();

  userFamilies = signal<Family[]>([]);
  filteredFamilies = signal<Family[]>([]);
  currentFamily = signal<Family | null>(null);
  isLoading = signal<boolean>(false);
  searchTerm = signal<string>('');

  constructor() {
    addIcons({
      arrowBackOutline, swapHorizontalOutline, peopleOutline,
      checkmarkCircleOutline, addOutline, searchOutline,
      lockClosedOutline, globeOutline, keyOutline
    });
  }

  ngOnInit() {
    this.loadCurrentFamily();
    this.loadUserFamilies();
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

  private loadUserFamilies() {
    this.isLoading.set(true);

    this.familyService.loadUserFamilies().pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (families) => {
        this.userFamilies.set(families);
        this.filteredFamilies.set(families);
      },
      error: async () => {
        await this.showToast('Failed to load families', 'danger');
      }
    });
  }

  onSearchChange(event: any) {
    const searchTerm = event.detail.value.toLowerCase();
    this.searchTerm.set(searchTerm);

    if (!searchTerm) {
      this.filteredFamilies.set(this.userFamilies());
    } else {
      const filtered = this.userFamilies().filter(family =>
        family.name.toLowerCase().includes(searchTerm) ||
        family.description?.toLowerCase().includes(searchTerm)
      );
      this.filteredFamilies.set(filtered);
    }
  }

  async onFamilySelected(family: Family) {
    const currentFamily = this.currentFamily();

    if (currentFamily?.id === family.id) {
      await this.showToast('This family is already selected', 'warning');
      return;
    }

    this.isLoading.set(true);

    this.familyService.switchFamily(family.id).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: async () => {
        await this.showToast(`Switched to ${family.name}`, 'success');
        this.router.navigate(['/tabs/family'], { replaceUrl: true });
      },
      error: async () => {
        await this.showToast('Failed to switch family', 'danger');
      }
    });
  }

  onFamilySettings(family: Family) {
    this.familyService.switchFamily(family.id).subscribe(() => {
      this.router.navigate(['/family/settings']);
    });
  }

  onFamilyMembers(family: Family) {
    this.familyService.switchFamily(family.id).subscribe(() => {
      this.router.navigate(['/family/members']);
    });
  }

  onCreateFamily() {
    this.router.navigate(['/family/create']);
  }

  onJoinFamily() {
    this.router.navigate(['/family/join']);
  }

  onRefresh(event: any) {
    this.loadUserFamilies();
    event.target.complete();
  }

  isCurrentFamily(family: Family): boolean {
    return this.currentFamily()?.id === family.id;
  }

  getPrivacyIcon(privacyLevel: FamilyPrivacyLevelEnum): string {
    switch (privacyLevel) {
      case FamilyPrivacyLevelEnum.PUBLIC: return 'globe-outline';
      case FamilyPrivacyLevelEnum.PRIVATE: return 'lock-closed-outline';
      case FamilyPrivacyLevelEnum.INVITE_ONLY: return 'key-outline';
      default: return 'lock-closed-outline';
    }
  }

  getPrivacyColor(privacyLevel: FamilyPrivacyLevelEnum): string {
    switch (privacyLevel) {
      case FamilyPrivacyLevelEnum.PUBLIC: return '#22c55e';
      case FamilyPrivacyLevelEnum.PRIVATE: return '#f59e0b';
      case FamilyPrivacyLevelEnum.INVITE_ONLY: return '#dc2626';
      default: return '#6b7280';
    }
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
