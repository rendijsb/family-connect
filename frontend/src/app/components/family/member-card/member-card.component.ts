import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard, IonCardContent, IonButton, IonIcon, IonChip,
  IonLabel, IonAvatar, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubbleOutline, callOutline, videocamOutline,
  ellipsisVerticalOutline, shieldCheckmarkOutline,
  cropOutline, personOutline, radioButtonOnOutline
} from 'ionicons/icons';
import { FamilyMember, FamilyRoleEnum } from '../../../models/families/family.models';

@Component({
  selector: 'app-member-card',
  templateUrl: './member-card.component.html',
  styleUrls: ['./member-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard, IonCardContent, IonButton, IonIcon, IonChip,
    IonLabel, IonAvatar, IonBadge
  ]
})
export class MemberCardComponent {
  @Input() member!: FamilyMember;
  @Input() showActions = true;
  @Input() compact = false;
  @Input() canManage = false;

  @Output() memberClicked = new EventEmitter<FamilyMember>();
  @Output() chatClicked = new EventEmitter<FamilyMember>();
  @Output() callClicked = new EventEmitter<FamilyMember>();
  @Output() videoCallClicked = new EventEmitter<FamilyMember>();
  @Output() manageClicked = new EventEmitter<FamilyMember>();

  constructor() {
    addIcons({
      chatbubbleOutline, callOutline, videocamOutline,
      ellipsisVerticalOutline, shieldCheckmarkOutline,
      cropOutline, personOutline, radioButtonOnOutline
    });
  }

  onMemberClick() {
    this.memberClicked.emit(this.member);
  }

  onChatClick(event: Event) {
    event.stopPropagation();
    this.chatClicked.emit(this.member);
  }

  onCallClick(event: Event) {
    event.stopPropagation();
    this.callClicked.emit(this.member);
  }

  onVideoCallClick(event: Event) {
    event.stopPropagation();
    this.videoCallClicked.emit(this.member);
  }

  onManageClick(event: Event) {
    event.stopPropagation();
    this.manageClicked.emit(this.member);
  }

  getRoleIcon(): string {
    switch (this.member.role) {
      case FamilyRoleEnum.OWNER: return 'crown-outline';
      case FamilyRoleEnum.ADMIN: return 'shield-checkmark-outline';
      case FamilyRoleEnum.MEMBER: return 'person-outline';
      default: return 'person-outline';
    }
  }

  getRoleColor(): string {
    switch (this.member.role) {
      case FamilyRoleEnum.OWNER: return '#dc2626';
      case FamilyRoleEnum.ADMIN: return '#3b82f6';
      case FamilyRoleEnum.MEMBER: return '#22c55e';
      default: return '#6b7280';
    }
  }

  getStatusColor(): string {
    return this.member.isOnline ? '#22c55e' : '#6b7280';
  }

  formatLastSeen(): string {
    if (this.member.isOnline) return 'Online now';
    if (!this.member.lastActiveAt) return 'Never';

    const lastActive = new Date(this.member.lastActiveAt);
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return lastActive.toLocaleDateString();
  }
}
