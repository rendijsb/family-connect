// src/app/tabs/profile/profile.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonAvatar, IonItem,
  IonLabel, IonButtons
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth/auth.service';
import { addIcons } from 'ionicons';
import {
  personOutline, settingsOutline, logOutOutline, helpCircleOutline,
  shieldCheckmarkOutline, notificationsOutline, lockClosedOutline,
  informationCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonAvatar, IonItem, IonLabel, IonButtons
  ]
})
export class ProfilePage {
  private readonly authService = inject(AuthService);

  user = this.authService.user();

  constructor() {
    addIcons({
      personOutline, settingsOutline, logOutOutline, helpCircleOutline,
      shieldCheckmarkOutline, notificationsOutline, lockClosedOutline,
      informationCircleOutline
    });
  }

  onLogout() {
    this.authService.logout().subscribe();
  }
}
