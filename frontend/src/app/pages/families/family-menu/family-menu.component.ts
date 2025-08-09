import {Component, inject} from '@angular/core';
import {
  IonContent,
  IonIcon,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  PopoverController
} from '@ionic/angular/standalone';
import {Family} from '../../../models/families/family.models';
import {CommonModule} from '@angular/common';

@Component({
  template: `
    <ion-content class="family-menu-content">
      <ion-list class="family-menu-list">
        <ion-item button (click)="selectAction('view')">
          <ion-icon name="eye-outline" slot="start"></ion-icon>
          <ion-label>View Dashboard</ion-label>
        </ion-item>

        <ion-item button (click)="selectAction('members')">
          <ion-icon name="people-outline" slot="start"></ion-icon>
          <ion-label>Members</ion-label>
        </ion-item>

        <ion-item button (click)="selectAction('invite')" *ngIf="canInvite">
          <ion-icon name="person-add-outline" slot="start"></ion-icon>
          <ion-label>Invite Members</ion-label>
        </ion-item>

        <ion-item button (click)="selectAction('share')">
          <ion-icon name="share-outline" slot="start"></ion-icon>
          <ion-label>Share Invite Code</ion-label>
        </ion-item>

        <ion-item-divider *ngIf="canManage">
          <ion-label>Management</ion-label>
        </ion-item-divider>

        <ion-item button (click)="selectAction('settings')" *ngIf="canManage">
          <ion-icon name="settings-outline" slot="start"></ion-icon>
          <ion-label>Settings</ion-label>
        </ion-item>

        <ion-item button (click)="selectAction('archive')" *ngIf="canManage && family.isActive">
          <ion-icon name="archive-outline" slot="start"></ion-icon>
          <ion-label>Archive</ion-label>
        </ion-item>

        <ion-item button (click)="selectAction('restore')" *ngIf="canManage && !family.isActive">
          <ion-icon name="refresh-outline" slot="start"></ion-icon>
          <ion-label>Restore</ion-label>
        </ion-item>

        <ion-item-divider>
          <ion-label>Actions</ion-label>
        </ion-item-divider>

        <ion-item button (click)="selectAction('leave')" *ngIf="!isOwner" class="leave-item">
          <ion-icon name="exit-outline" slot="start"></ion-icon>
          <ion-label>Leave Family</ion-label>
        </ion-item>

        <ion-item button (click)="selectAction('delete')" *ngIf="isOwner" class="delete-item">
          <ion-icon name="trash-outline" slot="start"></ion-icon>
          <ion-label>Delete Family</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    .family-menu-content {
      --padding-top: 8px;
      --padding-bottom: 8px;
    }

    .family-menu-list {
      margin: 0;
      padding: 0;
    }

    ion-item {
      --background: transparent;
      --color: white;
      --padding-start: 16px;
      --padding-end: 16px;
      --min-height: 44px;
    }

    ion-item:hover {
      --background: rgba(255, 255, 255, 0.1);
    }

    .leave-item, .delete-item {
      --color: #ef4444;
    }

    ion-item-divider {
      --background: rgba(255, 255, 255, 0.05);
      --color: #a1a1aa;
      --padding-start: 16px;
      --padding-end: 16px;
      font-size: 12px;
      min-height: 32px;
    }

    ion-icon {
      color: inherit;
      margin-right: 12px;
    }
  `],
  standalone: true,
  imports: [IonContent, IonList, IonItem, IonLabel, IonIcon, IonItemDivider, CommonModule]
})
export class FamilyMenuComponent {
  family!: Family;
  userRole!: string;

  private readonly popoverController = inject(PopoverController);

  get isOwner(): boolean {
    return this.userRole === 'owner';
  }

  get canManage(): boolean {
    return ['owner', 'admin'].includes(this.userRole);
  }

  get canInvite(): boolean {
    return this.canManage || this.family.settings?.privacy?.allowMemberInvites === true;
  }

  selectAction(action: string) {
    this.popoverController.dismiss({ action });
  }
}
