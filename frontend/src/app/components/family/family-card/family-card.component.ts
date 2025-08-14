import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonIcon, IonChip, IonLabel, IonAvatar, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline, settingsOutline, lockClosedOutline,
  globeOutline, keyOutline, chevronForwardOutline,
  radioButtonOnOutline, timeOutline
} from 'ionicons/icons';
import { Family, FamilyPrivacyLevelEnum } from '../../../models/families/family.models';

@Component({
  selector: 'app-family-card',
  templateUrl: './family-card.component.html',
  styleUrls: ['./family-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonButton, IonIcon, IonChip, IonLabel, IonAvatar, IonBadge
  ]
})
export class FamilyCardComponent {
  @Input() family!: Family;
  @Input() isSelected = false;
  @Input() showActions = true;
  @Input() showStats = true;
  @Input() compact = false;

  @Output() familySelected = new EventEmitter<Family>();
  @Output() settingsClicked = new EventEmitter<Family>();
  @Output() membersClicked = new EventEmitter<Family>();

  constructor() {
    addIcons({
      peopleOutline, settingsOutline, lockClosedOutline,
      globeOutline, keyOutline, chevronForwardOutline,
      radioButtonOnOutline, timeOutline
    });
  }

  onFamilyClick() {
    this.familySelected.emit(this.family);
  }

  onSettingsClick(event: Event) {
    event.stopPropagation();
    this.settingsClicked.emit(this.family);
  }

  onMembersClick(event: Event) {
    event.stopPropagation();
    this.membersClicked.emit(this.family);
  }

  getPrivacyIcon(): string {
    switch (this.family.privacyLevel) {
      case FamilyPrivacyLevelEnum.PUBLIC: return 'globe-outline';
      case FamilyPrivacyLevelEnum.PRIVATE: return 'lock-closed-outline';
      case FamilyPrivacyLevelEnum.INVITE_ONLY: return 'key-outline';
      default: return 'lock-closed-outline';
    }
  }

  getPrivacyColor(): string {
    switch (this.family.privacyLevel) {
      case FamilyPrivacyLevelEnum.PUBLIC: return '#22c55e';
      case FamilyPrivacyLevelEnum.PRIVATE: return '#f59e0b';
      case FamilyPrivacyLevelEnum.INVITE_ONLY: return '#dc2626';
      default: return '#6b7280';
    }
  }

  formatLastActivity(): string {
    return '2 hours ago';
  }
}
