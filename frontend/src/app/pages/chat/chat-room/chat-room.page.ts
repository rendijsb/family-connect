import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, finalize, debounceTime } from 'rxjs';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
  IonIcon, IonTextarea, IonItem, IonInfiniteScroll, IonInfiniteScrollContent,
  IonRefresher, IonRefresherContent, IonAvatar, IonBadge, IonActionSheet,
  IonFab, IonFabButton, IonList, IonLabel, IonCheckbox, IonInput
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, sendOutline, attachOutline, micOutline, cameraOutline,
  imageOutline, documentOutline, locationOutline, addCircleOutline,
  ellipsisVerticalOutline, heartOutline, happyOutline, sadOutline,
  thumbsUpOutline, thumbsDownOutline, playOutline, copyOutline,
  trashOutline, createOutline, flagOutline, informationCircleOutline,
  timeOutline, checkmarkDoneOutline, closeOutline
} from 'ionicons/icons';

import { ChatService } from '../../../core/services/chat/chat.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import {
  ChatRoom,
  ChatMessage,
  MessageTypeEnum,
  SendMessageRequest,
  isMessageFromCurrentUser,
  shouldShowAvatar,
  shouldShowTimestamp,
  formatMessageTime,
  formatMessageDate, getChatRoomTypeIcon
} from '../../../models/chat/chat.models';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.page.html',
  styleUrls: ['./chat-room.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
    IonIcon, IonTextarea, IonItem, IonInfiniteScroll, IonInfiniteScrollContent,
    IonRefresher, IonRefresherContent, IonAvatar, IonBadge, IonActionSheet,
    IonFab, IonFabButton, IonList, IonLabel, IonCheckbox, IonInput
  ]
})
export class ChatRoomPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(IonContent) content!: IonContent;
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLIonTextareaElement>;

  private readonly destroy$ = new Subject<void>();
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  // Typing indicator subject
  private readonly typingSubject = new Subject<void>();

  // State signals
  readonly chatRoom = this.chatService.currentChatRoom;
  readonly messages = this.chatService.messages;
  readonly isLoadingMessages = this.chatService.isLoadingMessages;
  readonly typingUsers = this.chatService.typingUsers;
  readonly typingUsersText = this.chatService.typingUsersText;

  readonly familySlug = signal<string>('');
  readonly roomId = signal<number>(0);
  readonly messageText = signal<string>('');
  readonly replyingTo = signal<ChatMessage | null>(null);
  readonly showEmojiPicker = signal<boolean>(false);
  readonly isRecording = signal<boolean>(false);
  readonly currentPage = signal<number>(1);
  readonly hasMoreMessages = signal<boolean>(true);

  // Common emoji reactions
  readonly commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];

  readonly currentUser = this.authService.user;
  readonly MessageTypeEnum = MessageTypeEnum;

  constructor() {
    this.addIcons();
    this.setupTypingIndicator();
  }

  ngOnInit() {
    const familySlug = this.route.snapshot.paramMap.get('slug') || '';
    const roomIdStr = this.route.snapshot.paramMap.get('roomId') || '';
    const roomId = parseInt(roomIdStr, 10);

    this.familySlug.set(familySlug);
    this.roomId.set(roomId);

    if (familySlug && roomId) {
      this.loadChatRoom();
      this.loadMessages();
    }
  }

  ngAfterViewInit() {
    // Auto-scroll to bottom on new messages
    this.messages.asObservable?.()
      .pipe(takeUntil(this.destroy$))
      .subscribe((messages) => {
        if (messages.length > 0) {
          setTimeout(() => this.scrollToBottom(), 100);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatService.clearCurrentRoom();
  }

  private addIcons() {
    addIcons({
      arrowBackOutline, sendOutline, attachOutline, micOutline, cameraOutline,
      imageOutline, documentOutline, locationOutline, addCircleOutline,
      ellipsisVerticalOutline, heartOutline, happyOutline, sadOutline,
      thumbsUpOutline, thumbsDownOutline, playOutline, copyOutline,
      trashOutline, createOutline, flagOutline, informationCircleOutline,
      timeOutline, checkmarkDoneOutline, closeOutline
    });
  }

  private setupTypingIndicator() {
    this.typingSubject.pipe(
      debounceTime(500),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.sendTypingIndicator();
    });
  }

  private loadChatRoom() {
    this.chatService.getChatRoom(this.familySlug(), this.roomId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Mark as read when opening room
          this.markAsRead();
        },
        error: (error) => {
          console.error('Load chat room error:', error);
          this.toastService.showToast('Failed to load chat room.', 'danger');
          this.goBack();
        }
      });
  }

  private loadMessages(page: number = 1) {
    this.chatService.getMessages(this.familySlug(), this.roomId(), page)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data.length < 50) {
            this.hasMoreMessages.set(false);
          }
          if (page === 1) {
            setTimeout(() => this.scrollToBottom(), 100);
          }
        },
        error: (error) => {
          console.error('Load messages error:', error);
          this.toastService.showToast('Failed to load messages.', 'danger');
        }
      });
  }

  private markAsRead() {
    this.chatService.markAsRead(this.familySlug(), this.roomId())
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private sendTypingIndicator() {
    this.chatService.sendTypingIndicator(this.familySlug(), this.roomId())
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private scrollToBottom() {
    this.content?.scrollToBottom(300);
  }

  // Event Handlers
  async goBack() {
    await this.router.navigate(['/family', this.familySlug(), 'chat']);
  }

  doRefresh(event: any) {
    this.currentPage.set(1);
    this.hasMoreMessages.set(true);
    this.loadMessages(1);
    setTimeout(() => event.target.complete(), 1000);
  }

  onInfiniteScroll(event: any) {
    if (this.hasMoreMessages()) {
      const nextPage = this.currentPage() + 1;
      this.currentPage.set(nextPage);
      this.loadMessages(nextPage);
    }
    setTimeout(() => event.target.complete(), 1000);
  }

  onMessageInputChange() {
    this.typingSubject.next();
  }

  async sendMessage() {
    const text = this.messageText().trim();
    if (!text) return;

    const request: SendMessageRequest = {
      message: text,
      type: MessageTypeEnum.TEXT,
      replyToId: this.replyingTo()?.id
    };

    this.messageText.set('');
    this.replyingTo.set(null);

    this.chatService.sendMessage(this.familySlug(), this.roomId(), request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (error) => {
          console.error('Send message error:', error);
          this.toastService.showToast('Failed to send message.', 'danger');
        }
      });
  }

  async presentAttachmentOptions() {
    const buttons = [
      {
        text: 'Camera',
        icon: 'camera-outline',
        handler: () => this.openCamera()
      },
      {
        text: 'Photo & Video Library',
        icon: 'image-outline',
        handler: () => this.openGallery()
      },
      {
        text: 'Document',
        icon: 'document-outline',
        handler: () => this.openDocuments()
      },
      {
        text: 'Location',
        icon: 'location-outline',
        handler: () => this.shareLocation()
      }
    ];

    await this.toastService.showActionSheet('Add Attachment', buttons);
  }

  async presentMessageOptions(message: ChatMessage, event: Event) {
    event.stopPropagation();

    const buttons: any[] = [
      {
        text: 'Reply',
        icon: 'reply-outline',
        handler: () => this.replyToMessage(message)
      },
      {
        text: 'Copy Text',
        icon: 'copy-outline',
        handler: () => this.copyMessageText(message)
      }
    ];

    if (this.isCurrentUserMessage(message)) {
      buttons.push(
        {
          text: 'Edit',
          icon: 'create-outline',
          handler: () => this.editMessage(message)
        },
        {
          text: 'Delete',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.confirmDeleteMessage(message)
        }
      );
    } else {
      buttons.push({
        text: 'Report',
        icon: 'flag-outline',
        handler: () => this.reportMessage(message)
      });
    }

    await this.toastService.showActionSheet('Message Options', buttons);
  }

  async presentEmojiPicker(message: ChatMessage) {
    const alert = await document.createElement('ion-alert');
    alert.header = 'Add Reaction';
    alert.cssClass = 'emoji-alert';

    // Create emoji buttons
    const buttons = this.commonEmojis.map(emoji => ({
      text: emoji,
      cssClass: 'emoji-button',
      handler: () => this.addReaction(message, emoji)
    }));

    buttons.push({
      text: 'Cancel',
      role: 'cancel',
      cssClass: 'cancel-button'
    });

    alert.buttons = buttons;
    document.body.appendChild(alert);
    await alert.present();
  }

  // Message Actions
  replyToMessage(message: ChatMessage) {
    this.replyingTo.set(message);
    this.messageInput.nativeElement.focus();
  }

  cancelReply() {
    this.replyingTo.set(null);
  }

  async copyMessageText(message: ChatMessage) {
    await this.toastService.copyToClipboard(
      message.message,
      'Message copied to clipboard!'
    );
  }

  async editMessage(message: ChatMessage) {
    // Simple prompt for editing - in a full app, this would be a proper modal
    const alert = await document.createElement('ion-alert');
    alert.header = 'Edit Message';
    alert.inputs = [{
      name: 'message',
      type: 'textarea',
      value: message.message,
      placeholder: 'Edit your message...'
    }];
    alert.buttons = [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Update',
        handler: (data) => {
          if (data.message.trim()) {
            this.updateMessage(message, data.message.trim());
          }
        }
      }
    ];

    document.body.appendChild(alert);
    await alert.present();
  }

  private updateMessage(message: ChatMessage, newText: string) {
    this.chatService.updateMessage(this.familySlug(), message.id, newText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showToast('Message updated', 'success');
        },
        error: () => {
          this.toastService.showToast('Failed to update message', 'danger');
        }
      });
  }

  async confirmDeleteMessage(message: ChatMessage) {
    const confirmed = await this.toastService.showDestructiveConfirmation(
      'Delete Message',
      'Are you sure you want to delete this message?',
      'Delete',
      'Cancel'
    );

    if (confirmed) {
      this.deleteMessage(message);
    }
  }

  private deleteMessage(message: ChatMessage) {
    this.chatService.deleteMessage(this.familySlug(), message.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showToast('Message deleted', 'success');
        },
        error: () => {
          this.toastService.showToast('Failed to delete message', 'danger');
        }
      });
  }

  async reportMessage(message: ChatMessage) {
    await this.toastService.showToast('Message reporting coming soon!', 'warning');
  }

  // Reactions
  addReaction(message: ChatMessage, emoji: string) {
    this.chatService.addReaction(this.familySlug(), message.id, emoji)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: () => {
          this.toastService.showToast('Failed to add reaction', 'danger');
        }
      });
  }

  removeReaction(message: ChatMessage, emoji: string) {
    this.chatService.removeReaction(this.familySlug(), message.id, emoji)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: () => {
          this.toastService.showToast('Failed to remove reaction', 'danger');
        }
      });
  }

  toggleReaction(message: ChatMessage, emoji: string) {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) return;

    const existingReaction = message.reactions?.find(
      r => r.emoji === emoji && r.userId === currentUserId
    );

    if (existingReaction) {
      this.removeReaction(message, emoji);
    } else {
      this.addReaction(message, emoji);
    }
  }

  // Attachment handlers (placeholders)
  private async openCamera() {
    await this.toastService.showToast('Camera feature coming soon!', 'warning');
  }

  private async openGallery() {
    await this.toastService.showToast('Gallery feature coming soon!', 'warning');
  }

  private async openDocuments() {
    await this.toastService.showToast('Document attachment coming soon!', 'warning');
  }

  private async shareLocation() {
    await this.toastService.showToast('Location sharing coming soon!', 'warning');
  }

  // Voice recording (placeholder)
  async toggleRecording() {
    if (this.isRecording()) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private async startRecording() {
    this.isRecording.set(true);
    await this.toastService.showToast('Voice recording started', 'primary');
  }

  private async stopRecording() {
    this.isRecording.set(false);
    await this.toastService.showToast('Voice recording stopped', 'primary');
  }

  // Utility Methods
  trackByMessageId(index: number, message: ChatMessage): number {
    return message.id;
  }

  isCurrentUserMessage(message: ChatMessage): boolean {
    const currentUserId = this.currentUser()?.id;
    return currentUserId ? isMessageFromCurrentUser(message, currentUserId) : false;
  }

  shouldShowAvatar(index: number): boolean {
    return shouldShowAvatar(this.messages(), index);
  }

  shouldShowTimestamp(index: number): boolean {
    return shouldShowTimestamp(this.messages(), index);
  }

  formatMessageTime(dateString: string): string {
    return formatMessageTime(dateString);
  }

  formatMessageDate(dateString: string): string {
    return formatMessageDate(dateString);
  }

  getReactionCount(message: ChatMessage, emoji: string): number {
    return message.reactions?.filter(r => r.emoji === emoji).length || 0;
  }

  hasUserReacted(message: ChatMessage, emoji: string): boolean {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) return false;

    return message.reactions?.some(
      r => r.emoji === emoji && r.userId === currentUserId
    ) || false;
  }

  getUniqueReactions(message: ChatMessage): string[] {
    if (!message.reactions) return [];

    const uniqueEmojis = new Set(message.reactions.map(r => r.emoji));
    return Array.from(uniqueEmojis);
  }

  getMessageStatus(message: ChatMessage): string {
    if (message.isSending) return 'sending';
    if (message.sendError) return 'failed';
    if (message.isDeleted) return 'deleted';
    return 'sent';
  }

  getMessageStatusIcon(message: ChatMessage): string {
    const status = this.getMessageStatus(message);
    switch (status) {
      case 'sending': return 'time-outline';
      case 'failed': return 'alert-circle-outline';
      case 'sent': return 'checkmark-outline';
      case 'deleted': return 'trash-outline';
      default: return 'checkmark-outline';
    }
  }

  protected readonly getChatRoomTypeIcon = getChatRoomTypeIcon;
}
