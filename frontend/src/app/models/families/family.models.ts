// src/app/models/families/family.models.ts

export enum FamilyRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  CHILD = 'child'
}

export enum FamilyMemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  PENDING = 'pending'
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export enum ActivityType {
  FAMILY_CREATED = 'family_created',
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  MEMBER_INVITED = 'member_invited',
  SETTINGS_UPDATED = 'settings_updated',
  ROLE_CHANGED = 'role_changed',
  PHOTO_SHARED = 'photo_shared',
  EVENT_CREATED = 'event_created',
  MESSAGE_SENT = 'message_sent'
}

export interface Family {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  settings: FamilySettings;
  inviteCode: string;
  isActive: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relationships
  owner?: FamilyUser;
  members?: FamilyMember[];
  invitations?: FamilyInvitation[];
  activities?: FamilyActivity[];

  // Computed properties
  memberCount?: number;
  activeMemberCount?: number;
}

export interface FamilySettings {
  privacy: {
    isPublic: boolean;
    allowMemberInvites: boolean;
    requireApprovalForJoining: boolean;
  };
  features: {
    enableLocationSharing: boolean;
    enablePhotoSharing: boolean;
    enableEventPlanning: boolean;
    enableFamilyChat: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    digestFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
  };
  theme: {
    primaryColor: string;
    backgroundImage?: string;
  };
}

export interface FamilyMember {
  id: number;
  familyId: number;
  userId: number;
  role: FamilyRole;
  status: FamilyMemberStatus;
  joinedAt: string;
  lastActivityAt?: string;
  permissions: string[];
  preferences: MemberPreferences;
  createdAt: string;
  updatedAt: string;

  // Relationships
  user?: FamilyUser;
  family?: Family;
}

export interface MemberPreferences {
  nickname?: string;
  allowLocationTracking: boolean;
  allowPhotoTagging: boolean;
  notificationSettings: {
    mentions: boolean;
    events: boolean;
    photos: boolean;
    activities: boolean;
  };
}

export interface FamilyUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string;
  createdAt: string;
}

export interface FamilyInvitation {
  id: number;
  familyId: number;
  invitedBy: number;
  email: string;
  token: string;
  role: FamilyRole;
  status: InvitationStatus;
  expiresAt: string;
  sentAt: string;
  respondedAt?: string;
  invitationData?: InvitationData;
  createdAt: string;
  updatedAt: string;

  // Relationships
  family?: Family;
  inviter?: FamilyUser;
}

export interface InvitationData {
  personalMessage?: string;
  customRole?: string;
  additionalInfo?: Record<string, any>;
}

export interface FamilyActivity {
  id: number;
  familyId: number;
  userId: number;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;

  // Relationships
  family?: Family;
  user?: FamilyUser;
}

// Request/Response DTOs
export interface CreateFamilyRequest {
  name: string;
  description?: string;
  settings?: Partial<FamilySettings>;
}

export interface UpdateFamilyRequest {
  name?: string;
  description?: string;
  settings?: Partial<FamilySettings>;
  isActive?: boolean;
}

export interface InviteMemberRequest {
  email: string;
  role: FamilyRole;
  personalMessage?: string;
}

export interface UpdateMemberRoleRequest {
  role: FamilyRole;
  permissions?: string[];
}

export interface JoinFamilyByCodeRequest {
  inviteCode: string;
}

// API Response wrappers
export interface FamilyResponse {
  success: boolean;
  data: Family;
  message?: string;
}

export interface FamilyListResponse {
  success: boolean;
  data: Family[];
  message?: string;
  pagination?: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
}

export interface FamilyMemberResponse {
  success: boolean;
  data: FamilyMember;
  message?: string;
}

export interface FamilyMemberListResponse {
  success: boolean;
  data: FamilyMember[];
  message?: string;
}

export interface FamilyInvitationResponse {
  success: boolean;
  data: FamilyInvitation;
  message?: string;
}

export interface FamilyInvitationListResponse {
  success: boolean;
  data: FamilyInvitation[];
  message?: string;
}

export interface FamilyActivityListResponse {
  success: boolean;
  data: FamilyActivity[];
  message?: string;
}

// Utility types
export type FamilyPermissions =
  | 'manage_family'
  | 'invite_members'
  | 'remove_members'
  | 'manage_settings'
  | 'create_events'
  | 'upload_photos'
  | 'send_messages'
  | 'view_locations';

export interface FamilyStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvitations: number;
  recentActivities: number;
  photosShared: number;
  eventsPlanned: number;
}

export interface FamilyDashboardData {
  family: Family;
  stats: FamilyStats;
  recentActivities: FamilyActivity[];
  upcomingEvents: any[]; // Will be defined when events module is created
  recentPhotos: any[]; // Will be defined when photos module is created
}

// Form validation types
export interface CreateFamilyFormData {
  name: string;
  description: string;
  isPublic: boolean;
  allowMemberInvites: boolean;
  requireApproval: boolean;
}

export interface InviteMemberFormData {
  email: string;
  role: FamilyRole;
  personalMessage: string;
}

// Navigation/UI helpers
export interface FamilyNavigationItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  badge?: number;
  requiresPermission?: FamilyPermissions;
}
