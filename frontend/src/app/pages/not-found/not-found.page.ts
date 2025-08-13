// src/app/pages/not-found/not-found.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon,
  IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { searchOutline, arrowBackOutline, homeOutline, peopleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.page.html',
  styleUrls: ['./not-found.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon,
    IonBackButton, IonButtons
  ]
})
export class NotFoundPage {
  currentUrl: string;

  constructor(
    public router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({ searchOutline, arrowBackOutline, homeOutline, peopleOutline });
    this.currentUrl = this.router.url;
  }

  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/tabs/home']);
    }
  }
}
