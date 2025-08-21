import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { ToastController, LoadingController } from '@ionic/angular';
import { ApiUrlService } from '../api.service';
import {
  Family,
  FamilyMember,
  CreateFamilyRequest,
  UpdateFamilyRequest,
  JoinFamilyRequest,
  UpdateMemberRequest,
  FamilyRoleEnum,
  getFamilyRolePermissions
} from '../../../models/families/family.models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FamilyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);
  private readonly toastController = inject(ToastController);
  private readonly loadingController = inject(LoadingController);

  // State management
  private readonly _families = new BehaviorSubject<Family[]>([]);
  private readonly _currentFamily = new BehaviorSubject<Family | null>(null);
  private readonly _isLoading = signal<boolean>(false);

  // Public observables
  readonly families$ = this._families.asObservable();
  readonly currentFamily$ = this._currentFamily.asObservable();
  readonly isLoading = this._isLoading.asReadonly();

  constructor() {}

  getMyFamilies(): Observable<ApiResponse<Family[]>> {
    this._isLoading.set(true);

    return this.http.get<ApiResponse<Family[]>>(
      this.apiUrlService.getUrl('families/my-families')
    ).pipe(
      tap(response => {
        const families = response.data.map(family => this.normalizeFamilyData(family));
        this._families.next(families);
        this._isLoading.set(false);
      }),
      catchError(error => {
        this._isLoading.set(false);
        return this.handleError(error);
      })
    );
  }

  getFamilyBySlug(slug: string): Observable<ApiResponse<Family>> {
    this._isLoading.set(true);

    return this.http.get<ApiResponse<Family>>(
      this.apiUrlService.getUrl(`families/${slug}`)
    ).pipe(
      tap(response => {
        const family = this.normalizeFamilyData(response.data);
        this._currentFamily.next(family);
        this._isLoading.set(false);
      }),
      catchError(error => {
        this._isLoading.set(false);
        return this.handleError(error);
      })
    );
  }

  createFamily(familyData: CreateFamilyRequest): Observable<ApiResponse<Family>> {
    this._isLoading.set(true);

    return this.http.post<ApiResponse<Family>>(
      this.apiUrlService.getUrl('families'),
      familyData
    ).pipe(
      tap(async response => {
        const family = this.normalizeFamilyData(response.data);

        const currentFamilies = this._families.value;
        this._families.next([...currentFamilies, family]);

        this._currentFamily.next(family);

        this._isLoading.set(false);
        await this.showToast('Family created successfully!', 'success');
      }),
      catchError(error => {
        this._isLoading.set(false);
        return this.handleError(error);
      })
    );
  }

  updateFamily(slug: string, familyData: UpdateFamilyRequest): Observable<ApiResponse<Family>> {
    this._isLoading.set(true);

    return this.http.put<ApiResponse<Family>>(
      this.apiUrlService.getUrl(`families/${slug}`),
      familyData
    ).pipe(
      tap(async response => {
        const family = this.normalizeFamilyData(response.data);

        const currentFamilies = this._families.value;
        const updatedFamilies = currentFamilies.map(f =>
          f.slug === slug ? family : f
        );
        this._families.next(updatedFamilies);

        if (this._currentFamily.value?.slug === slug) {
          this._currentFamily.next(family);
        }

        this._isLoading.set(false);
        await this.showToast('Family updated successfully!', 'success');
      }),
      catchError(error => {
        this._isLoading.set(false);
        return this.handleError(error);
      })
    );
  }

  deleteFamily(slug: string): Observable<ApiResponse<void>> {
    this._isLoading.set(true);

    return this.http.delete<ApiResponse<void>>(
      this.apiUrlService.getUrl(`families/${slug}`)
    ).pipe(
      tap(async () => {
        const currentFamilies = this._families.value;
        const filteredFamilies = currentFamilies.filter(family => family.slug !== slug);
        this._families.next(filteredFamilies);

        if (this._currentFamily.value?.slug === slug) {
          this._currentFamily.next(null);
        }

        this._isLoading.set(false);
        await this.showToast('Family deleted successfully!', 'success');
      }),
      catchError(error => {
        this._isLoading.set(false);
        return this.handleError(error);
      })
    );
  }

  joinFamilyByCode(joinData: JoinFamilyRequest): Observable<ApiResponse<Family>> {
    this._isLoading.set(true);

    return this.http.post<ApiResponse<Family>>(
      this.apiUrlService.getUrl('families/join'),
      joinData
    ).pipe(
      tap(async response => {
        const family = this.normalizeFamilyData(response.data);

        const currentFamilies = this._families.value;
        this._families.next([...currentFamilies, family]);

        this._isLoading.set(false);
        await this.showToast('Successfully joined family!', 'success');
      }),
      catchError(error => {
        this._isLoading.set(false);
        return this.handleError(error);
      })
    );
  }

  leaveFamily(slug: string): Observable<ApiResponse<void>> {
    this._isLoading.set(true);

    return this.http.post<ApiResponse<void>>(
      this.apiUrlService.getUrl(`families/${slug}/leave`),
      {}
    ).pipe(
      tap(async () => {
        const currentFamilies = this._families.value;
        const filteredFamilies = currentFamilies.filter(family => family.slug !== slug);
        this._families.next(filteredFamilies);

        if (this._currentFamily.value?.slug === slug) {
          this._currentFamily.next(null);
        }

        this._isLoading.set(false);
        await this.showToast('Left family successfully!', 'success');
      }),
      catchError(error => {
        this._isLoading.set(false);
        return this.handleError(error);
      })
    );
  }

  generateJoinCode(slug: string): Observable<ApiResponse<{ joinCode: string }>> {
    return this.http.post<ApiResponse<{ joinCode: string }>>(
      this.apiUrlService.getUrl(`families/${slug}/generate-code`),
      {}
    ).pipe(
      tap(async response => {
        const currentFamily = this._currentFamily.value;
        if (currentFamily?.slug === slug) {
          this._currentFamily.next({
            ...currentFamily,
            joinCode: response.data.joinCode
          });
        }

        await this.showToast('New join code generated!', 'success');
      }),
      catchError(error => this.handleError(error))
    );
  }

  inviteFamilyMember(slug: string, email: string, role: FamilyRoleEnum): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      this.apiUrlService.getUrl(`families/${slug}/invite`),
      { email, role }
    ).pipe(
      tap(async () => {
        await this.showToast('Invitation sent successfully!', 'success');
      }),
      catchError(error => this.handleError(error))
    );
  }

  removeFamilyMember(slug: string, memberId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      this.apiUrlService.getUrl(`families/${slug}/members/${memberId}`)
    ).pipe(
      tap(async () => {
        await this.showToast('Member removed successfully!', 'success');
      }),
      catchError(error => this.handleError(error))
    );
  }

  getCurrentFamily(): Family | null {
    return this._currentFamily.value;
  }

  getFamilies(): Family[] {
    return this._families.value;
  }

  hasPermission(family: Family, permission: string): boolean {
    if (!family.currentUserRole) return false;

    const userPermissions = getFamilyRolePermissions(family.currentUserRole);
    return userPermissions.includes('all') || userPermissions.includes(permission);
  }

  canManageFamily(family: Family): boolean {
    if (!family.currentUserRole) return false;
    return family.currentUserRole === FamilyRoleEnum.OWNER ||
      family.currentUserRole === FamilyRoleEnum.MODERATOR;
  }

  canManageMembers(family: Family): boolean {
    return this.hasPermission(family, 'manage_members');
  }

  canInviteMembers(family: Family): boolean {
    return this.canManageMembers(family);
  }

  isOwner(family: Family): boolean {
    return family.currentUserRole === FamilyRoleEnum.OWNER;
  }

  getUserRole(family: Family): FamilyRoleEnum | null {
    return family.currentUserRole || null;
  }

  private normalizeFamilyData(family: any): Family {
    const normalized = {
      ...family,
      currentUserRole: family.currentUserRole ? parseInt(family.currentUserRole) as FamilyRoleEnum : undefined,
      memberCount: family.memberCount || 0
    };
    return normalized;
  }

  // Error handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.status === 404) {
      errorMessage = 'Family not found.';
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 409) {
      errorMessage = 'Join code is invalid or expired.';
    }

    this.showToast(errorMessage, 'danger');
    return throwError(() => error);
  }

  // Toast helper
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

  // Loading helper
  async showLoading(message: string = 'Please wait...'): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({
      message,
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }
}
