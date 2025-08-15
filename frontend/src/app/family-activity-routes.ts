import { Routes } from '@angular/router';
import { familyMemberGuard } from './core/guards/family-member.guard';
import { familyAdminGuard } from './core/guards/family-admin.guard';

export const familyActivityRoutes: Routes = [
  {
    path: 'calendar',
    canActivate: [familyMemberGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/family/family-calendar/family-calendar.component').then(m => m.FamilyCalendarComponent)
      },
      // {
      //   path: 'day',
      //   loadComponent: () => import('./components/family/family-calendar-day/family-calendar-day.component').then(m => m.FamilyCalendarDayComponent)
      // },
      // {
      //   path: 'week',
      //   loadComponent: () => import('./components/family/family-calendar-week/family-calendar-week.component').then(m => m.FamilyCalendarWeekComponent)
      // }
    ]
  },

  {
    path: 'activities',
    canActivate: [familyMemberGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/activities/activity-list/activity-list.component').then(m => m.ActivityListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./components/activities/activity-form/activity-form.component').then(m => m.ActivityFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./components/activities/activity-detail/activity-detail.component').then(m => m.ActivityDetailComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./components/activities/activity-form/activity-form.component').then(m => m.ActivityFormComponent)
      },
      // {
      //   path: ':id/invite',
      //   loadComponent: () => import('./components/activities/activity-invite/activity-invite.component').then(m => m.ActivityInviteComponent)
      // }
    ]
  }
];

export class ActivityNavigationHelper {

  static navigateToCalendar(router: any) {
    router.navigate(['/family/calendar']);
  }

  static navigateToCreateActivity(router: any, date?: string, type?: string) {
    const queryParams: any = {};
    if (date) queryParams.date = date;
    if (type) queryParams.type = type;

    router.navigate(['/family/activities/create'], { queryParams });
  }

  static navigateToActivityDetail(router: any, activityId: number) {
    router.navigate(['/family/activities', activityId]);
  }

  static navigateToEditActivity(router: any, activityId: number) {
    router.navigate(['/family/activities', activityId, 'edit']);
  }

  static navigateToInviteToActivity(router: any, activityId: number) {
    router.navigate(['/family/activities', activityId, 'invite']);
  }

  static navigateToActivityList(router: any, filters?: any) {
    router.navigate(['/family/activities'], { queryParams: filters });
  }

  static navigateToCalendarDay(router: any, date: string) {
    router.navigate(['/family/calendar/day'], { queryParams: { date } });
  }

  static navigateToCalendarWeek(router: any, week: string) {
    router.navigate(['/family/calendar/week'], { queryParams: { week } });
  }
}

// Route data constants for activity types
export const ACTIVITY_ROUTE_DATA = {
  CREATE_EVENT: {
    title: 'Create Event',
    type: 'event',
    icon: 'calendar-outline'
  },
  CREATE_MILESTONE: {
    title: 'Add Milestone',
    type: 'milestone',
    icon: 'trophy-outline'
  },
  CREATE_ACHIEVEMENT: {
    title: 'Record Achievement',
    type: 'achievement',
    icon: 'medal-outline'
  },
  CREATE_MEMORY: {
    title: 'Save Memory',
    type: 'memory',
    icon: 'heart-outline'
  },
  CREATE_ANNOUNCEMENT: {
    title: 'Make Announcement',
    type: 'announcement',
    icon: 'megaphone-outline'
  }
};
