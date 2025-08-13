// src/app/tabs/family/family.page.ts
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonButtons, IonBadge,
  IonFab, IonFabButton, IonAvatar, IonChip, IonLabel
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { FamilyService } from '../../core/services/families/family.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { addIcons } from 'ionicons';
import {
  peopleOutline, addOutline, settingsOutline, notificationsOutline,
  chatbubbleOutline, calendarOutline, cameraOutline, locationOutline,
  linkOutline, personAddOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-family',
  templateUrl: './family-tab.page.html',
  styleUrls: ['./family-tab.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonButtons, IonBadge,
    IonFab, IonFabButton, IonAvatar, IonChip, IonLabel
  ]
})
export class FamilyPage {
  private readonly familyService = inject(FamilyService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  families = computed(() => this.familyService.families());
  currentUser = computed(() => this.authService.user());

  // Mock data for now - in real app, this would come from the service
  recentFamilies = [
    { id: 1, name: 'Smith Family', memberCount: 5 },
    { id: 2, name: 'Johnson Clan', memberCount: 8 }
  ];

  get totalFamilies() {
    return this.families().length || this.recentFamilies.length;
  }

  get totalMembers() {
    return this.families().reduce((total, family) => total + (family.memberCount || 0), 0) || 13;
  }

  constructor() {
    addIcons({
      peopleOutline, addOutline, settingsOutline, notificationsOutline,
      chatbubbleOutline, calendarOutline, cameraOutline, locationOutline,
      linkOutline, personAddOutline
    });
  }

  onCreateFamily() {
    this.router.navigate(['/families/create']);
  }

  onJoinFamily() {
    this.router.navigate(['/families/join']);
  }

  onViewAllFamilies() {
    this.router.navigate(['/families']);
  }

  onInviteMembers() {
    this.router.navigate(['/families']);
  }

  onSelectFamily(family: any) {
    this.router.navigate(['/families', family.id, 'dashboard']);
  }

  getFamilyInitials(family: any): string {
    return family.name
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  }

  getUserRole(family: any): string {
    return 'Owner'; // Mock - in real app, determine from family membership
  }
}
