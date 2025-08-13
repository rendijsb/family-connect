// src/app/tabs/chat/chat.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonBadge, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubbleOutline, notificationsOutline, addOutline } from 'ionicons/icons';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html' ,
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonButton, IonIcon, IonBadge, IonButtons]
})
export class ChatPage {
  constructor() {
    addIcons({ chatbubbleOutline, notificationsOutline, addOutline });
  }
}
