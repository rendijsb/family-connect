// src/app/core/services/families/family-invitation.service.ts

import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {ApiUrlService} from '../api.service';
import {ToastController} from '@ionic/angular';
import {Family, FamilyInvitation, InviteMemberRequest} from '../../../models/families/family.models';
import {catchError, map, Observable, tap, throwError} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FamilyInvitationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);
  private readonly toastController = inject(ToastController);

  inviteMember(familyId: number, invitationData: InviteMemberRequest): Observable<FamilyInvitation> {
    return this.http.post<{ success: boolean; data: FamilyInvitation }>(
      this.apiUrlService.getUrl(`families/${familyId}/invite`),
      invitationData
    ).pipe(
      map(response => response.data),
      tap(() => this.showToast('Invitation sent successfully', 'success')),
      catchError(error => this.handleError(error, 'Failed to send invitation'))
    );
  }

  getInvitations(familyId: number): Observable<FamilyInvitation[]> {
    return this.http.get<{ success: boolean; data: FamilyInvitation[] }>(
      this.apiUrlService.getUrl(`families/${familyId}/invitations`)
    ).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error, 'Failed to load invitations'))
    );
  }

  getUserInvitations(): Observable<FamilyInvitation[]> {
    return this.http.get<{ success: boolean; data: FamilyInvitation[] }>(
      this.apiUrlService.getUrl('user/invitations')
    ).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error, 'Failed to load your invitations'))
    );
  }

  acceptInvitation(token: string): Observable<Family> {
    return this.http.post<{ success: boolean; data: Family }>(
      this.apiUrlService.getUrl(`invitations/${token}/accept`),
      {}
    ).pipe(
      map(response => response.data),
      tap(() => this.showToast('Invitation accepted successfully', 'success')),
      catchError(error => this.handleError(error, 'Failed to accept invitation'))
    );
  }

  declineInvitation(token: string): Observable<void> {
    return this.http.post<{ success: boolean; message: string }>(
      this.apiUrlService.getUrl(`invitations/${token}/decline`),
      {}
    ).pipe(
      tap(() => this.showToast('Invitation declined', 'success')),
      map(() => void 0),
      catchError(error => this.handleError(error, 'Failed to decline invitation'))
    );
  }

  cancelInvitation(invitationId: number): Observable<void> {
    return this.http.delete<{ success: boolean; message: string }>(
      this.apiUrlService.getUrl(`invitations/${invitationId}`)
    ).pipe(
      tap(() => this.showToast('Invitation cancelled', 'success')),
      map(() => void 0),
      catchError(error => this.handleError(error, 'Failed to cancel invitation'))
    );
  }

  resendInvitation(invitationId: number): Observable<FamilyInvitation> {
    return this.http.post<{ success: boolean; data: FamilyInvitation }>(
      this.apiUrlService.getUrl(`invitations/${invitationId}/resend`),
      {}
    ).pipe(
      map(response => response.data),
      tap(() => this.showToast('Invitation resent successfully', 'success')),
      catchError(error => this.handleError(error, 'Failed to resend invitation'))
    );
  }

  getInvitationByToken(token: string): Observable<FamilyInvitation> {
    return this.http.get<{ success: boolean; data: FamilyInvitation }>(
      this.apiUrlService.getUrl(`invitations/${token}`)
    ).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error, 'Failed to load invitation details'))
    );
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): Observable<never> {
    const errorMessage = error.error?.message || defaultMessage;
    this.showToast(errorMessage, 'danger');
    return throwError(() => error);
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
