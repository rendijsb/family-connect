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
import {Router} from '@angular/router';

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
  private readonly router = inject(Router);

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

  onQuickAction(actionType: string) {
    switch (actionType) {
      case 'family':
        this.router.navigate(['/tabs/family']);
        break;
      case 'chat':
        this.router.navigate(['/family/chat']);
        break;
      case 'photos':
        this.router.navigate(['/family/photos']);
        break;
      case 'events':
        this.router.navigate(['/family/events']);
        break;
      case 'location':
        this.router.navigate(['/family/locations']);
        break;
      case 'memories':
        this.router.navigate(['/family/memories']);
        break;
      default:
        console.log('Action not implemented:', actionType);
    }
  }
}
