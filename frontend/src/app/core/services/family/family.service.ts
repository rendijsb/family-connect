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
  FamilyRoleEnum
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
        this._families.next(response.data);
        this._isLoading.set(false);
      }),
      catchError(error => {
        this._isLoading.set(false);
        return this.handleError(error);
      })
    ).pipe(
      tap(response => response.data)
    );
  }

  // Get family by slug
  getFamilyBySlug(slug: string): Observable<ApiResponse<Family>> {
    this._isLoading.set(true);

    return this.http.get<ApiResponse<Family>>(
      this.apiUrlService.getUrl(`families/${slug}`)
    ).pipe(
      tap(response => {
        this._currentFamily.next(response.data);
        this._isLoading.set(false);
      }),
      catchError(error => {
        this._isLoading.set(false);
        return this.handleError(error);
      })
    ).pipe(
      tap(response => response.data)
    );
  }

  // Create new family
  createFamily(familyData: CreateFamilyRequest): Observable<ApiResponse<Family>> {
    this._isLoading.set(true);

    return this.http.post<ApiResponse<Family>>(
      this.apiUrlService.getUrl('families'),
      familyData
    ).pipe(
      tap(async response => {
        // Add to families list
        const currentFamilies = this._families.value;
        this._families.next([...currentFamilies, response.data]);

        // Set as current family
        this._currentFamily.next(response.data);

        this._isLoading.set(false);
        await this.showToast('Family created successfully!', 'success');
      }),
      catchError(error => {
        this._isLoading.set(false);
        return this.handleError(error);
      })
    ).pipe(
      tap(response => response.data)
    );
  }

  updateFamily(slug: string, familyData: UpdateFamilyRequest): Observable<ApiResponse<Family>> {
    this._isLoading.set(true);

    return this.http.put<ApiResponse<Family>>(
      this.apiUrlService.getUrl(`families/${slug}`),
      familyData
    ).pipe(
      tap(async response => {
        // Update in families list
        const currentFamilies = this._families.value;
        const updatedFamilies = currentFamilies.map(family =>
          family.slug === slug ? response.data : family
        );
        this._families.next(updatedFamilies);

        // Update current family if it matches
        if (this._currentFamily.value?.slug === slug) {
          this._currentFamily.next(response.data);
        }

        this._isLoading.set(false);
        await this.showToast('Family updated successfully!', 'success');
      }),
      catchError(error => {
        this._isLoading.set(false);
        return this.handleError(error);
      })
    ).pipe(
      tap(response => response.data)
    );
  }

  // Delete family
  deleteFamily(slug: string): Observable<ApiResponse<void>> {
    this._isLoading.set(true);

    return this.http.delete<ApiResponse<void>>(
      this.apiUrlService.getUrl(`families/${slug}`)
    ).pipe(
      tap(async () => {
        // Remove from families list
        const currentFamilies = this._families.value;
        const filteredFamilies = currentFamilies.filter(family => family.slug !== slug);
        this._families.next(filteredFamilies);

        // Clear current family if it matches
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

  // Join family by code
  joinFamilyByCode(joinData: JoinFamilyRequest): Observable<ApiResponse<Family>> {
    this._isLoading.set(true);

    return this.http.post<ApiResponse<Family>>(
      this.apiUrlService.getUrl('families/join'),
      joinData
    ).pipe(
      tap(async response => {
        // Add to families list
        const currentFamilies = this._families.value;
        this._families.next([...currentFamilies, response.data]);

        this._isLoading.set(false);
        await this.showToast('Successfully joined family!', 'success');
      }),
      catchError(error => {
        this._isLoading.set(false);
        return this.handleError(error);
      })
    ).pipe(
      tap(response => response.data)
    );
  }

  // Leave family
  leaveFamily(slug: string): Observable<ApiResponse<void>> {
    this._isLoading.set(true);

    return this.http.post<ApiResponse<void>>(
      this.apiUrlService.getUrl(`families/${slug}/leave`),
      {}
    ).pipe(
      tap(async () => {
        // Remove from families list
        const currentFamilies = this._families.value;
        const filteredFamilies = currentFamilies.filter(family => family.slug !== slug);
        this._families.next(filteredFamilies);

        // Clear current family if it matches
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

  // Get family members
  getFamilyMembers(slug: string): Observable<ApiResponse<FamilyMember[]>> {
    return this.http.get<ApiResponse<FamilyMember[]>>(
      this.apiUrlService.getUrl(`families/${slug}/members`)
    ).pipe(
      tap(response => response.data),
      catchError(error => this.handleError(error))
    );
  }

  // Update family member
  updateFamilyMember(
    slug: string,
    memberId: number,
    memberData: UpdateMemberRequest
  ): Observable<ApiResponse<FamilyMember>> {
    return this.http.put<ApiResponse<FamilyMember>>(
      this.apiUrlService.getUrl(`families/${slug}/members/${memberId}`),
      memberData
    ).pipe(
      tap(async response => {
        await this.showToast('Member updated successfully!', 'success');
      }),
      tap(response => response.data),
      catchError(error => this.handleError(error))
    );
  }

  // Remove family member
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

  // Invite family member
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

  // Generate new join code
  generateJoinCode(slug: string): Observable<ApiResponse<{ joinCode: string }>> {
    return this.http.post<ApiResponse<{ joinCode: string }>>(
      this.apiUrlService.getUrl(`families/${slug}/generate-code`),
      {}
    ).pipe(
      tap(async response => {
        // Update current family if it matches
        const currentFamily = this._currentFamily.value;
        if (currentFamily?.slug === slug) {
          this._currentFamily.next({
            ...currentFamily,
            joinCode: response.data.joinCode
          });
        }

        await this.showToast('New join code generated!', 'success');
        return response.data.joinCode;
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Utility methods
  getCurrentFamily(): Family | null {
    return this._currentFamily.value;
  }

  getFamilies(): Family[] {
    return this._families.value;
  }

  hasPermission(family: Family, permission: string): boolean {
    if (!family.currentUserRole) return false;

    const userPermissions = this.getRolePermissions(family.currentUserRole);
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

  private getRolePermissions(role: FamilyRoleEnum): string[] {
    switch (role) {
      case FamilyRoleEnum.OWNER: return ['all'];
      case FamilyRoleEnum.MODERATOR: return ['manage_members', 'manage_events', 'manage_photos', 'manage_chat'];
      case FamilyRoleEnum.MEMBER: return ['view_all', 'create_events', 'upload_photos', 'chat'];
      case FamilyRoleEnum.CHILD: return ['view_limited', 'chat_limited'];
      default: return [];
    }
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
