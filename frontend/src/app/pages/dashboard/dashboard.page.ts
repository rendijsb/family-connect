import {Component, computed, inject, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonButton, IonIcon, IonAvatar, IonLabel,
  IonItem, IonList, IonBadge, IonGrid, IonRow, IonCol, IonSegment,
  IonSegmentButton, IonRefresher, IonRefresherContent, IonFab, IonFabButton,
  IonChip, IonProgressBar, IonText, IonButtons, IonMenuButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, peopleOutline, chatbubbleOutline, calendarOutline,
  notificationsOutline, settingsOutline, addOutline, heartOutline,
  cameraOutline, locationOutline, timeOutline, trophyOutline,
  statsChartOutline, optionsOutline, documentTextOutline, callOutline,
  videocamOutline, giftOutline, restaurantOutline, carOutline,
  medicalOutline, schoolOutline, walletOutline, happyOutline,
  chevronForwardOutline, ellipsisHorizontalOutline, personOutline,
  checkmarkCircleOutline, alertCircleOutline, addCircleOutline, linkOutline
} from 'ionicons/icons';
import {Router} from '@angular/router';
import {LoadingController, ToastController} from '@ionic/angular';
import {AuthService} from '../../core/services/auth/auth.service';
import { CurrentFamilyService } from '../../core/services/current-family.service';
import {Family} from '../../models/families/family.models';

interface FamilyMember {
  id: number;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  role: string;
  lastSeen?: string;
}

interface Activity {
  id: number;
  type: 'photo' | 'event' | 'milestone' | 'location' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  userAvatar: string;
  icon: string;
  color: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  route?: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonButton, IonIcon, IonAvatar, IonLabel,
    IonItem, IonList, IonBadge, IonSegment,
    IonSegmentButton, IonRefresher, IonRefresherContent, IonFab, IonFabButton,
    IonChip, IonProgressBar, IonButtons, IonMenuButton
  ]
})
export class DashboardPage implements OnInit {
  selectedSegment = 'overview';
  currentUser = {
    name: 'Sarah Johnson',
    avatar: '/assets/avatars/sarah.jpg',
    role: 'Mom'
  };

  familyStats = {
    totalMembers: 6,
    activeToday: 4,
    photosShared: 1234,
    eventsPlanned: 8,
    milestonesReached: 15,
    connectionStrength: 92
  };

  familyMembers: FamilyMember[] = [
    {
      id: 1,
      name: 'John Johnson',
      avatar: '/assets/avatars/john.jpg',
      status: 'online',
      role: 'Dad',
    },
    {
      id: 2,
      name: 'Emma Johnson',
      avatar: '/assets/avatars/emma.jpg',
      status: 'online',
      role: 'Daughter',
    },
    {
      id: 3,
      name: 'Michael Johnson',
      avatar: '/assets/avatars/michael.jpg',
      status: 'away',
      role: 'Son',
      lastSeen: '2 hours ago'
    },
    {
      id: 4,
      name: 'Grandma Rose',
      avatar: '/assets/avatars/rose.jpg',
      status: 'offline',
      role: 'Grandmother',
      lastSeen: 'Yesterday'
    },
    {
      id: 5,
      name: 'Uncle Tom',
      avatar: '/assets/avatars/tom.jpg',
      status: 'online',
      role: 'Uncle',
    }
  ];

  recentActivities: Activity[] = [
    {
      id: 1,
      type: 'photo',
      title: 'Family Picnic Photos',
      description: 'Emma shared 12 new photos from today\'s family picnic at Central Park',
      timestamp: '2 hours ago',
      user: 'Emma Johnson',
      userAvatar: '/assets/avatars/emma.jpg',
      icon: 'photos-outline',
      color: '#3b82f6'
    },
    {
      id: 2,
      type: 'milestone',
      title: 'Michael\'s Achievement',
      description: 'Michael completed his first marathon! 🏃‍♂️',
      timestamp: '5 hours ago',
      user: 'Michael Johnson',
      userAvatar: '/assets/avatars/michael.jpg',
      icon: 'trophy-outline',
      color: '#f59e0b'
    },
    {
      id: 3,
      type: 'event',
      title: 'Weekend BBQ Planned',
      description: 'John scheduled a family BBQ for this Saturday at 6 PM',
      timestamp: '1 day ago',
      user: 'John Johnson',
      userAvatar: '/assets/avatars/john.jpg',
      icon: 'calendar-outline',
      color: '#10b981'
    },
    {
      id: 4,
      type: 'location',
      title: 'Safe Arrival',
      description: 'Grandma Rose arrived safely at the grocery store',
      timestamp: '2 days ago',
      user: 'Grandma Rose',
      userAvatar: '/assets/avatars/rose.jpg',
      icon: 'location-outline',
      color: '#8b5cf6'
    }
  ];

  quickActions: QuickAction[] = [
    {
      id: 'families',
      title: 'My Families',
      icon: 'people-outline',
      color: '#3b82f6',
      route: '/families'
    },
    {
      id: 'create-family',
      title: 'Create Family',
      icon: 'add-circle-outline',
      color: '#22c55e',
      route: '/families/create'
    },
    {
      id: 'join-family',
      title: 'Join Family',
      icon: 'link-outline',
      color: '#f59e0b',
      route: '/families/join'
    },
    {
      id: 'chat',
      title: 'Family Chat',
      icon: 'chatbubble-outline',
      color: '#10b981'
    },
    {
      id: 'photos',
      title: 'Share Photos',
      icon: 'camera-outline',
      color: '#f59e0b'
    },
    {
      id: 'calendar',
      title: 'Events',
      icon: 'calendar-outline',
      color: '#8b5cf6'
    }
  ];

