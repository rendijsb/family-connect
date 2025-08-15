export enum ActivityTypeEnum {
  EVENT = 'event',
  MILESTONE = 'milestone',
  ACHIEVEMENT = 'achievement',
  MEMORY = 'memory',
  ANNOUNCEMENT = 'announcement'
}

export enum ActivityStatusEnum {
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum AttendeeStatusEnum {
  INVITED = 'invited',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  MAYBE = 'maybe',
  NO_RESPONSE = 'no_response'
}

export interface ActivityAttendee {
  userId: number;
  memberName: string;
  avatar?: string;
  status: AttendeeStatusEnum;
  response?: string;
  respondedAt?: string;
  invitedAt: string;
  invitedBy: number;
}

export interface ActivityMetadata {
  // Event specific
  reminder?: {
    enabled: boolean;
    time: number; // minutes before
  };
  recurring?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };

  // Achievement/Milestone specific
  category?: string;
  points?: number;
  badge?: string;

  // Memory specific
  photos?: string[];
  tags?: string[];

  // General
  color?: string;
  priority?: 'low' | 'medium' | 'high';
  visibility?: 'all' | 'adults_only' | 'custom';
  allowInvites?: boolean;
  maxAttendees?: number;
}

export interface FamilyActivity {
  id: number;
  familyId: number;
  createdBy: number;
  title: string;
  description?: string;
  type: ActivityTypeEnum;
  status: ActivityStatusEnum;
  activityDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  attendees: ActivityAttendee[];
  metadata?: ActivityMetadata;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  family?: {
    id: number;
    name: string;
  };
  creator?: {
    id: number;
    name: string;
    avatar?: string;
  };

  // Computed properties
  isAllDay?: boolean;
  duration?: number; // in minutes
  canEdit?: boolean;
  canDelete?: boolean;
  attendeeCount?: number;
  acceptedCount?: number;
  declinedCount?: number;
  hasResponded?: boolean;
  currentUserStatus?: AttendeeStatusEnum;
}

export interface CreateActivityRequest {
  title: string;
  description?: string;
  type: ActivityTypeEnum;
  activityDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  attendeeIds?: number[];
  metadata?: Partial<ActivityMetadata>;
  isPrivate?: boolean;
}

export interface UpdateActivityRequest {
  title?: string;
  description?: string;
  type?: ActivityTypeEnum;
  status?: ActivityStatusEnum;
  activityDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  metadata?: Partial<ActivityMetadata>;
  isPrivate?: boolean;
}

export interface UpdateAttendeeRequest {
  status: AttendeeStatusEnum;
  response?: string;
}

export interface InviteAttendeesRequest {
  userIds: number[];
  message?: string;
}

export interface ActivityResponse {
  success: boolean;
  data: FamilyActivity;
  message?: string;
}

export interface ActivityListResponse {
  success: boolean;
  data: FamilyActivity[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end?: string;
  color: string;
  activity: FamilyActivity;
  allDay: boolean;
  textColor?: string;
  borderColor?: string;
}

export interface ActivityFilters {
  types?: ActivityTypeEnum[];
  status?: ActivityStatusEnum[];
  dateFrom?: string;
  dateTo?: string;
  createdBy?: number;
  location?: string;
  attendeeStatus?: AttendeeStatusEnum;
  page?: number;
  limit?: number;
}

export interface ActivityStats {
  totalActivities: number;
  upcomingEvents: number;
  completedActivities: number;
  myAttendance: number;
  averageAttendance: number;
  popularActivityType: ActivityTypeEnum;
  thisMonthEvents: number;
  nextWeekEvents: number;
}

export const DEFAULT_ACTIVITY_METADATA: ActivityMetadata = {
  reminder: {
    enabled: true,
    time: 60
  },
  recurring: {
    enabled: false,
    frequency: 'weekly',
    interval: 1
  },
  color: '#3b82f6',
  priority: 'medium',
  visibility: 'all',
  allowInvites: true
};

export type ActivityFormValue = {
  title: string;
  description: string;
  type: ActivityTypeEnum;
  status: ActivityStatusEnum;
  activityDate: string;
  startTime: string;
  endTime: string;
  location: string;
  isPrivate: boolean;
  enableReminder: boolean;
  reminderTime: number;
  allowInvites: boolean;
  maxAttendees: number | null;
};

export const ACTIVITY_TYPE_CONFIG = {
  [ActivityTypeEnum.EVENT]: {
    icon: 'calendar-outline',
    color: '#3b82f6',
    label: 'Event',
    description: 'Scheduled family events and gatherings'
  },
  [ActivityTypeEnum.MILESTONE]: {
    icon: 'trophy-outline',
    color: '#f59e0b',
    label: 'Milestone',
    description: 'Important family milestones and achievements'
  },
  [ActivityTypeEnum.ACHIEVEMENT]: {
    icon: 'medal-outline',
    color: '#10b981',
    label: 'Achievement',
    description: 'Personal and family accomplishments'
  },
  [ActivityTypeEnum.MEMORY]: {
    icon: 'heart-outline',
    color: '#ec4899',
    label: 'Memory',
    description: 'Special memories and moments to remember'
  },
  [ActivityTypeEnum.ANNOUNCEMENT]: {
    icon: 'megaphone-outline',
    color: '#8b5cf6',
    label: 'Announcement',
    description: 'Important family announcements and news'
  }
};

export const ACTIVITY_STATUS_CONFIG = {
  [ActivityStatusEnum.PLANNED]: {
    color: '#6b7280',
    label: 'Planned',
    icon: 'time-outline'
  },
  [ActivityStatusEnum.ACTIVE]: {
    color: '#3b82f6',
    label: 'Active',
    icon: 'play-circle-outline'
  },
  [ActivityStatusEnum.COMPLETED]: {
    color: '#10b981',
    label: 'Completed',
    icon: 'checkmark-circle-outline'
  },
  [ActivityStatusEnum.CANCELLED]: {
    color: '#ef4444',
    label: 'Cancelled',
    icon: 'close-circle-outline'
  }
};

export const ATTENDEE_STATUS_CONFIG = {
  [AttendeeStatusEnum.INVITED]: {
    color: '#6b7280',
    label: 'Invited',
    icon: 'mail-outline'
  },
  [AttendeeStatusEnum.ACCEPTED]: {
    color: '#10b981',
    label: 'Going',
    icon: 'checkmark-circle-outline'
  },
  [AttendeeStatusEnum.DECLINED]: {
    color: '#ef4444',
    label: 'Not Going',
    icon: 'close-circle-outline'
  },
  [AttendeeStatusEnum.MAYBE]: {
    color: '#f59e0b',
    label: 'Maybe',
    icon: 'help-circle-outline'
  },
  [AttendeeStatusEnum.NO_RESPONSE]: {
    color: '#9ca3af',
    label: 'No Response',
    icon: 'time-outline'
  }
};


