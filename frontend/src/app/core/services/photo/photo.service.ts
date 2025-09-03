import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, finalize } from 'rxjs';
import { ApiUrlService } from '../api.service';
import {
  PhotoAlbum,
  Photo,
  PhotoComment,
  CreateAlbumRequest,
  UpdateAlbumRequest,
  UploadPhotoRequest,
  UpdatePhotoRequest,
} from '../../../models/photos/photo.models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  // State management
  private readonly _albums = new BehaviorSubject<PhotoAlbum[]>([]);
  private readonly _currentAlbum = new BehaviorSubject<PhotoAlbum | null>(null);
  private readonly _albumPhotos = new BehaviorSubject<Photo[]>([]);
  private readonly _selectedPhotos = signal<Photo[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _isUploading = signal<boolean>(false);
  private readonly _uploadProgress = signal<number>(0);

  // Public readonly observables
  readonly albums$ = this._albums.asObservable();
  readonly currentAlbum$ = this._currentAlbum.asObservable();
  readonly albumPhotos$ = this._albumPhotos.asObservable();
  readonly selectedPhotos = this._selectedPhotos.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isUploading = this._isUploading.asReadonly();
  readonly uploadProgress = this._uploadProgress.asReadonly();

  // Computed properties
  readonly selectedCount = computed(() => this._selectedPhotos().length);
  readonly hasSelection = computed(() => this._selectedPhotos().length > 0);
  readonly totalPhotosCount = computed(() =>
    this._albums().reduce((total, album) => total + album.photoCount, 0)
  );

  // Album Management
  getAlbums(familySlug: string): Observable<ApiResponse<PhotoAlbum[]>> {
    this._isLoading.set(true);

    return this.http
      .get<ApiResponse<PhotoAlbum[]>>(
        this.apiUrlService.getUrl(`families/${familySlug}/albums`)
      )
      .pipe(
        tap((response) => {
          this._albums.next(response.data);
        }),
        finalize(() => this._isLoading.set(false))
      );
  }

  getAlbum(familySlug: string, albumId: number): Observable<ApiResponse<PhotoAlbum>> {
    this._isLoading.set(true);

    return this.http
      .get<ApiResponse<PhotoAlbum>>(
        this.apiUrlService.getUrl(`families/${familySlug}/albums/${albumId}`)
      )
      .pipe(
        tap((response) => {
          this._currentAlbum.next(response.data);
          this.updateAlbumInList(response.data);
        }),
        finalize(() => this._isLoading.set(false))
      );
  }

  createAlbum(
    familySlug: string,
    request: CreateAlbumRequest
  ): Observable<ApiResponse<PhotoAlbum>> {
    this._isLoading.set(true);

    return this.http
      .post<ApiResponse<PhotoAlbum>>(
        this.apiUrlService.getUrl(`families/${familySlug}/albums`),
        request
      )
      .pipe(
        tap((response) => {
          const currentAlbums = this._albums.value;
          this._albums.next([response.data, ...currentAlbums]);
        }),
        finalize(() => this._isLoading.set(false))
      );
  }

  updateAlbum(
    familySlug: string,
    albumId: number,
    request: UpdateAlbumRequest
  ): Observable<ApiResponse<PhotoAlbum>> {
    this._isLoading.set(true);

    return this.http
      .put<ApiResponse<PhotoAlbum>>(
        this.apiUrlService.getUrl(`families/${familySlug}/albums/${albumId}`),
        request
      )
      .pipe(
        tap((response) => {
          this.updateAlbumInList(response.data);
          if (this._currentAlbum.value?.id === albumId) {
            this._currentAlbum.next(response.data);
          }
        }),
        finalize(() => this._isLoading.set(false))
      );
  }

  deleteAlbum(familySlug: string, albumId: number): Observable<ApiResponse<void>> {
    this._isLoading.set(true);

    return this.http
      .delete<ApiResponse<void>>(
        this.apiUrlService.getUrl(`families/${familySlug}/albums/${albumId}`)
      )
      .pipe(
        tap(() => {
          const currentAlbums = this._albums.value;
          this._albums.next(currentAlbums.filter(album => album.id !== albumId));
          if (this._currentAlbum.value?.id === albumId) {
            this._currentAlbum.next(null);
          }
        }),
        finalize(() => this._isLoading.set(false))
      );
  }

  // Photo Management
  getPhotos(
    familySlug: string,
    albumId: number,
    page: number = 1,
    perPage: number = 50
  ): Observable<ApiResponse<PaginatedResponse<Photo>>> {
    this._isLoading.set(true);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http
      .get<ApiResponse<PaginatedResponse<Photo>>>(
        this.apiUrlService.getUrl(`families/${familySlug}/albums/${albumId}/photos`),
        { params }
      )
      .pipe(
        tap((response) => {
          if (page === 1) {
            this._albumPhotos.next(response.data.data);
          } else {
            const currentPhotos = this._albumPhotos.value;
            this._albumPhotos.next([...currentPhotos, ...response.data.data]);
          }
        }),
        finalize(() => this._isLoading.set(false))
      );
  }

  getPhoto(familySlug: string, photoId: number): Observable<ApiResponse<Photo>> {
    return this.http.get<ApiResponse<Photo>>(
      this.apiUrlService.getUrl(`families/${familySlug}/photos/${photoId}`)
    );
  }

  uploadPhotos(
    familySlug: string,
    albumId: number,
    files: FileList,
    metadata?: Partial<UpdatePhotoRequest>
  ): Observable<ApiResponse<Photo[]>> {
    this._isUploading.set(true);
    this._uploadProgress.set(0);

    const formData = new FormData();

    // Add files
    Array.from(files).forEach((file, index) => {
      formData.append(`photos[${index}]`, file, file.name);
    });

    // Add metadata if provided
    if (metadata?.description) {
      formData.append('description', metadata.description);
    }
    if (metadata?.tags && metadata.tags.length > 0) {
      formData.append('tags', JSON.stringify(metadata.tags));
    }
    if (metadata?.peopleTagged && metadata.peopleTagged.length > 0) {
      formData.append('people_tagged', JSON.stringify(metadata.peopleTagged));
    }
    if (metadata?.location) {
      formData.append('location', metadata.location);
    }
    if (metadata?.takenAt) {
      formData.append('taken_at', metadata.takenAt);
    }

    return this.http
      .post<ApiResponse<Photo[]>>(
        this.apiUrlService.getUrl(`families/${familySlug}/albums/${albumId}/photos`),
        formData,
        {
          reportProgress: true,
          observe: 'events'
        }
      )
      .pipe(
        tap((event: any) => {
          if (event.type === 1 && event.loaded && event.total) {
            const progress = Math.round((event.loaded / event.total) * 100);
            this._uploadProgress.set(progress);
          } else if (event.type === 4 && event.body) {
            // Upload complete
            const currentPhotos = this._albumPhotos.value;
            this._albumPhotos.next([...event.body.data, ...currentPhotos]);

            // Update album photo count
            this.incrementAlbumPhotoCount(albumId, event.body.data.length);
          }
        }),
        finalize(() => {
          this._isUploading.set(false);
          this._uploadProgress.set(0);
        })
      ) as Observable<ApiResponse<Photo[]>>;
  }

  bulkUploadPhotos(
    familySlug: string,
    albumId: number,
    files: FileList,
    metadata?: Partial<UpdatePhotoRequest>
  ): Observable<ApiResponse<Photo[]>> {
    return this.uploadPhotos(familySlug, albumId, files, metadata);
  }

  updatePhoto(
    familySlug: string,
    photoId: number,
    request: UpdatePhotoRequest
  ): Observable<ApiResponse<Photo>> {
    return this.http
      .put<ApiResponse<Photo>>(
        this.apiUrlService.getUrl(`families/${familySlug}/photos/${photoId}`),
        request
      )
      .pipe(
        tap((response) => {
          this.updatePhotoInList(response.data);
        })
      );
  }

  deletePhoto(familySlug: string, photoId: number): Observable<ApiResponse<void>> {
    return this.http
      .delete<ApiResponse<void>>(
        this.apiUrlService.getUrl(`families/${familySlug}/photos/${photoId}`)
      )
      .pipe(
        tap(() => {
          const currentPhotos = this._albumPhotos.value;
          const photoToRemove = currentPhotos.find(p => p.id === photoId);

          this._albumPhotos.next(currentPhotos.filter(photo => photo.id !== photoId));

          // Update album photo count
          if (photoToRemove) {
            this.decrementAlbumPhotoCount(photoToRemove.albumId);
          }

          // Remove from selection if selected
          const selectedPhotos = this._selectedPhotos();
          this._selectedPhotos.set(selectedPhotos.filter(p => p.id !== photoId));
        })
      );
  }

  // Photo Interactions
  likePhoto(familySlug: string, photoId: number): Observable<ApiResponse<void>> {
    return this.http
      .post<ApiResponse<void>>(
        this.apiUrlService.getUrl(`families/${familySlug}/photos/${photoId}/like`),
        {}
      )
      .pipe(
        tap(() => {
          this.updatePhotoLikeCount(photoId, 1);
        })
      );
  }

  unlikePhoto(familySlug: string, photoId: number): Observable<ApiResponse<void>> {
    return this.http
      .delete<ApiResponse<void>>(
        this.apiUrlService.getUrl(`families/${familySlug}/photos/${photoId}/like`)
      )
      .pipe(
        tap(() => {
          this.updatePhotoLikeCount(photoId, -1);
        })
      );
  }

  // Comments
  getPhotoComments(
    familySlug: string,
    photoId: number
  ): Observable<ApiResponse<PhotoComment[]>> {
    return this.http.get<ApiResponse<PhotoComment[]>>(
      this.apiUrlService.getUrl(`families/${familySlug}/photos/${photoId}/comments`)
    );
  }

  addPhotoComment(
    familySlug: string,
    photoId: number,
    comment: string,
    parentId?: number
  ): Observable<ApiResponse<PhotoComment>> {
    return this.http
      .post<ApiResponse<PhotoComment>>(
        this.apiUrlService.getUrl(`families/${familySlug}/photos/${photoId}/comments`),
        { comment, parent_id: parentId }
      )
      .pipe(
        tap(() => {
          this.updatePhotoCommentCount(photoId, 1);
        })
      );
  }

  updateComment(
    familySlug: string,
    commentId: number,
    comment: string
  ): Observable<ApiResponse<PhotoComment>> {
    return this.http.put<ApiResponse<PhotoComment>>(
      this.apiUrlService.getUrl(`families/${familySlug}/comments/${commentId}`),
      { comment }
    );
  }

  deleteComment(
    familySlug: string,
    commentId: number,
    photoId: number
  ): Observable<ApiResponse<void>> {
    return this.http
      .delete<ApiResponse<void>>(
        this.apiUrlService.getUrl(`families/${familySlug}/comments/${commentId}`)
      )
      .pipe(
        tap(() => {
          this.updatePhotoCommentCount(photoId, -1);
        })
      );
  }

  // Selection Management
  togglePhotoSelection(photo: Photo): void {
    const currentSelection = this._selectedPhotos();
    const isSelected = currentSelection.some(p => p.id === photo.id);

    if (isSelected) {
      this._selectedPhotos.set(currentSelection.filter(p => p.id !== photo.id));
    } else {
      this._selectedPhotos.set([...currentSelection, photo]);
    }
  }

  selectAllPhotos(): void {
    this._selectedPhotos.set([...this._albumPhotos.value]);
  }

  deselectAllPhotos(): void {
    this._selectedPhotos.set([]);
  }

  isPhotoSelected(photoId: number): boolean {
    return this._selectedPhotos().some(p => p.id === photoId);
  }

  deleteSelectedPhotos(familySlug: string): Observable<void> {
    const selectedIds = this._selectedPhotos().map(p => p.id);

    const deleteRequests = selectedIds.map(id =>
      this.deletePhoto(familySlug, id).toPromise()
    );

    return new Promise<void>(async (resolve, reject) => {
      try {
        await Promise.all(deleteRequests);
        this._selectedPhotos.set([]);
        resolve();
      } catch (error) {
        reject(error);
      }
    }) as any;
  }

  // Utility methods
  private updateAlbumInList(album: PhotoAlbum): void {
    const currentAlbums = this._albums.value;
    const index = currentAlbums.findIndex(a => a.id === album.id);
    if (index !== -1) {
      const updatedAlbums = [...currentAlbums];
      updatedAlbums[index] = album;
      this._albums.next(updatedAlbums);
    }
  }

  private updatePhotoInList(photo: Photo): void {
    const currentPhotos = this._albumPhotos.value;
    const index = currentPhotos.findIndex(p => p.id === photo.id);
    if (index !== -1) {
      const updatedPhotos = [...currentPhotos];
      updatedPhotos[index] = photo;
      this._albumPhotos.next(updatedPhotos);
    }
  }

  private updatePhotoLikeCount(photoId: number, increment: number): void {
    const currentPhotos = this._albumPhotos.value;
    const index = currentPhotos.findIndex(p => p.id === photoId);
    if (index !== -1) {
      const updatedPhotos = [...currentPhotos];
      updatedPhotos[index] = {
        ...updatedPhotos[index],
        likesCount: Math.max(0, updatedPhotos[index].likesCount + increment)
      };
      this._albumPhotos.next(updatedPhotos);
    }
  }

  private updatePhotoCommentCount(photoId: number, increment: number): void {
    const currentPhotos = this._albumPhotos.value;
    const index = currentPhotos.findIndex(p => p.id === photoId);
    if (index !== -1) {
      const updatedPhotos = [...currentPhotos];
      updatedPhotos[index] = {
        ...updatedPhotos[index],
        commentsCount: Math.max(0, updatedPhotos[index].commentsCount + increment)
      };
      this._albumPhotos.next(updatedPhotos);
    }
  }

  private incrementAlbumPhotoCount(albumId: number, count: number): void {
    const currentAlbums = this._albums.value;
    const index = currentAlbums.findIndex(a => a.id === albumId);
    if (index !== -1) {
      const updatedAlbums = [...currentAlbums];
      updatedAlbums[index] = {
        ...updatedAlbums[index],
        photoCount: updatedAlbums[index].photoCount + count
      };
      this._albums.next(updatedAlbums);
    }
  }

  private decrementAlbumPhotoCount(albumId: number): void {
    this.incrementAlbumPhotoCount(albumId, -1);
  }

  // Clean up
  clearState(): void {
    this._albums.next([]);
    this._currentAlbum.next(null);
    this._albumPhotos.next([]);
    this._selectedPhotos.set([]);
  }

  // Getters for current state
  getCurrentAlbums(): PhotoAlbum[] {
    return this._albums.value;
  }

  getCurrentAlbum(): PhotoAlbum | null {
    return this._currentAlbum.value;
  }

  getCurrentPhotos(): Photo[] {
    return this._albumPhotos.value;
  }
}
