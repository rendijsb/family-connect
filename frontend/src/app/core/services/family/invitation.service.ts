import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, tap, catchError, map } from 'rxjs';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { ApiUrlService } from '../api.service';
import {
  FamilyInvitation,
  InvitationResponse,
  InvitationListResponse,
  InviteMemberRequest,
  JoinFamilyRequest,
  InvitationStatusEnum,
  FamilyRoleEnum
} from '../../../models/families/family.models';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);
  private readonly toastController = inject(ToastController);
  private readonly loadingController = inject(LoadingController);
  private readonly alertController = inject(AlertController);

  // State management
  private familyInvitationsSubject = new BehaviorSubject<FamilyInvitation[]>([]);
  private userInvitationsSubject = new BehaviorSubject<FamilyInvitation[]>([]);

  // Public observables
  readonly familyInvitations$ = this.familyInvitationsSubject.asObservable();
  readonly userInvitations$ = this.userInvitationsSubject.asObservable();

  // Signals for reactive state
  private familyInvitationsSignal = signal<FamilyInvitation[]>([]);
  private userInvitationsSignal = signal<FamilyInvitation[]>([]);
  private isLoadingSignal = signal<boolean>(false);

  // Computed signals
  readonly familyInvitations = this.familyInvitationsSignal.asReadonly();
  readonly userInvitations = this.userInvitationsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  constructor() {
    // Subscribe to state changes and update signals
    this.familyInvitations$.subscribe(invitations => {
      this.familyInvitationsSignal.set(invitations);
    });

    this.userInvitations$.subscribe(invitations => {
      this.userInvitationsSignal.set(invitations);
    });
  }

  // Invitation creation
  inviteMember(familyId: number, inviteData: InviteMemberRequest): Observable<FamilyInvitation> {
    this.isLoadingSignal.set(true);

    return this.http.post<InvitationResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/invitations`),
      inviteData
    ).pipe(
      map(response => response.data),
      map(invitation => this.processInvitation(invitation)),
      tap(async (invitation) => {
        // Add to family invitations list
        const currentInvitations = this.familyInvitationsSignal();
        this.familyInvitationsSubject.next([invitation, ...currentInvitations]);

        await this.showToast(`Invitation sent to ${inviteData.email}!`, 'success');
      }),
      catchError(error => this.handleError(error)),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  // Invitation retrieval
  getFamilyInvitations(familyId: number, status?: InvitationStatusEnum): Observable<FamilyInvitation[]> {
    const params: any = {};
    if (status) {
      params.status = status;
    }

    return this.http.get<InvitationListResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/invitations`),
      { params }
    ).pipe(
      map(response => response.data),
      map(invitations => invitations.map(inv => this.processInvitation(inv))),
      tap(invitations => {
        this.familyInvitationsSubject.next(invitations);
      }),
      catchError(error => this.handleError(error))
    );
  }

  getUserInvitations(status?: InvitationStatusEnum): Observable<FamilyInvitation[]> {
    const params: any = {};
    if (status) {
      params.status = status;
    }

    return this.http.get<InvitationListResponse>(
      this.apiUrlService.getUrl('user/invitations'),
      { params }
    ).pipe(
      map(response => response.data),
      map(invitations => invitations.map(inv => this.processInvitation(inv))),
      tap(invitations => {
        this.userInvitationsSubject.next(invitations);
      }),
      catchError(error => this.handleError(error))
    );
  }

  getInvitationByToken(token: string): Observable<FamilyInvitation> {
    return this.http.get<InvitationResponse>(
      this.apiUrlService.getUrl(`invitations/${token}`)
    ).pipe(
      map(response => response.data),
      map(invitation => this.processInvitation(invitation)),
      catchError(error => this.handleError(error))
    );
  }

  // Invitation actions
  acceptInvitation(invitationId: number, nickname?: string): Observable<FamilyInvitation> {
    this.isLoadingSignal.set(true);

    const payload: any = { status: InvitationStatusEnum.ACCEPTED };
    if (nickname) {
      payload.nickname = nickname;
    }

    return this.http.put<InvitationResponse>(
      this.apiUrlService.getUrl(`invitations/${invitationId}/accept`),
      payload
    ).pipe(
      map(response => response.data),
      map(invitation => this.processInvitation(invitation)),
      tap(async (invitation) => {
        // Update user invitations list
        this.updateInvitationInList(invitation, 'user');
        await this.showToast('Invitation accepted! Welcome to the family!', 'success');
      }),
      catchError(error => this.handleError(error)),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  async declineInvitation(invitationId: number): Promise<Observable<FamilyInvitation>> {
    return await this.showConfirmDialog(
      'Decline Invitation',
      'Are you sure you want to decline this family invitation?',
      ['Cancel', 'Decline']
    ).then(async (confirmed) => {
      if (!confirmed) {
        return throwError(() => new Error('User cancelled'));
      }

      this.isLoadingSignal.set(true);

      return this.http.put<InvitationResponse>(
        this.apiUrlService.getUrl(`invitations/${invitationId}/decline`),
        {status: InvitationStatusEnum.DECLINED}
      ).pipe(
        map(response => response.data),
        map(invitation => this.processInvitation(invitation)),
        tap(async (invitation) => {
          this.updateInvitationInList(invitation, 'user');
          await this.showToast('Invitation declined', 'warning');
        }),
        catchError(error => this.handleError(error)),
        tap(() => this.isLoadingSignal.set(false))
      ).toPromise() as Promise<FamilyInvitation>;
    }).then(() => {
      // Return the result through observable
      return new Observable<FamilyInvitation>(subscriber => {
        // This will be handled by the promise above
        subscriber.next({} as FamilyInvitation);
        subscriber.complete();
      });
    });
  }

  resendInvitation(invitationId: number): Observable<FamilyInvitation> {
    this.isLoadingSignal.set(true);

    return this.http.post<InvitationResponse>(
      this.apiUrlService.getUrl(`invitations/${invitationId}/resend`),
      {}
    ).pipe(
      map(response => response.data),
      map(invitation => this.processInvitation(invitation)),
      tap(async (invitation) => {
        this.updateInvitationInList(invitation, 'family');
        await this.showToast('Invitation resent successfully!', 'success');
      }),
      catchError(error => this.handleError(error)),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  async cancelInvitation(invitationId: number): Promise<Observable<void>> {
    return await this.showConfirmDialog(
      'Cancel Invitation',
      'Are you sure you want to cancel this invitation?',
      ['No', 'Yes, Cancel']
    ).then(async (confirmed) => {
      if (!confirmed) {
        return throwError(() => new Error('User cancelled'));
      }

      this.isLoadingSignal.set(true);

      return this.http.delete<{ success: boolean; message: string }>(
        this.apiUrlService.getUrl(`invitations/${invitationId}`)
      ).pipe(
        tap(async () => {
          // Remove from family invitations list
          const currentInvitations = this.familyInvitationsSignal();
          const updatedInvitations = currentInvitations.filter(inv => inv.id !== invitationId);
          this.familyInvitationsSubject.next(updatedInvitations);

          await this.showToast('Invitation cancelled', 'success');
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

  // Batch operations
  inviteMultipleMembers(familyId: number, invites: InviteMemberRequest[]): Observable<FamilyInvitation[]> {
    this.isLoadingSignal.set(true);

    return this.http.post<InvitationListResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/invitations/batch`),
      { invitations: invites }
    ).pipe(
      map(response => response.data),
      map(invitations => invitations.map(inv => this.processInvitation(inv))),
      tap(async (invitations) => {
        // Add to family invitations list
        const currentInvitations = this.familyInvitationsSignal();
        this.familyInvitationsSubject.next([...invitations, ...currentInvitations]);

        await this.showToast(`${invitations.length} invitations sent successfully!`, 'success');
      }),
      catchError(error => this.handleError(error)),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  // Join family by token
  joinFamilyByToken(joinData: JoinFamilyRequest): Observable<FamilyInvitation> {
    this.isLoadingSignal.set(true);

    return this.http.post<InvitationResponse>(
      this.apiUrlService.getUrl('family/join'),
      joinData
    ).pipe(
      map(response => response.data),
      map(invitation => this.processInvitation(invitation)),
      tap(async (invitation) => {
        await this.showToast('Successfully joined the family!', 'success');
      }),
      catchError(error => this.handleError(error)),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  // Invitation filtering and utilities
  filterInvitationsByStatus(invitations: FamilyInvitation[], status: InvitationStatusEnum): FamilyInvitation[] {
    return invitations.filter(inv => inv.status === status);
  }

  getPendingInvitations(type: 'family' | 'user' = 'user'): FamilyInvitation[] {
    const invitations = type === 'family' ? this.familyInvitationsSignal() : this.userInvitationsSignal();
    return invitations.filter(inv => inv.status === InvitationStatusEnum.PENDING && !inv.isExpired);
  }

  getExpiredInvitations(type: 'family' | 'user' = 'family'): FamilyInvitation[] {
    const invitations = type === 'family' ? this.familyInvitationsSignal() : this.userInvitationsSignal();
    return invitations.filter(inv => inv.isExpired);
  }

  // Invitation validation
  canResendInvitation(invitation: FamilyInvitation): boolean {
    return invitation.status === InvitationStatusEnum.PENDING || invitation.isExpired;
  }

  canCancelInvitation(invitation: FamilyInvitation): boolean {
    return invitation.status === InvitationStatusEnum.PENDING;
  }

  // Utility methods
  private processInvitation(invitation: FamilyInvitation): FamilyInvitation {
    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);

    return {
      ...invitation,
      isExpired: now > expiresAt,
      isPending: invitation.status === InvitationStatusEnum.PENDING,
      canResend: invitation.status === InvitationStatusEnum.PENDING || now > expiresAt
    };
  }

  private updateInvitationInList(updatedInvitation: FamilyInvitation, listType: 'family' | 'user'): void {
    if (listType === 'family') {
      const currentInvitations = this.familyInvitationsSignal();
      const updatedInvitations = currentInvitations.map(inv =>
        inv.id === updatedInvitation.id ? updatedInvitation : inv
      );
      this.familyInvitationsSubject.next(updatedInvitations);
    } else {
      const currentInvitations = this.userInvitationsSignal();
      const updatedInvitations = currentInvitations.map(inv =>
        inv.id === updatedInvitation.id ? updatedInvitation : inv
      );
      this.userInvitationsSubject.next(updatedInvitations);
    }
  }

  getInvitationStatusDisplay(status: InvitationStatusEnum): string {
    switch (status) {
      case InvitationStatusEnum.PENDING: return 'Pending';
      case InvitationStatusEnum.ACCEPTED: return 'Accepted';
      case InvitationStatusEnum.DECLINED: return 'Declined';
      case InvitationStatusEnum.EXPIRED: return 'Expired';
      default: return 'Unknown';
    }
  }

  getInvitationStatusColor(status: InvitationStatusEnum): string {
    switch (status) {
      case InvitationStatusEnum.PENDING: return '#f59e0b';
      case InvitationStatusEnum.ACCEPTED: return '#22c55e';
      case InvitationStatusEnum.DECLINED: return '#ef4444';
      case InvitationStatusEnum.EXPIRED: return '#6b7280';
      default: return '#6b7280';
    }
  }

  getRoleDisplayName(role: FamilyRoleEnum): string {
    switch (role) {
      case FamilyRoleEnum.OWNER: return 'Owner';
      case FamilyRoleEnum.ADMIN: return 'Admin';
      case FamilyRoleEnum.MEMBER: return 'Member';
      default: return 'Member';
    }
  }

  formatTimeRemaining(expiresAt: string): string {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} remaining`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} remaining`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} remaining`;
    }
  }

  // Clear data
  clearInvitationData(): void {
    this.familyInvitationsSubject.next([]);
    this.userInvitationsSubject.next([]);
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
      errorMessage = 'Invitation not found or has expired.';
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 409) {
      errorMessage = 'This email has already been invited or is already a member.';
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

  getInvitationById(invitationId: number): Observable<FamilyInvitation> {
    return this.http.get<InvitationResponse>(
      this.apiUrlService.getUrl(`invitations/${invitationId}`)
    ).pipe(
      map(response => response.data),
      map(invitation => this.processInvitation(invitation)),
      catchError(error => this.handleError(error))
    );
  }
}
