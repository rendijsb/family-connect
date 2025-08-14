// frontend/src/app/core/services/family/family.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {Observable, BehaviorSubject, throwError, tap, catchError, map, from, switchMap, EMPTY} from 'rxjs';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { ApiUrlService } from '../api.service';
import {
  Family,
  FamilyResponse,
  FamilyListResponse,
  CreateFamilyRequest,
  UpdateFamilyRequest,
  FamilyStats,
  FamilyStatsResponse,
  FamilyActivity,
  FamilyActivityResponse,
  FamilyPrivacyLevelEnum,
  DEFAULT_FAMILY_SETTINGS
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
  private currentFamilySubject = new BehaviorSubject<Family | null>(null);
  private familiesSubject = new BehaviorSubject<Family[]>([]);
  private familyStatsSubject = new BehaviorSubject<FamilyStats | null>(null);
  private activitiesSubject = new BehaviorSubject<FamilyActivity[]>([]);

  // Public observables
  readonly currentFamily$ = this.currentFamilySubject.asObservable();
  readonly families$ = this.familiesSubject.asObservable();
  readonly familyStats$ = this.familyStatsSubject.asObservable();
  readonly activities$ = this.activitiesSubject.asObservable();

  // Signals for reactive state
  private currentFamilySignal = signal<Family | null>(null);
  private familiesSignal = signal<Family[]>([]);
  private isLoadingSignal = signal<boolean>(false);

  // Computed signals
  readonly currentFamily = this.currentFamilySignal.asReadonly();
  readonly families = this.familiesSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly hasFamily = computed(() => !!this.currentFamilySignal());
  readonly isOwner = computed(() => this.currentFamilySignal()?.isOwner || false);
  readonly isAdmin = computed(() => this.currentFamilySignal()?.isAdmin || false);
  readonly canManage = computed(() => this.currentFamilySignal()?.canManage || false);

  constructor() {
    // Subscribe to state changes and update signals
    this.currentFamily$.subscribe(family => {
      this.currentFamilySignal.set(family);
    });

    this.families$.subscribe(families => {
      this.familiesSignal.set(families);
    });
  }

  // Family CRUD operations
  createFamily(familyData: CreateFamilyRequest): Observable<Family> {
    this.isLoadingSignal.set(true);

    const payload = {
      ...familyData,
      settings: { ...DEFAULT_FAMILY_SETTINGS, ...familyData.settings }
    };

    return this.http.post<FamilyResponse>(
      this.apiUrlService.getUrl('families'),
      payload
    ).pipe(
      map(response => response.data),
      tap(async (family) => {
        this.currentFamilySubject.next(family);
        await this.loadUserFamilies(); // Refresh family list
        await this.showToast('Family created successfully!', 'success');
      }),
      catchError(error => this.handleError(error)),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  updateFamily(familyId: number, updateData: UpdateFamilyRequest): Observable<Family> {
    this.isLoadingSignal.set(true);

    return this.http.put<FamilyResponse>(
      this.apiUrlService.getUrl(`families/${familyId}`),
      updateData
    ).pipe(
      map(response => response.data),
      tap(async (family) => {
        this.currentFamilySubject.next(family);
        await this.loadUserFamilies(); // Refresh family list
        await this.showToast('Family updated successfully!', 'success');
      }),
      catchError(error => this.handleError(error)),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  deleteFamily(familyId: number): Observable<void> {
    // Convert Promise to Observable and chain the HTTP request
    return from(this.showConfirmDialog(
      'Delete Family',
      'Are you sure you want to delete this family? This action cannot be undone.',
      ['Cancel', 'Delete']
    )).pipe(
      switchMap(confirmed => {
        if (!confirmed) {
          return EMPTY;
        }

        this.isLoadingSignal.set(true);

        return this.http.delete<{ success: boolean; message: string }>(
          this.apiUrlService.getUrl(`families/${familyId}`)
        ).pipe(
          tap(async () => {
            this.currentFamilySubject.next(null);
            await this.loadUserFamilies();
            await this.showToast('Family deleted successfully', 'success');
          }),
          map(() => void 0),
          catchError(error => this.handleError(error)),
          tap(() => this.isLoadingSignal.set(false))
        );
      })
    );
  }

  // Family retrieval
  getFamilyById(familyId: number): Observable<Family> {
    return this.http.get<FamilyResponse>(
      this.apiUrlService.getUrl(`families/${familyId}`)
    ).pipe(
      map(response => response.data),
      tap(family => {
        this.currentFamilySubject.next(family);
      }),
      catchError(error => this.handleError(error))
    );
  }

  loadUserFamilies(): Observable<Family[]> {
    return this.http.get<FamilyListResponse>(
      this.apiUrlService.getUrl('user/family')
    ).pipe(
      map(response => response.data),
      tap(families => {
        this.familiesSubject.next(families);

        // Set current family if none selected but user has family
        if (!this.currentFamilySignal() && families.length > 0) {
          this.currentFamilySubject.next(families[0]);
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  switchFamily(familyId: number): Observable<Family> {
    const family = this.familiesSignal().find(f => f.id === familyId);

    if (family) {
      this.currentFamilySubject.next(family);
      return new Observable(subscriber => {
        subscriber.next(family);
        subscriber.complete();
      });
    }

    return this.getFamilyById(familyId);
  }

  // Family statistics
  getFamilyStats(familyId: number): Observable<FamilyStats> {
    return this.http.get<FamilyStatsResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/stats`)
    ).pipe(
      map(response => response.data),
      tap(stats => {
        this.familyStatsSubject.next(stats);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Family activities
  getFamilyActivities(familyId: number, page: number = 1, limit: number = 20): Observable<FamilyActivity[]> {
    const params = { page: page.toString(), limit: limit.toString() };

    return this.http.get<FamilyActivityResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/activities`),
      { params }
    ).pipe(
      map(response => response.data),
      tap(activities => {
        if (page === 1) {
          this.activitiesSubject.next(activities);
        } else {
          // Append to existing activities for pagination
          const currentActivities = this.activitiesSubject.value;
          this.activitiesSubject.next([...currentActivities, ...activities]);
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Family search and discovery
  searchFamilies(query: string, privacy: FamilyPrivacyLevelEnum[] = []): Observable<Family[]> {
    const params: any = { q: query };
    if (privacy.length > 0) {
      params.privacy = privacy.join(',');
    }

    return this.http.get<FamilyListResponse>(
      this.apiUrlService.getUrl('family/search'),
      { params }
    ).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error))
    );
  }

  // Join family by invitation token
  joinFamilyByToken(token: string, nickname?: string): Observable<Family> {
    this.isLoadingSignal.set(true);

    const payload = { token, nickname };

    return this.http.post<FamilyResponse>(
      this.apiUrlService.getUrl('family/join'),
      payload
    ).pipe(
      map(response => response.data),
      tap(async (family) => {
        this.currentFamilySubject.next(family);
        await this.loadUserFamilies();
        await this.showToast('Successfully joined family!', 'success');
      }),
      catchError(error => this.handleError(error)),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  leaveFamily(familyId: number): Observable<void> {
    return from(this.showConfirmDialog(
      'Leave Family',
      'Are you sure you want to leave this family?',
      ['Cancel', 'Leave']
    )).pipe(
      switchMap(confirmed => {
        if (!confirmed) {
          return EMPTY;
        }

        this.isLoadingSignal.set(true);

        return this.http.delete<{ success: boolean; message: string }>(
          this.apiUrlService.getUrl(`families/${familyId}/leave`)
        ).pipe(
          tap(async () => {
            // Remove family from list
            const families = this.familiesSignal().filter(f => f.id !== familyId);
            this.familiesSubject.next(families);

            // Switch to another family or clear current
            if (this.currentFamilySignal()?.id === familyId) {
              this.currentFamilySubject.next(families.length > 0 ? families[0] : null);
            }

            await this.showToast('Left family successfully', 'success');
          }),
          map(() => void 0),
          catchError(error => this.handleError(error)),
          tap(() => this.isLoadingSignal.set(false))
        );
      })
    );
  }

  // Utility methods
  clearFamilyData(): void {
    this.currentFamilySubject.next(null);
    this.familiesSubject.next([]);
    this.familyStatsSubject.next(null);
    this.activitiesSubject.next([]);
  }

  refreshCurrentFamily(): Observable<Family | null> {
    const currentFamily = this.currentFamilySignal();
    if (!currentFamily) {
      return new Observable(subscriber => {
        subscriber.next(null);
        subscriber.complete();
      });
    }

    return this.getFamilyById(currentFamily.id);
  }

  // Error handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error) {
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.errors) {
        const firstError = Object.values(error.error.errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError as string;
      }
    } else if (error.status === 0) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.status === 404) {
      errorMessage = 'Family not found.';
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    }

    this.showToast(errorMessage, 'danger');
    return throwError(() => error);
  }

  // UI helper methods
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
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

  async showLoading(message: string = 'Please wait...'): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({
      message,
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  private async showConfirmDialog(
    header: string,
    message: string,
    buttons: string[] = ['Cancel', 'Confirm']
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header,
        message,
        buttons: [
          {
            text: buttons[0],
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: buttons[1],
            role: 'confirm',
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }
}
