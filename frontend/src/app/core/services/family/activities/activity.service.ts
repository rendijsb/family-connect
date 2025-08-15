import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {Observable, BehaviorSubject, throwError, tap, catchError, map, switchMap, from, finalize} from 'rxjs';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { ApiUrlService } from '../../api.service';
import {
  FamilyActivity,
  ActivityResponse,
  ActivityListResponse,
  CreateActivityRequest,
  UpdateActivityRequest,
  UpdateAttendeeRequest,
  InviteAttendeesRequest,
  ActivityFilters,
  ActivityStats,
  CalendarEvent,
  ActivityTypeEnum,
  ActivityStatusEnum,
  AttendeeStatusEnum,
  ACTIVITY_TYPE_CONFIG
} from '../../../../models/families/activities/activity.models';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);
  private readonly toastController = inject(ToastController);
  private readonly loadingController = inject(LoadingController);
  private readonly alertController = inject(AlertController);

  private activitiesSubject = new BehaviorSubject<FamilyActivity[]>([]);
  private currentActivitySubject = new BehaviorSubject<FamilyActivity | null>(null);
  private activityStatsSubject = new BehaviorSubject<ActivityStats | null>(null);
  private calendarEventsSubject = new BehaviorSubject<CalendarEvent[]>([]);

  readonly activities$ = this.activitiesSubject.asObservable();
  readonly currentActivity$ = this.currentActivitySubject.asObservable();
  readonly activityStats$ = this.activityStatsSubject.asObservable();
  readonly calendarEvents$ = this.calendarEventsSubject.asObservable();

  private activitiesSignal = signal<FamilyActivity[]>([]);
  private isLoadingSignal = signal<boolean>(false);
  private selectedDateSignal = signal<string>(new Date().toISOString().split('T')[0]);

  readonly activities = this.activitiesSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly selectedDate = this.selectedDateSignal.asReadonly();

  constructor() {
    this.activities$.subscribe(activities => {
      this.activitiesSignal.set(activities);
      this.updateCalendarEvents(activities);
    });
  }

  // Activity CRUD operations
  createActivity(familyId: number, activityData: CreateActivityRequest): Observable<FamilyActivity> {
    this.isLoadingSignal.set(true);

    return this.http.post<ActivityResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/activities`),
      activityData
    ).pipe(
      map(response => response.data),
      map(activity => this.processActivity(activity)),
      tap(async (activity) => {
        // Add to activities list
        const currentActivities = this.activitiesSignal();
        this.activitiesSubject.next([activity, ...currentActivities]);

        await this.showToast('Activity created successfully!', 'success');
      }),
      catchError(error => this.handleError(error)),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  updateActivity(familyId: number, activityId: number, updateData: UpdateActivityRequest): Observable<FamilyActivity> {
    this.isLoadingSignal.set(true);

    return this.http.put<ActivityResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/activities/${activityId}`),
      updateData
    ).pipe(
      map(response => response.data),
      map(activity => this.processActivity(activity)),
      tap(async (updatedActivity) => {
        // Update activity in list
        const currentActivities = this.activitiesSignal();
        const updatedActivities = currentActivities.map(activity =>
          activity.id === updatedActivity.id ? updatedActivity : activity
        );
        this.activitiesSubject.next(updatedActivities);

        // Update current activity if it's the same
        if (this.currentActivitySubject.value?.id === updatedActivity.id) {
          this.currentActivitySubject.next(updatedActivity);
        }

        await this.showToast('Activity updated successfully!', 'success');
      }),
      catchError(error => this.handleError(error)),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  deleteActivity(familyId: number, activityId: number): Observable<void> {
    return from(
      this.showConfirmDialog(
        'Delete Activity',
        'Are you sure you want to delete this activity? This action cannot be undone.',
        ['Cancel', 'Delete']
      )
    ).pipe(
      switchMap(confirmed => {
        if (!confirmed) return throwError(() => new Error('User cancelled'));
        this.isLoadingSignal.set(true);

        return this.http.delete<{ success: boolean; message: string }>(
          this.apiUrlService.getUrl(`families/${familyId}/activities/${activityId}`)
        ).pipe(
          tap(async () => {
            const updatedActivities = this.activitiesSignal().filter(a => a.id !== activityId);
            this.activitiesSubject.next(updatedActivities);
            await this.showToast('Activity deleted successfully', 'success');
          }),
          map(() => void 0),
          catchError(error => this.handleError(error)),
          finalize(() => this.isLoadingSignal.set(false))
        );
      })
    );
  }


  // Activity retrieval
  getActivities(familyId: number, filters?: ActivityFilters): Observable<FamilyActivity[]> {
    const params: any = {};
    if (filters) {
      if (filters.types?.length) params.types = filters.types.join(',');
      if (filters.status?.length) params.status = filters.status.join(',');
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
      if (filters.createdBy) params.created_by = filters.createdBy;
      if (filters.location) params.location = filters.location;
      if (filters.attendeeStatus) params.attendee_status = filters.attendeeStatus;
    }

    return this.http.get<ActivityListResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/activities`),
      { params }
    ).pipe(
      map(response => response.data),
      map(activities => activities.map(activity => this.processActivity(activity))),
      tap(activities => {
        this.activitiesSubject.next(activities);
      }),
      catchError(error => this.handleError(error))
    );
  }

  getActivity(familyId: number, activityId: number): Observable<FamilyActivity> {
    return this.http.get<ActivityResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/activities/${activityId}`)
    ).pipe(
      map(response => response.data),
      map(activity => this.processActivity(activity)),
      tap(activity => {
        this.currentActivitySubject.next(activity);
      }),
      catchError(error => this.handleError(error))
    );
  }

  getUpcomingActivities(familyId: number, limit: number = 10): Observable<FamilyActivity[]> {
    const params = {
      upcoming: 'true',
      limit: limit.toString(),
      status: ActivityStatusEnum.PLANNED
    };

    return this.http.get<ActivityListResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/activities`),
      { params }
    ).pipe(
      map(response => response.data),
      map(activities => activities.map(activity => this.processActivity(activity))),
      catchError(error => this.handleError(error))
    );
  }

  getCalendarEvents(familyId: number, month: string): Observable<CalendarEvent[]> {
    const params = {
      calendar: 'true',
      month: month // YYYY-MM format
    };

    return this.http.get<ActivityListResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/activities`),
      { params }
    ).pipe(
      map(response => response.data),
      map(activities => this.convertToCalendarEvents(activities)),
      tap(events => {
        this.calendarEventsSubject.next(events);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Attendee management
  updateAttendeeStatus(familyId: number, activityId: number, updateData: UpdateAttendeeRequest): Observable<FamilyActivity> {
    return this.http.put<ActivityResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/activities/${activityId}/attendee`),
      updateData
    ).pipe(
      map(response => response.data),
      map(activity => this.processActivity(activity)),
      tap(async (updatedActivity) => {
        // Update activity in list
        const currentActivities = this.activitiesSignal();
        const updatedActivities = currentActivities.map(activity =>
          activity.id === updatedActivity.id ? updatedActivity : activity
        );
        this.activitiesSubject.next(updatedActivities);

        // Update current activity
        if (this.currentActivitySubject.value?.id === updatedActivity.id) {
          this.currentActivitySubject.next(updatedActivity);
        }

        await this.showToast('Response updated successfully!', 'success');
      }),
      catchError(error => this.handleError(error))
    );
  }

  inviteAttendees(familyId: number, activityId: number, inviteData: InviteAttendeesRequest): Observable<FamilyActivity> {
    return this.http.post<ActivityResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/activities/${activityId}/invite`),
      inviteData
    ).pipe(
      map(response => response.data),
      map(activity => this.processActivity(activity)),
      tap(async (updatedActivity) => {
        // Update activity in list
        const currentActivities = this.activitiesSignal();
        const updatedActivities = currentActivities.map(activity =>
          activity.id === updatedActivity.id ? updatedActivity : activity
        );
        this.activitiesSubject.next(updatedActivities);

        // Update current activity
        if (this.currentActivitySubject.value?.id === updatedActivity.id) {
          this.currentActivitySubject.next(updatedActivity);
        }

        await this.showToast(`Invited ${inviteData.userIds.length} members!`, 'success');
      }),
      catchError(error => this.handleError(error))
    );
  }

  removeAttendee(familyId: number, activityId: number, userId: number): Observable<FamilyActivity> {
    return this.http.delete<ActivityResponse>(
      this.apiUrlService.getUrl(`families/${familyId}/activities/${activityId}/attendees/${userId}`)
    ).pipe(
      map(response => response.data),
      map(activity => this.processActivity(activity)),
      tap(async (updatedActivity) => {
        // Update activity in list
        const currentActivities = this.activitiesSignal();
        const updatedActivities = currentActivities.map(activity =>
          activity.id === updatedActivity.id ? updatedActivity : activity
        );
        this.activitiesSubject.next(updatedActivities);

        // Update current activity
        if (this.currentActivitySubject.value?.id === updatedActivity.id) {
          this.currentActivitySubject.next(updatedActivity);
        }

        await this.showToast('Attendee removed successfully', 'success');
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Activity statistics
  getActivityStats(familyId: number): Observable<ActivityStats> {
    return this.http.get<{ success: boolean; data: ActivityStats }>(
      this.apiUrlService.getUrl(`families/${familyId}/activities/stats`)
    ).pipe(
      map(response => response.data),
      tap(stats => {
        this.activityStatsSubject.next(stats);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Utility methods
  private processActivity(activity: FamilyActivity): FamilyActivity {
    const processed = {
      ...activity,
      isAllDay: !activity.startTime || !activity.endTime,
      duration: this.calculateDuration(activity.startTime, activity.endTime),
      attendeeCount: activity.attendees?.length || 0,
      acceptedCount: activity.attendees?.filter(a => a.status === AttendeeStatusEnum.ACCEPTED).length || 0,
      declinedCount: activity.attendees?.filter(a => a.status === AttendeeStatusEnum.DECLINED).length || 0,
      canEdit: true, // This would be calculated based on permissions
      canDelete: true // This would be calculated based on permissions
    };

    return processed;
  }

  private calculateDuration(startTime?: string, endTime?: string): number {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
  }

  private convertToCalendarEvents(activities: FamilyActivity[]): CalendarEvent[] {
    return activities.map(activity => {
      const config = ACTIVITY_TYPE_CONFIG[activity.type];
      const start = activity.activityDate || activity.startTime || activity.createdAt;
      const end = activity.endTime || start;

      return {
        id: activity.id,
        title: activity.title,
        start: start,
        end: end,
        color: activity.metadata?.color || config.color,
        activity: activity,
        allDay: !activity.startTime || !activity.endTime,
        textColor: '#ffffff',
        borderColor: activity.metadata?.color || config.color
      };
    });
  }

  private updateCalendarEvents(activities: FamilyActivity[]): void {
    const events = this.convertToCalendarEvents(activities);
    this.calendarEventsSubject.next(events);
  }

  // Filter and search methods
  filterActivitiesByType(type: ActivityTypeEnum): FamilyActivity[] {
    return this.activitiesSignal().filter(activity => activity.type === type);
  }

  filterActivitiesByStatus(status: ActivityStatusEnum): FamilyActivity[] {
    return this.activitiesSignal().filter(activity => activity.status === status);
  }

  filterUpcomingActivities(): FamilyActivity[] {
    const now = new Date();
    return this.activitiesSignal().filter(activity => {
      const activityDate = new Date(activity.activityDate || activity.startTime || activity.createdAt);
      return activityDate > now && activity.status === ActivityStatusEnum.PLANNED;
    });
  }

  searchActivities(query: string): FamilyActivity[] {
    const searchTerm = query.toLowerCase();
    return this.activitiesSignal().filter(activity =>
      activity.title.toLowerCase().includes(searchTerm) ||
      activity.description?.toLowerCase().includes(searchTerm) ||
      activity.location?.toLowerCase().includes(searchTerm)
    );
  }

  // Date navigation
  setSelectedDate(date: string): void {
    this.selectedDateSignal.set(date);
  }

  getSelectedDateActivities(): FamilyActivity[] {
    const selectedDate = this.selectedDateSignal();
    return this.activitiesSignal().filter(activity => {
      const activityDate = new Date(activity.activityDate || activity.startTime || activity.createdAt);
      const selected = new Date(selectedDate);
      return activityDate.toDateString() === selected.toDateString();
    });
  }

  // Clear data
  clearActivityData(): void {
    this.activitiesSubject.next([]);
    this.currentActivitySubject.next(null);
    this.activityStatsSubject.next(null);
    this.calendarEventsSubject.next([]);
  }

  // Error handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error) {
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.errors) {
        const firstError = Object.values(error.error.errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError as string;
      }
    } else if (error.status === 0) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.status === 404) {
      errorMessage = 'Activity not found.';
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    }

    this.showToast(errorMessage, 'danger');
    return throwError(() => error);
  }

  // UI helper methods
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  private async showConfirmDialog(
    header: string,
    message: string,
    buttons: string[] = ['Cancel', 'Confirm']
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header,
        message,
        buttons: [
          {
            text: buttons[0],
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: buttons[1],
            role: 'confirm',
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }
}
