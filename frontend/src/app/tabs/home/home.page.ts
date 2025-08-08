import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText, IonAvatar,
  IonRefresher, IonRefresherContent, IonFab, IonFabButton, IonButtons,
  IonMenuButton
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth/auth.service';
import { addIcons } from 'ionicons';
import {
  homeOutline, peopleOutline, chatbubbleOutline, cameraOutline,
  addOutline, settingsOutline, logOutOutline, heartOutline,
  calendarOutline, locationOutline, notificationsOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText, IonAvatar,
    IonRefresher, IonRefresherContent, IonFab, IonFabButton, IonButtons,
    IonMenuButton
  ]
})
export class HomePage {
  private readonly authService = inject(AuthService);

  user = this.authService.user();

  constructor() {
    addIcons({
      homeOutline, peopleOutline, chatbubbleOutline, cameraOutline,
      addOutline, settingsOutline, logOutOutline, heartOutline,
      calendarOutline, locationOutline, notificationsOutline
    });
  }

  doRefresh(event: any) {
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  onLogout() {
    this.authService.logout().subscribe();
  }
}
