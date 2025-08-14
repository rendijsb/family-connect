
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, tap, catchError, map } from 'rxjs';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { ApiUrlService } from '../api.service';
import {
  FamilyMember,
  FamilyMemberResponse,
  FamilyMemberListResponse,
  UpdateMemberRequest,
  FamilyRoleEnum,
  FamilyMemberPermissions,
  DEFAULT_MEMBER_PERMISSIONS,
  ADMIN_MEMBER_PERMISSIONS
} from '../../../models/families/family.models';

@Injectable({
  providedIn: 'root'
})
export class FamilyMemberService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);
  private readonly toastController = inject(ToastController);
  private readonly loadingController = inject(LoadingController);
  private readonly alertController = inject(AlertController);

  // State management
  private familyMembersSubject = new BehaviorSubject<FamilyMember[]>([]);
  private currentMemberSubject = new BehaviorSubject<FamilyMember | null>(null);

  // Public observables
  readonly familyMembers$ = this.familyMembersSubject.asObservable();
  readonly currentMember$ = this.currentMemberSubject.asObservable();

  // Signals for reactive state
  private familyMembersSignal = signal<FamilyMember[]>([]);
  private isLoadingSignal = signal<boolean>(false);

  // Computed signals
  readonly familyMembers = this.familyMembersSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  constructor() {
    // Subscribe to state changes and update signals
    this.familyMembers$.subscribe(members => {
      this.familyMembersSignal.set(members);
    });
  }

  // Member retrieval
  getFamilyMembers(familyId: number): Observable<FamilyMember[]> {
    return this.http.get<FamilyMemberListResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/members`)
    ).pipe(
      map(response => response.data),
      tap(members => {
        // Process members to add computed properties
        const processedMembers = members.map(member => this.processMember(member));
        this.familyMembersSubject.next(processedMembers);
      }),
      catchError(error => this.handleError(error))
    );
  }

  getMemberById(familyId: number, memberId: number): Observable<FamilyMember> {
    return this.http.get<FamilyMemberResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/members/${memberId}`)
    ).pipe(
      map(response => response.data),
      map(member => this.processMember(member)),
      tap(member => {
        this.currentMemberSubject.next(member);
      }),
      catchError(error => this.handleError(error))
    );
  }

  getCurrentUserMembership(familyId: number): Observable<FamilyMember> {
    return this.http.get<FamilyMemberResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/my-membership`)
    ).pipe(
      map(response => response.data),
      map(member => this.processMember(member)),
      tap(member => {
        this.currentMemberSubject.next(member);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Member management
  updateMember(familyId: number, memberId: number, updateData: UpdateMemberRequest): Observable<FamilyMember> {
    this.isLoadingSignal.set(true);

    return this.http.put<FamilyMemberResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/members/${memberId}`),
      updateData
    ).pipe(
      map(response => response.data),
      map(member => this.processMember(member)),
      tap(async (updatedMember) => {
        // Update member in the list
        const currentMembers = this.familyMembersSignal();
        const updatedMembers = currentMembers.map(member =>
          member.id === updatedMember.id ? updatedMember : member
        );
        this.familyMembersSubject.next(updatedMembers);

        // Update current member if it's the same
        if (this.currentMemberSubject.value?.id === updatedMember.id) {
          this.currentMemberSubject.next(updatedMember);
        }

        await this.showToast('Member updated successfully!', 'success');
      }),
      catchError(error => this.handleError(error)),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  updateMemberRole(familyId: number, memberId: number, newRole: FamilyRoleEnum): Observable<FamilyMember> {
    const permissions = this.getRolePermissions(newRole);
    return this.updateMember(familyId, memberId, { role: newRole, permissions });
  }

  updateMemberNickname(familyId: number, memberId: number, nickname: string): Observable<FamilyMember> {
    return this.updateMember(familyId, memberId, { nickname });
  }

  async removeMember(familyId: number, memberId: number): Promise<Observable<void>> {
    const member = this.familyMembersSignal().find(m => m.id === memberId);
    const memberName = member?.displayName || 'this member';

    return await this.showConfirmDialog(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the family?`,
      ['Cancel', 'Remove']
    ).then(async (confirmed) => {
      if (!confirmed) {
        return throwError(() => new Error('User cancelled'));
      }

      this.isLoadingSignal.set(true);

      return this.http.delete<{ success: boolean; message: string }>(
        this.apiUrlService.getUrl(`families/${familyId}/members/${memberId}`)
      ).pipe(
        tap(async () => {
          // Remove member from list
          const currentMembers = this.familyMembersSignal();
          const updatedMembers = currentMembers.filter(m => m.id !== memberId);
          this.familyMembersSubject.next(updatedMembers);

          await this.showToast('Member removed successfully', 'success');
        }),
        map(() => void 0),
        catchError(error => this.handleError(error)),
        tap(() => this.isLoadingSignal.set(false))
      ).toPromise() as Promise<void>;
    }).then(() => {
      return new Observable<void>(subscriber => {
        subscriber.next();
        subscriber.complete();
      });
    });
  }

  // Member status and activity
  getOnlineMembers(familyId: number): Observable<FamilyMember[]> {
    return this.http.get<FamilyMemberListResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/members/online`)
    ).pipe(
      map(response => response.data),
      map(members => members.map(member => this.processMember(member))),
      catchError(error => this.handleError(error))
    );
  }

  updateMemberActivity(familyId: number): Observable<void> {
    return this.http.post<{ success: boolean }>(
      this.apiUrlService.getUrl(`families/${familyId}/members/activity`),
      {}
    ).pipe(
      map(() => void 0),
      catchError(error => this.handleError(error))
    );
  }

  // Member search and filtering
  searchMembers(familyId: number, query: string): Observable<FamilyMember[]> {
    const params = { q: query };

    return this.http.get<FamilyMemberListResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/members/search`),
      { params }
    ).pipe(
      map(response => response.data),
      map(members => members.map(member => this.processMember(member))),
      catchError(error => this.handleError(error))
    );
  }

  filterMembersByRole(role: FamilyRoleEnum): FamilyMember[] {
    return this.familyMembersSignal().filter(member => member.role === role);
  }

  filterOnlineMembers(): FamilyMember[] {
    return this.familyMembersSignal().filter(member => member.isOnline);
  }

  // Member permissions and roles
  canUserManageMember(currentUserMember: FamilyMember, targetMember: FamilyMember): boolean {
    // Owner can manage everyone except themselves for removal
    if (currentUserMember.role === FamilyRoleEnum.OWNER) {
      return true;
    }

    // Admin can manage members but not owners or other admins
    if (currentUserMember.role === FamilyRoleEnum.ADMIN) {
      return targetMember.role === FamilyRoleEnum.MEMBER;
    }

    // Members can only manage themselves (nickname, etc.)
    return currentUserMember.userId === targetMember.userId;
  }

  canUserRemoveMember(currentUserMember: FamilyMember, targetMember: FamilyMember): boolean {
    // Owners can remove anyone except themselves
    if (currentUserMember.role === FamilyRoleEnum.OWNER) {
      return currentUserMember.userId !== targetMember.userId;
    }

    // Admins can remove members but not owners or other admins
    if (currentUserMember.role === FamilyRoleEnum.ADMIN) {
      return targetMember.role === FamilyRoleEnum.MEMBER;
    }

    // Members can't remove anyone
    return false;
  }

  canUserChangeRole(currentUserMember: FamilyMember, targetMember: FamilyMember): boolean {
    // Only owners can change roles
    if (currentUserMember.role === FamilyRoleEnum.OWNER) {
      // Owner can't change their own role
      return currentUserMember.userId !== targetMember.userId;
    }

    return false;
  }

  getRolePermissions(role: FamilyRoleEnum): FamilyMemberPermissions {
    switch (role) {
      case FamilyRoleEnum.OWNER:
        return { ...ADMIN_MEMBER_PERMISSIONS };
      case FamilyRoleEnum.ADMIN:
        return { ...ADMIN_MEMBER_PERMISSIONS };
      case FamilyRoleEnum.MEMBER:
      default:
        return { ...DEFAULT_MEMBER_PERMISSIONS };
    }
  }

  // Utility methods
  private processMember(member: FamilyMember): FamilyMember {
    return {
      ...member,
      displayName: member.nickname || member.user.name,
      isOnline: this.calculateOnlineStatus(member.lastActiveAt),
      canEdit: true, // This would be calculated based on current user permissions
      canRemove: true // This would be calculated based on current user permissions
    };
  }

  private calculateOnlineStatus(lastActiveAt?: string): boolean {
    if (!lastActiveAt) return false;

    const lastActive = new Date(lastActiveAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);

    // Consider user online if active within last 5 minutes
    return diffMinutes <= 5;
  }

  getRoleDisplayName(role: FamilyRoleEnum): string {
    switch (role) {
      case FamilyRoleEnum.OWNER: return 'Owner';
      case FamilyRoleEnum.ADMIN: return 'Admin';
      case FamilyRoleEnum.MEMBER: return 'Member';
      default: return 'Member';
    }
  }

  getRoleColor(role: FamilyRoleEnum): string {
    switch (role) {
      case FamilyRoleEnum.OWNER: return '#dc2626';
      case FamilyRoleEnum.ADMIN: return '#3b82f6';
      case FamilyRoleEnum.MEMBER: return '#22c55e';
      default: return '#6b7280';
    }
  }

  getStatusColor(isOnline: boolean): string {
    return isOnline ? '#22c55e' : '#6b7280';
  }

  formatLastSeen(lastActiveAt?: string): string {
    if (!lastActiveAt) return 'Never';

    const lastActive = new Date(lastActiveAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${Math.floor(diffMinutes)} minutes ago`;

    const diffHours = diffMinutes / 60;
    if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;

    const diffDays = diffHours / 24;
    if (diffDays < 7) return `${Math.floor(diffDays)} days ago`;

    return lastActive.toLocaleDateString();
  }

  // Clear data
  clearMemberData(): void {
    this.familyMembersSubject.next([]);
    this.currentMemberSubject.next(null);
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
      errorMessage = 'Member not found.';
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
