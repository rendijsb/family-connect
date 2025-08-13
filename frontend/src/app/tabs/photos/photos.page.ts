import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, settingsOutline, cloudUploadOutline } from 'ionicons/icons';

@Component({
  selector: 'app-photos',
  templateUrl: './photos.page.html' ,
  styleUrls: ['./photos.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonButton, IonIcon, IonButtons]
})
export class PhotosPage {
  constructor() {
    addIcons({ cameraOutline, settingsOutline, cloudUploadOutline });
  }
}
