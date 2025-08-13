// Create a new service: src/app/core/services/current-family.service.ts

import { Injectable, signal, computed, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { AuthService } from './auth/auth.service';
import { Family } from '../../models/families/family.models';

@Injectable({
  providedIn: 'root'
})
export class CurrentFamilyService {
  private readonly storageService = inject(StorageService);
  private readonly authService = inject(AuthService);

  private readonly CURRENT_FAMILY_KEY = 'current_family_id';

  // State
  private _currentFamilyId = signal<number | null>(null);
  private _currentFamily = signal<Family | null>(null);

  // Public computed properties
  readonly currentFamilyId = computed(() => this._currentFamilyId());
  readonly currentFamily = computed(() => this._currentFamily());
  readonly hasCurrentFamily = computed(() => !!this._currentFamilyId());

  constructor() {
    this.initializeCurrentFamily();
  }

  private async initializeCurrentFamily() {
    try {
      const savedFamilyId = await this.storageService.getItem(this.CURRENT_FAMILY_KEY);
      if (savedFamilyId) {
        this._currentFamilyId.set(parseInt(savedFamilyId));
      }
    } catch (error) {
      console.error('Error loading current family:', error);
    }
  }

  async setCurrentFamily(family: Family | null) {
    if (family) {
      this._currentFamilyId.set(family.id);
      this._currentFamily.set(family);
      await this.storageService.setItem(this.CURRENT_FAMILY_KEY, family.id.toString());
    } else {
      this._currentFamilyId.set(null);
      this._currentFamily.set(null);
      await this.storageService.removeItem(this.CURRENT_FAMILY_KEY);
    }
  }

  async setCurrentFamilyById(familyId: number) {
    this._currentFamilyId.set(familyId);
    await this.storageService.setItem(this.CURRENT_FAMILY_KEY, familyId.toString());
  }

  async clearCurrentFamily() {
    this._currentFamilyId.set(null);
    this._currentFamily.set(null);
    await this.storageService.removeItem(this.CURRENT_FAMILY_KEY);
  }

  updateCurrentFamilyData(family: Family) {
    if (this._currentFamilyId() === family.id) {
      this._currentFamily.set(family);
    }
  }
}