  upcomingEvents = [
    {
      id: 1,
      title: 'Emma\'s Soccer Game',
      date: 'Today, 4:00 PM',
      location: 'Riverside Field',
      attendees: 4,
      color: '#10b981'
    },
    {
      id: 2,
      title: 'Family Movie Night',
      date: 'Tomorrow, 8:00 PM',
      location: 'Living Room',
      attendees: 6,
      color: '#3b82f6'
    },
    {
      id: 3,
      title: 'Grandma\'s Birthday',
      date: 'Sunday, 2:00 PM',
      location: 'Rose Garden Restaurant',
      attendees: 8,
      color: '#f59e0b'
    }
  ];

  constructor() {
    addIcons({
      homeOutline, peopleOutline, chatbubbleOutline, calendarOutline,
      notificationsOutline, settingsOutline, addOutline, heartOutline,
      cameraOutline, locationOutline, timeOutline, trophyOutline,
      statsChartOutline, documentTextOutline, callOutline,
      videocamOutline, giftOutline, restaurantOutline, carOutline,
      medicalOutline, schoolOutline, walletOutline, happyOutline,
      chevronForwardOutline, ellipsisHorizontalOutline, personOutline,
      checkmarkCircleOutline, alertCircleOutline, addCircleOutline, linkOutline
    });
  }

  protected readonly router = inject(Router)
  private readonly loadingController = inject(LoadingController)
  private readonly authService = inject(AuthService);
  private readonly currentFamilyService = inject(CurrentFamilyService);
  private readonly toastController = inject(ToastController);

  currentFamilyId = computed(() => this.currentFamilyService.currentFamilyId());
  currentFamily = computed(() => this.currentFamilyService.currentFamily());

  ngOnInit() {
    this.loadDashboardData();

    this.handleBackButton();
    this.checkFamilySelection();
  }

  private async checkFamilySelection() {
    // This is where you might load user's families and auto-select one
    // if they don't have a current family selected
    const hasFamily = this.currentFamilyId();
    if (!hasFamily) {
      // Optionally navigate to families list or show family selection
      console.log('No current family selected');
    }
  }

  loadDashboardData() {
    // Simulate loading dashboard data
    console.log('Loading dashboard data...');
  }

  private handleBackButton() {
    // Handle hardware back button on Android
    document.addEventListener('backbutton', () => {
      // Prevent default back action in dashboard
      // User should use logout instead
    });
  }

  doRefresh(event: any) {
    setTimeout(() => {
      this.loadDashboardData();
      event.target.complete();
    }, 1500);
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  onQuickAction(action: QuickAction) {
    console.log('Quick action clicked:', action.title);

    // Handle direct routes first
    if (action.route) {
      this.router.navigate([action.route]);
      return;
    }

    const familyId = this.currentFamilyId();

    switch (action.id) {
      case 'chat':
        if (familyId) {
          this.router.navigate(['/families', familyId, 'dashboard']);
          this.showToast('Family chat coming soon!', 'primary');
        } else {
          this.router.navigate(['/families']);
          this.showToast('Please select a family first', 'warning');
        }
        break;

      case 'photos':
        if (familyId) {
          this.router.navigate(['/families', familyId, 'dashboard']);
          this.showToast('Photo sharing coming soon!', 'primary');
        } else {
          this.router.navigate(['/families']);
          this.showToast('Please select a family first', 'warning');
        }
        break;

      case 'calendar':
        if (familyId) {
          this.router.navigate(['/families', familyId, 'dashboard']);
          this.showToast('Family events coming soon!', 'primary');
        } else {
          this.router.navigate(['/families']);
          this.showToast('Please select a family first', 'warning');
        }
        break;

      default:
        this.router.navigate(['/families']);
        break;
    }
  }

  onViewProfile(member: FamilyMember) {
    console.log('View profile:', member.name);
    const familyId = this.currentFamilyId();
    if (familyId) {
      this.router.navigate(['/families', familyId, 'members', member.id]);
    }
  }

  onViewActivity(activity: Activity) {
    console.log('View activity:', activity.title);
    const familyId = this.currentFamilyId();
    if (familyId) {
      this.router.navigate(['/families', familyId, 'dashboard']);
    }
  }

  onViewEvent(event: any) {
    console.log('View event:', event.title);
    const familyId = this.currentFamilyId();
    if (familyId) {
      this.router.navigate(['/families', familyId, 'dashboard']);
    }
  }


  onManageFamilies() {
    this.router.navigate(['/families']);
  }

  onCreateFamily() {
    this.router.navigate(['/families/create']);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'online': return '#10b981';
      case 'away': return '#f59e0b';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'photo': return 'photos-outline';
      case 'event': return 'calendar-outline';
      case 'milestone': return 'trophy-outline';
      case 'location': return 'location-outline';
      case 'achievement': return 'checkmark-circle-outline';
      default: return 'happy-outline';
    }
  }

  async onLogout() {
    const loading = await this.loadingController.create({
      message: 'Logging out...',
      spinner: 'crescent'
    });
    await loading.present();

    this.authService.logout().subscribe({
      complete: async () => {
        await loading.dismiss();
      },
      error: async () => {
        await loading.dismiss();
      }
    });
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
