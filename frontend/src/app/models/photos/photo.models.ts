export enum AlbumPrivacyEnum {
  FAMILY = 'family',
  SPECIFIC_MEMBERS = 'specific_members',
  PUBLIC = 'public',
  PRIVATE = 'private'
}

export interface PhotoAlbum {
  id: number;
  familyId: number;
  createdBy: number;
  name: string;
  description?: string;
  coverPhoto?: string;
  privacy: AlbumPrivacyEnum;
  allowedMembers?: number[];
  allowDownload: boolean;
  allowComments: boolean;
  photoCount: number;
  videoCount: number;
  totalSize: number;
  lastUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  creator?: any;
  photos?: Photo[];
  recentPhotos?: Photo[];
}

export interface Photo {
  id: number;
  albumId: number;
  uploadedBy: number;
  filename: string;
  originalName: string;
  mimeType: string;
  path: string;
  thumbnailPath?: string;
  size: number;
  width?: number;
  height?: number;
  metadata?: any;
  description?: string;
  tags?: string[];
  peopleTagged?: number[];
  location?: string;
  takenAt?: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  uploader?: any;
  comments?: PhotoComment[];
  likes?: PhotoLike[];
  album?: PhotoAlbum;

  // UI state
  isSelected?: boolean;
  isLoading?: boolean;
}

export interface PhotoComment {
  id: number;
  photoId: number;
  userId: number;
  parentId?: number;
  comment: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  user?: any;
  replies?: PhotoComment[];
}

export interface PhotoLike {
  id: number;
  photoId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  user?: any;
}

export interface CreateAlbumRequest {
  name: string;
  description?: string;
  privacy: AlbumPrivacyEnum;
  allowedMembers?: number[];
  allowDownload?: boolean;
  allowComments?: boolean;
}

export interface UpdateAlbumRequest {
  name?: string;
  description?: string;
  privacy?: AlbumPrivacyEnum;
  allowedMembers?: number[];
  allowDownload?: boolean;
  allowComments?: boolean;
}

export interface UploadPhotoRequest {
  files: FileList;
  description?: string;
  tags?: string[];
  peopleTagged?: number[];
  location?: string;
  takenAt?: string;
}

export interface UpdatePhotoRequest {
  description?: string;
  tags?: string[];
  peopleTagged?: number[];
  location?: string;
  takenAt?: string;
  isFavorite?: boolean;
}

// Utility functions
export function getAlbumPrivacyLabel(privacy: AlbumPrivacyEnum): string {
  switch (privacy) {
    case AlbumPrivacyEnum.FAMILY:
      return 'Family Only';
    case AlbumPrivacyEnum.SPECIFIC_MEMBERS:
      return 'Specific Members';
    case AlbumPrivacyEnum.PUBLIC:
      return 'Public';
    case AlbumPrivacyEnum.PRIVATE:
      return 'Private';
    default:
      return 'Unknown';
  }
}

export function getAlbumPrivacyIcon(privacy: AlbumPrivacyEnum): string {
  switch (privacy) {
    case AlbumPrivacyEnum.FAMILY:
      return 'home-outline';
    case AlbumPrivacyEnum.SPECIFIC_MEMBERS:
      return 'people-outline';
    case AlbumPrivacyEnum.PUBLIC:
      return 'globe-outline';
    case AlbumPrivacyEnum.PRIVATE:
      return 'lock-closed-outline';
    default:
      return 'help-outline';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getImageDimensions(file: File): Promise<{width: number, height: number}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

export function getMediaIcon(mimeType: string): string {
  if (isImageFile(mimeType)) return 'image-outline';
  if (isVideoFile(mimeType)) return 'videocam-outline';
  return 'document-outline';
}
