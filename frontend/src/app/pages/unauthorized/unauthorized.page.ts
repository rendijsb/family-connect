// src/app/pages/unauthorized/unauthorized.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon,
  IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { lockClosedOutline, arrowBackOutline, homeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.page.html',
  styleUrls: ['./unauthorized.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon,
    IonBackButton, IonButtons
  ]
})
export class UnauthorizedPage {
  constructor(public router: Router) {
    addIcons({ lockClosedOutline, arrowBackOutline, homeOutline });
  }
}
