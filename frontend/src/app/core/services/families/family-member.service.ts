// src/app/core/services/families/family-member.service.ts

import {catchError, map, Observable, tap, throwError} from 'rxjs';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {FamilyMember, MemberPreferences, UpdateMemberRoleRequest} from '../../../models/families/family.models';
import {ApiUrlService} from '../api.service';
import {ToastController} from '@ionic/angular';
import {inject, Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FamilyMemberService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);
  private readonly toastController = inject(ToastController);

  getMembers(familyId: number): Observable<FamilyMember[]> {
    return this.http.get<{ success: boolean; data: FamilyMember[] }>(
      this.apiUrlService.getUrl(`families/${familyId}/members`)
    ).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error, 'Failed to load family members'))
    );
  }

  updateMemberRole(familyId: number, userId: number, roleData: UpdateMemberRoleRequest): Observable<FamilyMember> {
    return this.http.post<{ success: boolean; data: FamilyMember }>(
      this.apiUrlService.getUrl(`families/${familyId}/members/${userId}/role`),
      roleData
    ).pipe(
      map(response => response.data),
      tap(() => this.showToast('Member role updated successfully', 'success')),
      catchError(error => this.handleError(error, 'Failed to update member role'))
    );
  }

  removeMember(familyId: number, userId: number): Observable<void> {
    return this.http.delete<{ success: boolean; message: string }>(
      this.apiUrlService.getUrl(`families/${familyId}/members/${userId}`)
    ).pipe(
      tap(() => this.showToast('Member removed successfully', 'success')),
      map(() => void 0),
      catchError(error => this.handleError(error, 'Failed to remove member'))
    );
  }

  updateMemberPreferences(familyId: number, preferences: Partial<MemberPreferences>): Observable<FamilyMember> {
    return this.http.put<{ success: boolean; data: FamilyMember }>(
      this.apiUrlService.getUrl(`families/${familyId}/preferences`),
      preferences
    ).pipe(
      map(response => response.data),
      tap(() => this.showToast('Preferences updated successfully', 'success')),
      catchError(error => this.handleError(error, 'Failed to update preferences'))
    );
  }

  blockMember(familyId: number, userId: number): Observable<FamilyMember> {
    return this.http.post<{ success: boolean; data: FamilyMember }>(
      this.apiUrlService.getUrl(`families/${familyId}/members/${userId}/block`),
      {}
    ).pipe(
      map(response => response.data),
      tap(() => this.showToast('Member blocked successfully', 'success')),
      catchError(error => this.handleError(error, 'Failed to block member'))
    );
  }

  unblockMember(familyId: number, userId: number): Observable<FamilyMember> {
    return this.http.post<{ success: boolean; data: FamilyMember }>(
      this.apiUrlService.getUrl(`families/${familyId}/members/${userId}/unblock`),
      {}
    ).pipe(
      map(response => response.data),
      tap(() => this.showToast('Member unblocked successfully', 'success')),
      catchError(error => this.handleError(error, 'Failed to unblock member'))
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
