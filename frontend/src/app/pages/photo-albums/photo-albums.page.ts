import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonLabel,
  IonButton,
  IonFab,
  IonFabButton,
  IonItem,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
  IonChip,
  IonSkeletonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  ModalController,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { PhotoService } from '../../core/services/photo/photo.service';
import { PhotoAlbum, AlbumPrivacyEnum, getAlbumPrivacyIcon, formatFileSize } from '../../models/photos/photo.models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface SortOption {
  value: string;
  label: string;
}

interface FilterOption {
  value: AlbumPrivacyEnum | 'all';
  label: string;
  icon: string;
}

@Component({
  selector: 'app-photo-albums',
  templateUrl: './photo-albums.page.html',
  styleUrls: ['./photo-albums.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonIcon,
    IonLabel,
    IonButton,
    IonFab,
    IonFabButton,
    IonItem,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonSearchbar,
    IonChip,
    IonSkeletonText,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ]
})
export class PhotoAlbumsPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly photoService = inject(PhotoService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly destroy$ = new Subject<void>();

  familySlug: string = '';
  albums: PhotoAlbum[] = [];
  filteredAlbums: PhotoAlbum[] = [];
  isLoading = false;
  searchTerm = '';
  selectedSort: string = 'recent';
  selectedFilter: AlbumPrivacyEnum | 'all' = 'all';
  viewMode: 'grid' | 'list' = 'grid';

  sortOptions: SortOption[] = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'photos', label: 'Most Photos' }
  ];

  filterOptions: FilterOption[] = [
    { value: 'all', label: 'All Albums', icon: 'apps-outline' },
    { value: AlbumPrivacyEnum.FAMILY, label: 'Family', icon: 'home-outline' },
    { value: AlbumPrivacyEnum.SPECIFIC_MEMBERS, label: 'Specific Members', icon: 'people-outline' },
    { value: AlbumPrivacyEnum.PUBLIC, label: 'Public', icon: 'globe-outline' },
    { value: AlbumPrivacyEnum.PRIVATE, label: 'Private', icon: 'lock-closed-outline' }
  ];

  ngOnInit() {
    this.familySlug = this.route.snapshot.params['slug'];
    this.loadAlbums();
    this.setupPhotoServiceSubscription();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPhotoServiceSubscription() {
    this.photoService.albums$
      .pipe(takeUntil(this.destroy$))
      .subscribe(albums => {
        this.albums = albums;
        this.applyFiltersAndSort();
      });

    this.photoService.isLoading
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoading => {
        this.isLoading = isLoading;
      });
  }

  private loadAlbums() {
    this.photoService.getAlbums(this.familySlug).subscribe({
      next: (response) => {
        if (response.success) {
          // Albums are automatically updated via service subscription
        }
      },
      error: (error) => {
        console.error('Error loading albums:', error);
        this.showToast('Error loading albums', 'danger');
      }
    });
  }

  private applyFiltersAndSort() {
    let filtered = [...this.albums];

    // Apply privacy filter
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(album => album.privacy === this.selectedFilter);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(album => 
        album.name.toLowerCase().includes(term) ||
        album.description?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.selectedSort) {
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'photos':
          return b.photoCount - a.photoCount;
        default:
          return 0;
      }
    });

    this.filteredAlbums = filtered;
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.applyFiltersAndSort();
  }

  onSortChange(event: any) {
    this.selectedSort = event.detail.value;
    this.applyFiltersAndSort();
  }

  onFilterChange(value: AlbumPrivacyEnum | 'all') {
    this.selectedFilter = value;
    this.applyFiltersAndSort();
  }

  onViewModeChange(event: any) {
    this.viewMode = event.detail.value;
  }

  async openCreateAlbumModal() {
    const { CreateAlbumModal } = await import('../create-album-modal/create-album-modal.component');
    
    const modal = await this.modalController.create({
      component: CreateAlbumModal,
      componentProps: {
        familySlug: this.familySlug
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.created) {
      this.showToast('Album created successfully', 'success');
      this.loadAlbums();
    }
  }

  viewAlbum(album: PhotoAlbum) {
    this.router.navigate(['/family', this.familySlug, 'photos', album.id]);
  }

  async onAlbumOptionsClick(event: Event, album: PhotoAlbum) {
    event.stopPropagation();

    const alert = await this.alertController.create({
      header: album.name,
      buttons: [
        {
          text: 'Edit',
          handler: () => this.editAlbum(album)
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.confirmDeleteAlbum(album)
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  private async editAlbum(album: PhotoAlbum) {
    const { EditAlbumModal } = await import('../edit-album-modal/edit-album-modal.component');
    
    const modal = await this.modalController.create({
      component: EditAlbumModal,
      componentProps: {
        familySlug: this.familySlug,
        album: album
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.updated) {
      this.showToast('Album updated successfully', 'success');
    }
  }

  private async confirmDeleteAlbum(album: PhotoAlbum) {
    const alert = await this.alertController.create({
      header: 'Delete Album',
      message: `Are you sure you want to delete "${album.name}"? This will also delete all photos in this album.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.deleteAlbum(album)
        }
      ]
    });

    await alert.present();
  }

  private deleteAlbum(album: PhotoAlbum) {
    this.photoService.deleteAlbum(this.familySlug, album.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.showToast('Album deleted successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error deleting album:', error);
        this.showToast('Error deleting album', 'danger');
      }
    });
  }

  getAlbumPrivacyIcon(privacy: AlbumPrivacyEnum): string {
    return getAlbumPrivacyIcon(privacy);
  }

  formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  getAlbumCoverImage(album: PhotoAlbum): string {
    return album.coverPhoto || 'assets/images/default-album-cover.jpg';
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

  // Generate skeleton items for loading state
  getSkeletonItems(): number[] {
    return Array(8).fill(0).map((_, i) => i);
  }
}