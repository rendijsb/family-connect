// import {FamilyActivity} from './activities/activity.models';

export enum FamilyRoleEnum {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

export enum InvitationStatusEnum {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

export enum FamilyPrivacyLevelEnum {
  PUBLIC = 'public',
  PRIVATE = 'private',
  INVITE_ONLY = 'invite_only'
}

export interface Family {
  id: number;
  name: string;
  description?: string;
  avatar?: string;
  ownerId: number;
  privacyLevel: FamilyPrivacyLevelEnum;
  settings: FamilySettings;
  memberCount: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  owner?: FamilyMember;
  members?: FamilyMember[];
  invitations?: FamilyInvitation[];

  // Computed properties
  isOwner?: boolean;
  isAdmin?: boolean;
  canManage?: boolean;
}

export interface FamilyMember {
  id: number;
  familyId: number;
  userId: number;
  role: FamilyRoleEnum;
  nickname?: string;
  joinedAt: string;
  status: 'active' | 'inactive';
  permissions: FamilyMemberPermissions;
  lastActiveAt?: string;

  // User information
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
  };

  // Family information
  family?: Family;

  // Computed properties
  displayName: string;
  isOnline: boolean;
  canEdit: boolean;
  canRemove: boolean;
}

export interface FamilyInvitation {
  id: number;
  familyId: number;
  email: string;
  invitedBy: number;
  token: string;
  role: FamilyRoleEnum;
  message?: string;
  expiresAt: string;
  status: InvitationStatusEnum;
  createdAt: string;
  updatedAt: string;

  // Relations
  family?: Family;
  inviter?: FamilyMember;

  // Computed properties
  isExpired: boolean;
  isPending: boolean;
  canResend: boolean;
}

export interface FamilySettings {
  allowMemberInvites: boolean;
  requireApprovalForJoin: boolean;
  showMemberLocation: boolean;
  enableNotifications: boolean;
  allowPhotoSharing: boolean;
  allowEventCreation: boolean;
  maxMembers: number;
  timezone: string;
  language: string;
}

export interface FamilyMemberPermissions {
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canEditFamilyInfo: boolean;
  canManageEvents: boolean;
  canSharePhotos: boolean;
  canViewLocations: boolean;
  canModerateChat: boolean;
}

export interface FamilyStats {
  totalMembers: number;
  activeMembers: number;
  onlineMembers: number;
  photosShared: number;
  eventsPlanned: number;
  messagesExchanged: number;
  connectionStrength: number;
  lastActivity: string;
}

export interface FamilyActivity {
  id: number;
  familyId: number;
  userId: number;
  type: 'member_joined' | 'photo_shared' | 'event_created' | 'message_sent' | 'milestone_reached';
  title: string;
  description: string;
  metadata?: any;
  createdAt: string;

  // Relations
  user?: FamilyMember;
  family?: Family;

  // UI properties
  icon: string;
  color: string;
}

// DTOs for API requests
export interface CreateFamilyRequest {
  name: string;
  description?: string;
  privacyLevel: FamilyPrivacyLevelEnum;
  settings?: Partial<FamilySettings>;
}

export interface UpdateFamilyRequest {
  name?: string;
  description?: string;
  privacyLevel?: FamilyPrivacyLevelEnum;
  settings?: Partial<FamilySettings>;
}

export interface InviteMemberRequest {
  email: string;
  role: FamilyRoleEnum;
  message?: string;
}

export interface UpdateMemberRequest {
  role?: FamilyRoleEnum;
  nickname?: string;
  permissions?: Partial<FamilyMemberPermissions>;
}

export interface JoinFamilyRequest {
  token: string;
  nickname?: string;
}

// Response types
export interface FamilyResponse {
  success: boolean;
  data: Family;
  message?: string;
}

export interface FamilyListResponse {
  success: boolean;
  data: Family[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
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
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface InvitationResponse {
  success: boolean;
  data: FamilyInvitation;
  message?: string;
}

export interface InvitationListResponse {
  success: boolean;
  data: FamilyInvitation[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface FamilyStatsResponse {
  success: boolean;
  data: FamilyStats;
}

export interface FamilyActivityResponse {
  success: boolean;
  data: FamilyActivity[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Default values
export const DEFAULT_FAMILY_SETTINGS: FamilySettings = {
  allowMemberInvites: true,
  requireApprovalForJoin: false,
  showMemberLocation: true,
  enableNotifications: true,
  allowPhotoSharing: true,
  allowEventCreation: true,
  maxMembers: 20,
  timezone: 'UTC',
  language: 'en'
};

export const DEFAULT_MEMBER_PERMISSIONS: FamilyMemberPermissions = {
  canInviteMembers: false,
  canRemoveMembers: false,
  canEditFamilyInfo: false,
  canManageEvents: true,
  canSharePhotos: true,
  canViewLocations: true,
  canModerateChat: false
};

export const ADMIN_MEMBER_PERMISSIONS: FamilyMemberPermissions = {
  canInviteMembers: true,
  canRemoveMembers: true,
  canEditFamilyInfo: true,
  canManageEvents: true,
  canSharePhotos: true,
  canViewLocations: true,
  canModerateChat: true
};

export const OWNER_MEMBER_PERMISSIONS: FamilyMemberPermissions = {
  canInviteMembers: true,
  canRemoveMembers: true,
  canEditFamilyInfo: true,
  canManageEvents: true,
  canSharePhotos: true,
  canViewLocations: true,
  canModerateChat: true
};
