// src/app/pages/dashboard/dashboard.page.ts
import { Component, OnInit } from '@angular/core';
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
  checkmarkCircleOutline, alertCircleOutline
} from 'ionicons/icons';

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
    { id: 'chat', title: 'Family Chat', icon: 'chatbubble-outline', color: '#3b82f6', route: '/chat' },
    { id: 'photos', title: 'Share Photos', icon: 'camera-outline', color: '#10b981', route: '/photos' },
    { id: 'calendar', title: 'Events', icon: 'calendar-outline', color: '#f59e0b', route: '/calendar' },
    { id: 'location', title: 'Locations', icon: 'location-outline', color: '#8b5cf6', route: '/locations' },
    { id: 'memories', title: 'Memories', icon: 'heart-outline', color: '#ef4444', route: '/memories' },
    { id: 'call', title: 'Video Call', icon: 'videocam-outline', color: '#06b6d4', route: '/call' }
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
      checkmarkCircleOutline, alertCircleOutline
    });
  }

  ngOnInit() {
    // Initialize dashboard data
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Simulate loading dashboard data
    console.log('Loading dashboard data...');
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
    // Navigate to the specific route or perform action
  }

  onViewProfile(member: FamilyMember) {
    console.log('View profile:', member.name);
  }

  onViewActivity(activity: Activity) {
    console.log('View activity:', activity.title);
  }

  onViewEvent(event: any) {
    console.log('View event:', event.title);
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
}
