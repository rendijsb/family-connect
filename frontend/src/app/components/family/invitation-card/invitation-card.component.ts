import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonIcon, IonChip, IonLabel, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline, timeOutline, checkmarkCircleOutline,
  closeCircleOutline, refreshOutline, trashOutline,
  warningOutline, personOutline
} from 'ionicons/icons';
import {
  FamilyInvitation,
  InvitationStatusEnum,
  FamilyRoleEnum
} from '../../../models/families/family.models';

@Component({
  selector: 'app-invitation-card',
  templateUrl: './invitation-card.component.html',
  styleUrls: ['./invitation-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonButton, IonIcon, IonChip, IonLabel, IonBadge
  ]
})
export class InvitationCardComponent {
  @Input() invitation!: FamilyInvitation;
  @Input() showActions = true;
  @Input() compact = false;
  @Input() viewType: 'sent' | 'received' = 'sent';

  @Output() invitationClicked = new EventEmitter<FamilyInvitation>();
  @Output() acceptClicked = new EventEmitter<FamilyInvitation>();
  @Output() declineClicked = new EventEmitter<FamilyInvitation>();
  @Output() resendClicked = new EventEmitter<FamilyInvitation>();
  @Output() cancelClicked = new EventEmitter<FamilyInvitation>();

  readonly InvitationStatusEnum = InvitationStatusEnum;

  constructor() {
    addIcons({
      mailOutline, timeOutline, checkmarkCircleOutline,
      closeCircleOutline, refreshOutline, trashOutline,
      warningOutline, personOutline
    });
  }

  onInvitationClick() {
    this.invitationClicked.emit(this.invitation);
  }

  onAcceptClick(event: Event) {
    event.stopPropagation();
    this.acceptClicked.emit(this.invitation);
  }

  onDeclineClick(event: Event) {
    event.stopPropagation();
    this.declineClicked.emit(this.invitation);
  }

  onResendClick(event: Event) {
    event.stopPropagation();
    this.resendClicked.emit(this.invitation);
  }

  onCancelClick(event: Event) {
    event.stopPropagation();
    this.cancelClicked.emit(this.invitation);
  }

  getStatusIcon(): string {
    switch (this.invitation.status) {
      case InvitationStatusEnum.PENDING: return 'time-outline';
      case InvitationStatusEnum.ACCEPTED: return 'checkmark-circle-outline';
      case InvitationStatusEnum.DECLINED: return 'close-circle-outline';
      case InvitationStatusEnum.EXPIRED: return 'warning-outline';
      default: return 'mail-outline';
    }
  }

  getStatusColor(): string {
    if (this.invitation.isExpired) return '#6b7280';

    switch (this.invitation.status) {
      case InvitationStatusEnum.PENDING: return '#f59e0b';
      case InvitationStatusEnum.ACCEPTED: return '#22c55e';
      case InvitationStatusEnum.DECLINED: return '#ef4444';
      case InvitationStatusEnum.EXPIRED: return '#6b7280';
      default: return '#6b7280';
    }
  }

  getStatusText(): string {
    if (this.invitation.isExpired) return 'Expired';

    switch (this.invitation.status) {
      case InvitationStatusEnum.PENDING: return 'Pending';
      case InvitationStatusEnum.ACCEPTED: return 'Accepted';
      case InvitationStatusEnum.DECLINED: return 'Declined';
      case InvitationStatusEnum.EXPIRED: return 'Expired';
      default: return 'Unknown';
    }
  }

  getRoleColor(): string {
    switch (this.invitation.role) {
      case FamilyRoleEnum.OWNER: return '#dc2626';
      case FamilyRoleEnum.ADMIN: return '#3b82f6';
      case FamilyRoleEnum.MEMBER: return '#22c55e';
      default: return '#6b7280';
    }
  }

  formatTimeRemaining(): string {
    if (this.invitation.isExpired) return 'Expired';

    const now = new Date();
    const expires = new Date(this.invitation.expiresAt);
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays}d remaining`;
    } else if (diffHours > 0) {
      return `${diffHours}h remaining`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes}m remaining`;
    }
  }

  canAccept(): boolean {
    return this.viewType === 'received' &&
      this.invitation.status === InvitationStatusEnum.PENDING &&
      !this.invitation.isExpired;
  }

  canDecline(): boolean {
    return this.viewType === 'received' &&
      this.invitation.status === InvitationStatusEnum.PENDING &&
      !this.invitation.isExpired;
  }

  canResend(): boolean {
    return this.viewType === 'sent' &&
      (this.invitation.status === InvitationStatusEnum.PENDING || this.invitation.isExpired);
  }

  canCancel(): boolean {
    return this.viewType === 'sent' &&
      this.invitation.status === InvitationStatusEnum.PENDING &&
      !this.invitation.isExpired;
  }
}
