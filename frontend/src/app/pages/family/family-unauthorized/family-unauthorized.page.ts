import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText,
  IonBackButton, IonButtons, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, shieldOutline, warningOutline, homeOutline,
  peopleOutline, settingsOutline, lockClosedOutline,
  informationCircleOutline, mailOutline
} from 'ionicons/icons';

import { FamilyService } from '../../../core/services/family/family.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Family } from '../../../models/families/family.models';

interface UnauthorizedReason {
  type: 'permission' | 'role' | 'membership' | 'ownership';
  title: string;
  description: string;
  icon: string;
  actions: Array<{
    label: string;
    icon: string;
    route?: string;
    action?: () => void;
    primary?: boolean;
  }>;
}

@Component({
  selector: 'app-family-unauthorized',
  templateUrl: './family-unauthorized.page.html',
  styleUrls: ['./family-unauthorized.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText,
    IonBackButton, IonButtons, IonGrid, IonRow, IonCol
  ]
})
export class FamilyUnauthorizedPage implements OnInit {
  private readonly familyService = inject(FamilyService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  currentFamily = signal<Family | null>(null);
  currentUser = this.authService.user;
  unauthorizedReason = signal<UnauthorizedReason | null>(null);

  constructor() {
    addIcons({
      arrowBackOutline, shieldOutline, warningOutline, homeOutline,
      peopleOutline, settingsOutline, lockClosedOutline,
      informationCircleOutline, mailOutline
    });
  }

  ngOnInit() {
    this.loadCurrentFamily();
    this.determineUnauthorizedReason();
  }

  private loadCurrentFamily() {
    this.familyService.currentFamily$.subscribe(family => {
      this.currentFamily.set(family);
    });
  }

  private determineUnauthorizedReason() {
    // Get the intended action from query parameters
    const intendedAction = this.route.snapshot.queryParams['action'] || 'access';
    const requiredRole = this.route.snapshot.queryParams['role'];
    const requiredPermission = this.route.snapshot.queryParams['permission'];

    let reason: UnauthorizedReason;

    if (!this.currentFamily()) {
      reason = {
        type: 'membership',
        title: 'No Family Selected',
        description: 'You need to be a member of a family to access this feature. Please join or create a family first.',
        icon: 'people-outline',
        actions: [
          {
            label: 'Join Family',
            icon: 'person-add-outline',
            route: '/family/join',
            primary: true
          },
          {
            label: 'Create Family',
            icon: 'add-outline',
            route: '/family/create'
          },
          {
            label: 'Go Home',
            icon: 'home-outline',
            route: '/tabs/home'
          }
        ]
      };
    } else if (requiredRole === 'owner') {
      reason = {
        type: 'ownership',
        title: 'Owner Access Required',
        description: 'This action can only be performed by the family owner. Contact the family owner if you need assistance.',
        icon: 'shield-outline',
        actions: [
          {
            label: 'View Members',
            icon: 'people-outline',
            route: '/family/members',
            primary: true
          },
          {
            label: 'Contact Owner',
            icon: 'mail-outline',
            action: () => this.contactOwner()
          },
          {
            label: 'Back to Family',
            icon: 'home-outline',
            route: '/tabs/family'
          }
        ]
      };
    } else if (requiredRole === 'admin') {
      reason = {
        type: 'role',
        title: 'Admin Access Required',
        description: 'This feature requires admin privileges. Ask a family admin or owner to grant you the necessary permissions.',
        icon: 'settings-outline',
        actions: [
          {
            label: 'View Members',
            icon: 'people-outline',
            route: '/family/members',
            primary: true
          },
          {
            label: 'Request Admin Access',
            icon: 'mail-outline',
            action: () => this.requestAdminAccess()
          },
          {
            label: 'Back to Family',
            icon: 'home-outline',
            route: '/tabs/family'
          }
        ]
      };
    } else if (requiredPermission) {
      reason = {
        type: 'permission',
        title: 'Permission Required',
        description: `You don't have the required permission (${requiredPermission}) to perform this action. Contact a family admin for assistance.`,
        icon: 'lock-closed-outline',
        actions: [
          {
            label: 'View My Profile',
            icon: 'person-outline',
            route: '/profile',
            primary: true
          },
          {
            label: 'Contact Admin',
            icon: 'mail-outline',
            action: () => this.contactAdmin()
          },
          {
            label: 'Back to Family',
            icon: 'home-outline',
            route: '/tabs/family'
          }
        ]
      };
    } else {
      reason = {
        type: 'membership',
        title: 'Access Denied',
        description: 'You don\'t have permission to access this feature. This might be due to your role or family settings.',
        icon: 'warning-outline',
        actions: [
          {
            label: 'Back to Family',
            icon: 'home-outline',
            route: '/tabs/family',
            primary: true
          },
          {
            label: 'View Members',
            icon: 'people-outline',
            route: '/family/members'
          },
          {
            label: 'Need Help?',
            icon: 'information-circle-outline',
            action: () => this.showHelp()
          }
        ]
      };
    }

    this.unauthorizedReason.set(reason);
  }

  onActionClick(action: any) {
    if (action.route) {
      this.router.navigate([action.route]);
    } else if (action.action) {
      action.action();
    }
  }

  private contactOwner() {
    const family = this.currentFamily();
    if (family?.owner) {
      // In a real app, this would open a chat or email to the owner
      this.router.navigate(['/chat', family.owner.userId]);
    }
  }

  private requestAdminAccess() {
    // In a real app, this would send a request to family admins
    const family = this.currentFamily();
    if (family) {
      this.router.navigate(['/family/request-admin'], {
        queryParams: { familyId: family.id }
      });
    }
  }

  private contactAdmin() {
    // In a real app, this would show a list of admins to contact
    this.router.navigate(['/family/members'], {
      queryParams: { filter: 'admins' }
    });
  }

  private showHelp() {
    // In a real app, this would open help documentation
    this.router.navigate(['/help/permissions']);
  }

  getIconColor(): string {
    const reason = this.unauthorizedReason();
    if (!reason) return '#6b7280';

    switch (reason.type) {
      case 'ownership': return '#dc2626';
      case 'role': return '#f59e0b';
      case 'permission': return '#3b82f6';
      case 'membership': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  getBackgroundGradient(): string {
    const reason = this.unauthorizedReason();
    if (!reason) return 'rgba(107, 114, 128, 0.1)';

    switch (reason.type) {
      case 'ownership': return 'linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(185, 28, 28, 0.1))';
      case 'role': return 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))';
      case 'permission': return 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))';
      case 'membership': return 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.1))';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  }
}
