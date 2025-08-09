// src/app/core/services/families/family.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, map, tap, catchError } from 'rxjs';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { ApiUrlService } from '../api.service';
import {
  Family,
  FamilyResponse,
  FamilyListResponse,
  CreateFamilyRequest,
  UpdateFamilyRequest,
  JoinFamilyByCodeRequest,
  FamilyDashboardData,
  FamilyStats
} from '../../../models/families/family.models';

@Injectable({
  providedIn: 'root'
})
export class FamilyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);
  private readonly toastController = inject(ToastController);
  private readonly loadingController = inject(LoadingController);
  private readonly alertController = inject(AlertController);

  // State management
  private readonly currentFamilySubject = new BehaviorSubject<Family | null>(null);
  private readonly familiesSubject = new BehaviorSubject<Family[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  // Signals for reactive state
  private readonly _currentFamily = signal<Family | null>(null);
  private readonly _families = signal<Family[]>([]);
  private readonly _isLoading = signal<boolean>(false);

  // Public observables
  readonly currentFamily$ = this.currentFamilySubject.asObservable();
  readonly families$ = this.familiesSubject.asObservable();
  readonly isLoading$ = this.loadingSubject.asObservable();

  // Computed signals
  readonly currentFamily = computed(() => this._currentFamily());
  readonly families = computed(() => this._families());
  readonly isLoading = computed(() => this._isLoading());
  readonly hasCurrentFamily = computed(() => !!this._currentFamily());
  readonly userFamilyCount = computed(() => this._families().length);

  constructor() {
    // Sync BehaviorSubjects with signals
    this.currentFamilySubject.subscribe(family => this._currentFamily.set(family));
    this.familiesSubject.subscribe(families => this._families.set(families));
    this.loadingSubject.subscribe(loading => this._isLoading.set(loading));
  }

  // Family CRUD operations
  createFamily(familyData: CreateFamilyRequest): Observable<Family> {
    this.setLoading(true);

    return this.http.post<FamilyResponse>(
      this.apiUrlService.getUrl('families'),
      familyData
    ).pipe(
      map(response => response.data),
      tap(family => {
        this.addFamilyToList(family);
        this.setCurrentFamily(family);
        this.showToast('Family created successfully!', 'success');
      }),
      catchError(error => this.handleError(error, 'Failed to create family')),
      tap(() => this.setLoading(false))
    );
  }

  updateFamily(familyId: number, updates: UpdateFamilyRequest): Observable<Family> {
    this.setLoading(true);

    return this.http.put<FamilyResponse>(
      this.apiUrlService.getUrl(`families/${familyId}`),
      updates
    ).pipe(
      map(response => response.data),
      tap(updatedFamily => {
        this.updateFamilyInList(updatedFamily);
        if (this._currentFamily()?.id === familyId) {
          this.setCurrentFamily(updatedFamily);
        }
        this.showToast('Family updated successfully!', 'success');
      }),
      catchError(error => this.handleError(error, 'Failed to update family')),
      tap(() => this.setLoading(false))
    );
  }

  async deleteFamily(familyId: number): Promise<Observable<void>> {
    return await this.showConfirmDialog(
      'Delete Family',
      'Are you sure you want to delete this family? This action cannot be undone.',
      'Delete'
    ).then(confirmed => {
      if (!confirmed) {
        return throwError(() => new Error('Action cancelled'));
      }

      this.setLoading(true);

      return this.http.delete<{ success: boolean; message: string }>(
        this.apiUrlService.getUrl(`families/${familyId}`)
      ).pipe(
        tap(() => {
          this.removeFamilyFromList(familyId);
          if (this._currentFamily()?.id === familyId) {
            this.setCurrentFamily(null);
          }
          this.showToast('Family deleted successfully', 'success');
        }),
        map(() => void 0),
        catchError(error => this.handleError(error, 'Failed to delete family')),
        tap(() => this.setLoading(false))
      );
    });
  }

  // Family retrieval
  getFamilies(): Observable<Family[]> {
    this.setLoading(true);

    return this.http.get<FamilyListResponse>(
      this.apiUrlService.getUrl('families')
    ).pipe(
      map(response => response.data),
      tap(families => this.setFamilies(families)),
      catchError(error => this.handleError(error, 'Failed to load families')),
      tap(() => this.setLoading(false))
    );
  }

  getFamily(familyId: number): Observable<Family> {
    this.setLoading(true);

    return this.http.get<FamilyResponse>(
      this.apiUrlService.getUrl(`families/${familyId}`)
    ).pipe(
      map(response => response.data),
      tap(family => {
        this.setCurrentFamily(family);
        this.updateFamilyInList(family);
      }),
      catchError(error => this.handleError(error, 'Failed to load family')),
      tap(() => this.setLoading(false))
    );
  }

  getFamilyDashboard(familyId: number): Observable<FamilyDashboardData> {
    return this.http.get<{ success: boolean; data: FamilyDashboardData }>(
      this.apiUrlService.getUrl(`families/${familyId}/dashboard`)
    ).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error, 'Failed to load dashboard data'))
    );
  }

  // Family joining
  joinFamilyByCode(inviteCode: string): Observable<Family> {
    this.setLoading(true);

    return this.http.post<FamilyResponse>(
      this.apiUrlService.getUrl(`families/join/${inviteCode}`),
      {}
    ).pipe(
      map(response => response.data),
      tap(family => {
        this.addFamilyToList(family);
        this.setCurrentFamily(family);
        this.showToast(`Welcome to ${family.name}!`, 'success');
      }),
      catchError(error => this.handleError(error, 'Failed to join family')),
      tap(() => this.setLoading(false))
    );
  }

  async leaveFamily(familyId: number): Promise<Observable<void>> {
    return await this.showConfirmDialog(
      'Leave Family',
      'Are you sure you want to leave this family?',
      'Leave'
    ).then(confirmed => {
      if (!confirmed) {
        return throwError(() => new Error('Action cancelled'));
      }

      this.setLoading(true);

      return this.http.post<{ success: boolean; message: string }>(
        this.apiUrlService.getUrl(`families/${familyId}/leave`),
        {}
      ).pipe(
        tap(() => {
          this.removeFamilyFromList(familyId);
          if (this._currentFamily()?.id === familyId) {
            this.setCurrentFamily(null);
          }
          this.showToast('Left family successfully', 'success');
        }),
        map(() => void 0),
        catchError(error => this.handleError(error, 'Failed to leave family')),
        tap(() => this.setLoading(false))
      );
    });
  }

  // Invite code management
  regenerateInviteCode(familyId: number): Observable<string> {
    return this.http.post<{ success: boolean; data: { inviteCode: string } }>(
      this.apiUrlService.getUrl(`families/${familyId}/regenerate-code`),
      {}
    ).pipe(
      map(response => response.data.inviteCode),
      tap(newCode => {
        const currentFamily = this._currentFamily();
        if (currentFamily && currentFamily.id === familyId) {
          this.setCurrentFamily({ ...currentFamily, inviteCode: newCode });
        }
        this.showToast('New invite code generated', 'success');
      }),
      catchError(error => this.handleError(error, 'Failed to generate new invite code'))
    );
  }

  // Archive/Restore
  async archiveFamily(familyId: number): Promise<Observable<Family>> {
    return await this.showConfirmDialog(
      'Archive Family',
      'This will archive the family and make it inactive. You can restore it later.',
      'Archive'
    ).then(confirmed => {
      if (!confirmed) {
        return throwError(() => new Error('Action cancelled'));
      }

      return this.http.post<FamilyResponse>(
        this.apiUrlService.getUrl(`families/${familyId}/archive`),
        {}
      ).pipe(
        map(response => response.data),
        tap(family => {
          this.updateFamilyInList(family);
          if (this._currentFamily()?.id === familyId) {
            this.setCurrentFamily(family);
          }
          this.showToast('Family archived successfully', 'success');
        }),
        catchError(error => this.handleError(error, 'Failed to archive family'))
      );
    });
  }

  restoreFamily(familyId: number): Observable<Family> {
    return this.http.post<FamilyResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/restore`),
      {}
    ).pipe(
      map(response => response.data),
      tap(family => {
        this.updateFamilyInList(family);
        if (this._currentFamily()?.id === familyId) {
          this.setCurrentFamily(family);
        }
        this.showToast('Family restored successfully', 'success');
      }),
      catchError(error => this.handleError(error, 'Failed to restore family'))
    );
  }

  // State management helpers
  setCurrentFamily(family: Family | null): void {
    this.currentFamilySubject.next(family);
  }

  setFamilies(families: Family[]): void {
    this.familiesSubject.next(families);
  }

  addFamilyToList(family: Family): void {
    const currentFamilies = this.familiesSubject.value;
    const existingIndex = currentFamilies.findIndex(f => f.id === family.id);

    if (existingIndex >= 0) {
      currentFamilies[existingIndex] = family;
    } else {
      currentFamilies.push(family);
    }

    this.familiesSubject.next([...currentFamilies]);
  }

  updateFamilyInList(updatedFamily: Family): void {
    const currentFamilies = this.familiesSubject.value;
    const index = currentFamilies.findIndex(f => f.id === updatedFamily.id);

    if (index >= 0) {
      currentFamilies[index] = updatedFamily;
      this.familiesSubject.next([...currentFamilies]);
    }
  }

  removeFamilyFromList(familyId: number): void {
    const currentFamilies = this.familiesSubject.value;
    const filteredFamilies = currentFamilies.filter(f => f.id !== familyId);
    this.familiesSubject.next(filteredFamilies);
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  // Utility methods
  canManageFamily(family: Family, userId: number): boolean {
    return family.ownerId === userId ||
      family.members?.some(m =>
        m.userId === userId &&
        ['owner', 'admin'].includes(m.role) &&
        m.status === 'active'
      ) || false;
  }

  getUserRoleInFamily(family: Family, userId: number): string | null {
    if (family.ownerId === userId) return 'owner';

    const member = family.members?.find(m =>
      m.userId === userId && m.status === 'active'
    );

    return member?.role || null;
  }

  hasPermission(family: Family, userId: number, permission: string): boolean {
    const member = family.members?.find(m =>
      m.userId === userId && m.status === 'active'
    );

    if (!member) return false;
    if (member.role === 'owner') return true;

    return member.permissions.includes(permission);
  }

  // Error handling and UI helpers
  private handleError(error: HttpErrorResponse, defaultMessage: string): Observable<never> {
    console.error('Family service error:', error);

    let errorMessage = defaultMessage;

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    this.showToast(errorMessage, 'danger');
    return throwError(() => error);
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      buttons: [{ text: 'Dismiss', role: 'cancel' }]
    });
    await toast.present();
  }

  private async showConfirmDialog(header: string, message: string, confirmText: string = 'Confirm'): Promise<boolean> {
    return new Promise(resolve => {
      this.alertController.create({
        header,
        message,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: confirmText,
            handler: () => resolve(true)
          }
        ]
      }).then(alert => alert.present());
    });
  }

  async showLoading(message: string = 'Please wait...'): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({
      message,
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }
}
