import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonFab,
  IonFabButton,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
  IonChip,
  IonSkeletonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonActionSheet,
  IonAlert,
  IonToast,
  ModalController,
  ActionSheetController,
  AlertController,
  ToastController,
  InfiniteScrollCustomEvent
} from '@ionic/angular/standalone';
import { PhotoService } from '../../core/services/photo/photo.service';
import { PhotoAlbum, Photo, formatFileSize, getAlbumPrivacyIcon } from '../../models/photos/photo.models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface SelectionMode {
  isActive: boolean;
  selectedPhotos: Photo[];
}

@Component({
  selector: 'app-album-detail',
  templateUrl: './album-detail.page.html',
  styleUrls: ['./album-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonFab,
    IonFabButton,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonSearchbar,
    IonChip,
    IonSkeletonText,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonActionSheet,
    IonAlert,
    IonToast
  ]
})
export class AlbumDetailPage implements OnInit, OnDestroy {
  @ViewChild(IonInfiniteScroll, { static: false }) infiniteScroll!: IonInfiniteScroll;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly photoService = inject(PhotoService);
  private readonly modalController = inject(ModalController);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly destroy$ = new Subject<void>();

  familySlug: string = '';
  albumId: number = 0;
  album: PhotoAlbum | null = null;
  photos: Photo[] = [];
  isLoading = false;
  isLoadingMore = false;
  currentPage = 1;
  hasMorePages = true;
  
  viewMode: 'grid' | 'masonry' = 'grid';
  sortBy = 'recent';
  selectedFilter = 'all';

  selectionMode: SelectionMode = {
    isActive: false,
    selectedPhotos: []
  };

  sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'likes', label: 'Most Liked' }
  ];

  filterOptions = [
    { value: 'all', label: 'All Media', icon: 'apps-outline' },
    { value: 'images', label: 'Images Only', icon: 'image-outline' },
    { value: 'videos', label: 'Videos Only', icon: 'videocam-outline' },
    { value: 'favorites', label: 'Favorites', icon: 'heart-outline' }
  ];

  ngOnInit() {
    this.familySlug = this.route.snapshot.params['slug'];
    this.albumId = parseInt(this.route.snapshot.params['albumId']);
    
    this.setupPhotoServiceSubscriptions();
    this.loadAlbumDetails();
    this.loadPhotos(true);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPhotoServiceSubscriptions() {
    this.photoService.currentAlbum$
      .pipe(takeUntil(this.destroy$))
      .subscribe(album => {
        this.album = album;
      });

    this.photoService.albumPhotos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(photos => {
        this.photos = photos;
      });

    this.photoService.isLoading
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoading => {
        this.isLoading = isLoading;
      });
  }

  private loadAlbumDetails() {
    this.photoService.getAlbum(this.familySlug, this.albumId).subscribe({
      error: (error) => {
        console.error('Error loading album:', error);
        this.showToast('Error loading album details', 'danger');
      }
    });
  }

  private loadPhotos(reset: boolean = false) {
    if (reset) {
      this.currentPage = 1;
      this.hasMorePages = true;
    }

    this.photoService.getPhotos(this.familySlug, this.albumId, this.currentPage).subscribe({
      next: (response) => {
        if (response.success) {
          this.hasMorePages = response.data.current_page < response.data.last_page;
          this.currentPage = response.data.current_page + 1;
        }
      },
      error: (error) => {
        console.error('Error loading photos:', error);
        this.showToast('Error loading photos', 'danger');
      }
    });
  }

  onInfiniteScroll(event: InfiniteScrollCustomEvent) {
    if (this.hasMorePages && !this.isLoading) {
      this.isLoadingMore = true;
      
      this.photoService.getPhotos(this.familySlug, this.albumId, this.currentPage).subscribe({
        next: (response) => {
          if (response.success) {
            this.hasMorePages = response.data.current_page < response.data.last_page;
            this.currentPage = response.data.current_page + 1;
          }
          this.isLoadingMore = false;
          event.target.complete();
        },
        error: (error) => {
          console.error('Error loading more photos:', error);
          this.isLoadingMore = false;
          event.target.complete();
        }
      });
    } else {
      event.target.complete();
    }
  }

  async openPhotoViewer(photo: Photo, photos: Photo[]) {
    const { PhotoViewerModal } = await import('../photo-viewer-modal/photo-viewer-modal.component');
    
    const modal = await this.modalController.create({
      component: PhotoViewerModal,
      componentProps: {
        photo: photo,
        photos: photos,
        familySlug: this.familySlug,
        albumId: this.albumId
      }
    });

    await modal.present();
  }

  async openUploadModal() {
    const { PhotoUploadModal } = await import('../photo-upload-modal/photo-upload-modal.component');
    
    const modal = await this.modalController.create({
      component: PhotoUploadModal,
      componentProps: {
        familySlug: this.familySlug,
        albumId: this.albumId,
        albumName: this.album?.name
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.uploaded) {
      this.showToast(`${data.count} photos uploaded successfully`, 'success');
    }
  }

  toggleSelectionMode() {
    this.selectionMode.isActive = !this.selectionMode.isActive;
    if (!this.selectionMode.isActive) {
      this.selectionMode.selectedPhotos = [];
    }
  }

  togglePhotoSelection(photo: Photo) {
    if (!this.selectionMode.isActive) return;

    const index = this.selectionMode.selectedPhotos.findIndex(p => p.id === photo.id);
    if (index > -1) {
      this.selectionMode.selectedPhotos.splice(index, 1);
    } else {
      this.selectionMode.selectedPhotos.push(photo);
    }
  }

  selectAllPhotos() {
    this.selectionMode.selectedPhotos = [...this.photos];
  }

  deselectAllPhotos() {
    this.selectionMode.selectedPhotos = [];
  }

  isPhotoSelected(photo: Photo): boolean {
    return this.selectionMode.selectedPhotos.some(p => p.id === photo.id);
  }

  async showBulkActions() {
    const actionSheet = await this.actionSheetController.create({
      header: `${this.selectionMode.selectedPhotos.length} photos selected`,
      buttons: [
        {
          text: 'Download All',
          icon: 'download-outline',
          handler: () => this.downloadSelectedPhotos()
        },
        {
          text: 'Add to Favorites',
          icon: 'heart-outline',
          handler: () => this.toggleFavoriteForSelected(true)
        },
        {
          text: 'Remove from Favorites',
          icon: 'heart-dislike-outline',
          handler: () => this.toggleFavoriteForSelected(false)
        },
        {
          text: 'Delete Photos',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.confirmDeleteSelected()
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  private async confirmDeleteSelected() {
    const alert = await this.alertController.create({
      header: 'Delete Photos',
      message: `Are you sure you want to delete ${this.selectionMode.selectedPhotos.length} selected photos? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.deleteSelectedPhotos()
        }
      ]
    });

    await alert.present();
  }

  private deleteSelectedPhotos() {
    const selectedIds = this.selectionMode.selectedPhotos.map(p => p.id);
    
    // Delete photos one by one (could be optimized with bulk delete endpoint)
    const deletePromises = selectedIds.map(id => 
      this.photoService.deletePhoto(this.familySlug, id).toPromise()
    );

    Promise.all(deletePromises).then(() => {
      this.showToast(`${selectedIds.length} photos deleted`, 'success');
      this.selectionMode.isActive = false;
      this.selectionMode.selectedPhotos = [];
    }).catch(error => {
      console.error('Error deleting photos:', error);
      this.showToast('Error deleting photos', 'danger');
    });
  }

  private downloadSelectedPhotos() {
    // Implementation for downloading photos
    this.showToast('Download started', 'success');
    this.selectionMode.isActive = false;
    this.selectionMode.selectedPhotos = [];
  }

  private toggleFavoriteForSelected(favorite: boolean) {
    // Implementation for bulk favorite toggle
    const action = favorite ? 'added to' : 'removed from';
    this.showToast(`Photos ${action} favorites`, 'success');
    this.selectionMode.isActive = false;
    this.selectionMode.selectedPhotos = [];
  }

  onViewModeChange(event: any) {
    this.viewMode = event.detail.value;
  }

  onSortChange(event: any) {
    this.sortBy = event.detail.value;
    // Implement sorting logic here
  }

  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    // Implement filtering logic here
  }

  getAlbumPrivacyIcon(privacy: any): string {
    return getAlbumPrivacyIcon(privacy);
  }

  formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  trackByPhotoId(index: number, photo: Photo): number {
    return photo.id;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  getSkeletonItems(): number[] {
    return Array(12).fill(0).map((_, i) => i);
  }

  // Photo grid calculations for masonry layout
  getPhotoStyle(photo: Photo): any {
    if (this.viewMode === 'masonry' && photo.width && photo.height) {
      const aspectRatio = photo.height / photo.width;
      return {
        'grid-row-end': `span ${Math.ceil(aspectRatio * 10)}`
      };
    }
    return {};
  }
}