import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
  IonIcon, IonSearchbar, IonRefresher, IonRefresherContent, IonCard,
  IonCardContent, IonAvatar, IonBadge, IonFab, IonFabButton, IonSkeletonText,
  IonItem, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, searchOutline, addOutline, chatbubbleOutline,
  peopleOutline, personOutline, megaphoneOutline, warningOutline,
  ellipsisVerticalOutline, timeOutline, checkmarkDoneOutline
} from 'ionicons/icons';

import { ChatService } from '../../../core/services/chat/chat.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import {
  ChatRoom,
  ChatRoomTypeEnum,
  getChatRoomTypeIcon,
  getChatRoomTypeName,
  formatMessageTime
} from '../../../models/chat/chat.models';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.page.html',
  styleUrls: ['./chat-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
    IonIcon, IonSearchbar, IonRefresher, IonRefresherContent, IonCard,
    IonCardContent, IonAvatar, IonBadge, IonFab, IonFabButton, IonSkeletonText,
    IonItem, IonLabel
  ]
})
export class ChatListPage implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly chatRooms = this.chatService.chatRooms;
  readonly isLoading = this.chatService.isLoading;
  readonly totalUnreadCount = this.chatService.totalUnreadCount;

  readonly familySlug = signal<string>('');
  readonly searchTerm = signal<string>('');
  readonly filteredRooms = signal<ChatRoom[]>([]);

  readonly ChatRoomTypeEnum = ChatRoomTypeEnum;

  constructor() {
    this.addIcons();
  }

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    this.familySlug.set(slug);

    if (slug) {
      this.loadChatRooms();
    }

    // Update filtered rooms when chat rooms or search term changes
    this.updateFilteredRooms();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private addIcons() {
    addIcons({
      arrowBackOutline, searchOutline, addOutline, chatbubbleOutline,
      peopleOutline, personOutline, megaphoneOutline, warningOutline,
      ellipsisVerticalOutline, timeOutline, checkmarkDoneOutline
    });
  }

  private loadChatRooms() {
    this.chatService.getChatRooms(this.familySlug())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.updateFilteredRooms();
        },
        error: (error) => {
          console.error('Load chat rooms error:', error);
          this.toastService.showToast('Failed to load chat rooms.', 'danger');
        }
      });
  }

  private updateFilteredRooms() {
    const rooms = this.chatRooms();
    const search = this.searchTerm().toLowerCase();

    if (!search) {
      this.filteredRooms.set(rooms);
      return;
    }

    const filtered = rooms.filter(room =>
      room.name.toLowerCase().includes(search) ||
      room.description?.toLowerCase().includes(search) ||
      room.lastMessage?.message.toLowerCase().includes(search)
    );

    this.filteredRooms.set(filtered);
  }

  // Event Handlers
  async goBack() {
    await this.router.navigate(['/family', this.familySlug()]);
  }

  doRefresh(event: any) {
    this.chatService.getChatRooms(this.familySlug())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        complete: () => event.target.complete(),
        error: () => {
          event.target.complete();
          this.toastService.showToast('Failed to refresh chat rooms.', 'danger');
        }
      });
  }

  onSearchChange(event: any) {
    this.searchTerm.set(event.detail.value || '');
    this.updateFilteredRooms();
  }

  async openChatRoom(room: ChatRoom) {
    await this.router.navigate([
      '/family',
      this.familySlug(),
      'chat',
      room.id
    ]);
  }

  async createChatRoom() {
    // For now, navigate to a simple create room page
    // In a full implementation, this would open a modal
    await this.router.navigate([
      '/family',
      this.familySlug(),
      'chat',
      'create'
    ]);
  }

  async presentRoomOptions(room: ChatRoom, event: Event) {
    event.stopPropagation();

    const buttons: any[] = [
      {
        text: 'Open Chat',
        icon: 'chatbubble-outline',
        handler: () => this.openChatRoom(room)
      }
    ];

    if (room.unreadCount && room.unreadCount > 0) {
      buttons.push({
        text: 'Mark as Read',
        icon: 'checkmark-done-outline',
        handler: () => this.markAsRead(room)
      });
    }

    if (room.isCurrentUserAdmin) {
      buttons.push(
        {
          text: 'Room Settings',
          icon: 'settings-outline',
          handler: () => this.openRoomSettings(room)
        },
        {
          text: 'Delete Room',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.confirmDeleteRoom(room)
        }
      );
    } else {
      buttons.push({
        text: 'Leave Room',
        icon: 'exit-outline',
        role: 'destructive',
        handler: () => this.confirmLeaveRoom(room)
      });
    }

    await this.toastService.showActionSheet(room.name, buttons);
  }

  private async markAsRead(room: ChatRoom) {
    this.chatService.markAsRead(this.familySlug(), room.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showToast('Marked as read', 'success');
        },
        error: () => {
          this.toastService.showToast('Failed to mark as read', 'danger');
        }
      });
  }

  private async openRoomSettings(room: ChatRoom) {
    await this.router.navigate([
      '/family',
      this.familySlug(),
      'chat',
      room.id,
      'settings'
    ]);
  }

  private async confirmDeleteRoom(room: ChatRoom) {
    const confirmed = await this.toastService.showDeleteConfirmation(
      room.name,
      'Chat Room'
    );

    if (confirmed) {
      this.deleteRoom(room);
    }
  }

  private async confirmLeaveRoom(room: ChatRoom) {
    const confirmed = await this.toastService.showDestructiveConfirmation(
      'Leave Chat Room',
      `Are you sure you want to leave "${room.name}"?`,
      'Leave',
      'Cancel'
    );

    if (confirmed) {
      this.leaveRoom(room);
    }
  }

  private deleteRoom(room: ChatRoom) {
    const loading = this.toastService.showLoading('Deleting chat room...');

    this.chatService.deleteChatRoom(this.familySlug(), room.id)
      .pipe(
        finalize(() => loading.then(l => l.dismiss())),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.toastService.showToast('Chat room deleted successfully', 'success');
          this.updateFilteredRooms();
        },
        error: () => {
          this.toastService.showToast('Failed to delete chat room', 'danger');
        }
      });
  }

  private leaveRoom(room: ChatRoom) {
    // This would be implemented as a separate API endpoint
    this.toastService.showToast('Leave room feature coming soon!', 'warning');
  }

  // Utility Methods
  trackByRoomId(index: number, room: ChatRoom): number {
    return room.id;
  }

  getChatRoomTypeIcon(type: ChatRoomTypeEnum): string {
    return getChatRoomTypeIcon(type);
  }

  getChatRoomTypeName(type: ChatRoomTypeEnum): string {
    return getChatRoomTypeName(type);
  }

  formatMessageTime(dateString: string): string {
    return formatMessageTime(dateString);
  }

  getLastMessagePreview(room: ChatRoom): string {
    if (!room.lastMessage) {
      return 'No messages yet';
    }

    const message = room.lastMessage;

    if (message.isDeleted) {
      return 'Message deleted';
    }

    if (message.type !== 'text') {
      switch (message.type) {
        case 'image': return '📷 Photo';
        case 'video': return '🎥 Video';
        case 'audio': return '🎵 Audio';
        case 'file': return '📎 File';
        case 'location': return '📍 Location';
        case 'poll': return '📊 Poll';
        case 'event': return '📅 Event';
        default: return 'Message';
      }
    }

    return message.message.length > 50
      ? message.message.substring(0, 50) + '...'
      : message.message;
  }

  getLastMessageSender(room: ChatRoom): string {
    if (!room.lastMessage?.user) {
      return '';
    }

    const currentUser = this.authService.user();
    const sender = room.lastMessage.user;

    if (sender.id === currentUser?.id) {
      return 'You: ';
    }

    return `${sender.name}: `;
  }

  getRoomMemberCount(room: ChatRoom): number {
    return room.members?.length || 0;
  }

  isCurrentUserAdmin(room: ChatRoom): boolean {
    return room.isCurrentUserAdmin || false;
  }
}
