// family-activities.page.ts
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText,
  IonBackButton, IonButtons, IonSegment, IonSegmentButton,
  IonBadge, IonRefresher, IonRefresherContent, IonInfiniteScroll,
  IonInfiniteScrollContent, IonAvatar, IonChip, IonLabel,
  IonSkeletonText, ToastController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, statsChartOutline, timeOutline, peopleOutline,
  personAddOutline, cameraOutline, calendarOutline, chatbubbleOutline,
  heartOutline, shareOutline, locationOutline, giftOutline,
  createOutline, refreshOutline, filterOutline, trendingUpOutline
} from 'ionicons/icons';

import { FamilyService } from '../../../core/services/family/family.service';
import {
  Family,
  FamilyActivity,
  FamilyStats
} from '../../../models/families/family.models';

interface ActivityGroup {
  date: string;
  displayDate: string;
  activities: FamilyActivity[];
}

@Component({
  selector: 'app-family-activities',
  templateUrl: './family-activities.page.html',
  styleUrls: ['./family-activities.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonText,
    IonBackButton, IonButtons, IonSegment, IonSegmentButton,
    IonBadge, IonRefresher, IonRefresherContent, IonInfiniteScroll,
    IonInfiniteScrollContent, IonAvatar, IonChip, IonLabel, IonSkeletonText
  ]
})
export class FamilyActivitiesPage implements OnInit, OnDestroy {
  private readonly familyService = inject(FamilyService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly destroy$ = new Subject<void>();

  currentFamily = signal<Family | null>(null);
  activities = signal<FamilyActivity[]>([]);
  groupedActivities = signal<ActivityGroup[]>([]);
  familyStats = signal<FamilyStats | null>(null);

  selectedFilter = signal<string>('all');
  isLoading = signal<boolean>(false);
  isLoadingMore = signal<boolean>(false);
  hasMoreActivities = signal<boolean>(true);
  currentPage = signal<number>(1);

  // Filter options
  filterOptions = [
    { value: 'all', label: 'All Activity', icon: 'stats-chart-outline' },
    { value: 'member_joined', label: 'New Members', icon: 'person-add-outline' },
    { value: 'photo_shared', label: 'Photos', icon: 'camera-outline' },
    { value: 'event_created', label: 'Events', icon: 'calendar-outline' },
    { value: 'message_sent', label: 'Messages', icon: 'chatbubble-outline' },
    { value: 'milestone_reached', label: 'Milestones', icon: 'celebrate-outline' }
  ];

  constructor() {
    addIcons({
      arrowBackOutline, statsChartOutline, timeOutline, peopleOutline,
      personAddOutline, cameraOutline, calendarOutline, chatbubbleOutline,
      heartOutline, shareOutline, locationOutline, giftOutline,
      createOutline, refreshOutline, filterOutline, trendingUpOutline
    });
  }

  ngOnInit() {
    this.loadCurrentFamily();
    this.loadActivities();
    this.loadFamilyStats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentFamily() {
    this.familyService.currentFamily$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(family => {
      this.currentFamily.set(family);
    });
  }

  private loadActivities(loadMore = false) {
    const family = this.currentFamily();
    if (!family) return;

    if (!loadMore) {
      this.isLoading.set(true);
      this.currentPage.set(1);
    } else {
      this.isLoadingMore.set(true);
    }

    const page = loadMore ? this.currentPage() + 1 : 1;

    this.familyService.getFamilyActivities(family.id, page, 20).pipe(
      finalize(() => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (newActivities) => {
        if (loadMore) {
          const currentActivities = this.activities();
          this.activities.set([...currentActivities, ...newActivities]);
          this.currentPage.set(page);
        } else {
          this.activities.set(newActivities);
        }

        this.hasMoreActivities.set(newActivities.length === 20);
        this.groupActivitiesByDate();
      },
      error: async () => {
        await this.showToast('Failed to load activities', 'danger');
      }
    });
  }

  private loadFamilyStats() {
    const family = this.currentFamily();
    if (!family) return;

    this.familyService.getFamilyStats(family.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.familyStats.set(stats);
      }
    });
  }

  private groupActivitiesByDate() {
    const activities = this.activities();
    const groups: { [key: string]: FamilyActivity[] } = {};

    activities.forEach(activity => {
      const date = new Date(activity.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });

    const groupedArray: ActivityGroup[] = Object.keys(groups).map(date => ({
      date,
      displayDate: this.formatDateGroup(date),
      activities: groups[date].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }));

    // Sort groups by date (newest first)
    groupedArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.groupedActivities.set(groupedArray);
  }

  private formatDateGroup(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  // Filter Management
  onFilterChange(filter: string) {
    this.selectedFilter.set(filter);
    // In a real app, this would filter activities by type
    // For now, we'll just reload all activities
    this.loadActivities();
  }

  // Activity Actions
  onActivityClick(activity: FamilyActivity) {
    // Navigate to activity detail or related content
    switch (activity.type) {
      case 'member_joined':
        if (activity.userId) {
          this.router.navigate(['/family/members', activity.userId]);
        }
        break;
      case 'photo_shared':
        // Navigate to photo gallery
        this.router.navigate(['/family/photos']);
        break;
      case 'event_created':
        // Navigate to events
        this.router.navigate(['/family/events']);
        break;
      case 'message_sent':
        // Navigate to chat
        this.router.navigate(['/family/chat']);
        break;
      default:
        this.showToast('Activity detail coming soon', 'primary');
    }
  }

  onLikeActivity(activity: FamilyActivity, event: Event) {
    event.stopPropagation();
    // TODO: Implement activity liking
    this.showToast('Liked!', 'success');
  }

  onShareActivity(activity: FamilyActivity, event: Event) {
    event.stopPropagation();
    // TODO: Implement activity sharing
    if (navigator.share) {
      navigator.share({
        title: activity.title,
        text: activity.description,
        url: window.location.href
      });
    } else {
      this.showToast('Share functionality coming soon', 'primary');
    }
  }

  // Infinite Scroll
  onInfiniteScroll(event: any) {
    if (this.hasMoreActivities()) {
      this.loadActivities(true);
    }
    event.target.complete();
  }

  // Pull to Refresh
  onRefresh(event: any) {
    this.loadActivities();
    this.loadFamilyStats();
    event.target.complete();
  }

  // Activity Helpers
  getActivityIcon(type: string): string {
    switch (type) {
      case 'member_joined': return 'person-add-outline';
      case 'photo_shared': return 'camera-outline';
      case 'event_created': return 'calendar-outline';
      case 'message_sent': return 'chatbubble-outline';
      case 'milestone_reached': return 'celebrate-outline';
      default: return 'stats-chart-outline';
    }
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'member_joined': return '#22c55e';
      case 'photo_shared': return '#3b82f6';
      case 'event_created': return '#8b5cf6';
      case 'message_sent': return '#f59e0b';
      case 'milestone_reached': return '#dc2626';
      default: return '#6b7280';
    }
  }

  formatActivityTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  }

  trackByActivityId(index: number, activity: FamilyActivity): number {
    return activity.id;
  }

  trackByGroupDate(index: number, group: ActivityGroup): string {
    return group.date;
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
