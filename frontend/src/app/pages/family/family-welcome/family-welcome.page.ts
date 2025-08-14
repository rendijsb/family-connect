// family-welcome.page.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText,
  IonGrid, IonRow, IonCol, IonAvatar, IonChip, IonLabel
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline, personAddOutline, peopleOutline, homeOutline,
  createOutline, enterOutline, swapHorizontalOutline
} from 'ionicons/icons';

import { FamilyService } from '../../../core/services/family/family.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { FamilyCardComponent } from '../../../components/family/family-card/family-card.component';
import { Family } from '../../../models/families/family.models';

@Component({
  selector: 'app-family-welcome',
  templateUrl: './family-welcome.page.html',
  styleUrls: ['./family-welcome.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText,
    IonGrid, IonRow, IonCol, IonAvatar, IonChip, IonLabel,
    FamilyCardComponent
  ]
})
export class FamilyWelcomePage implements OnInit {
  private readonly familyService = inject(FamilyService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  userFamilies = signal<Family[]>([]);
  isLoading = signal<boolean>(false);
  currentUser = this.authService.user;

  constructor() {
    addIcons({
      addOutline, personAddOutline, peopleOutline, homeOutline,
      createOutline, enterOutline, swapHorizontalOutline
    });
  }

  ngOnInit() {
    this.loadUserFamilies();
  }

  private loadUserFamilies() {
    this.isLoading.set(true);
    this.familyService.loadUserFamilies().subscribe({
      next: (families) => {
        this.userFamilies.set(families);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onCreateFamily() {
    this.router.navigate(['/family/create']);
  }

  onJoinFamily() {
    this.router.navigate(['/family/join']);
  }

  onFamilySelected(family: Family) {
    this.familyService.switchFamily(family.id).subscribe(() => {
      this.router.navigate(['/tabs/family']);
    });
  }

  onFamilySettings(family: Family) {
    this.familyService.switchFamily(family.id).subscribe(() => {
      this.router.navigate(['/family/settings']);
    });
  }

  onFamilyMembers(family: Family) {
    this.familyService.switchFamily(family.id).subscribe(() => {
      this.router.navigate(['/family/members']);
    });
  }
}
