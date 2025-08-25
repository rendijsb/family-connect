import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, interval } from 'rxjs';
import { tap, finalize, map, takeUntil } from 'rxjs';
import { ApiUrlService } from '../api.service';
import { AuthService } from '../auth/auth.service';
import {
  ChatRoom,
  ChatMessage,
  MessageReaction,
  CreateChatRoomRequest,
  SendMessageRequest,
  UpdateChatRoomRequest,
  MessageTypeEnum,
  ChatRoomTypeEnum
} from '../../../models/chat/chat.models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface TypingUser {
  userId: number;
  userName: string;
  lastTyping: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);
  private readonly authService = inject(AuthService);

  // State signals
  private readonly _chatRooms = signal<ChatRoom[]>([]);
  private readonly _currentChatRoom = signal<ChatRoom | null>(null);
  private readonly _messages = signal<ChatMessage[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _isLoadingMessages = signal<boolean>(false);
  private readonly _typingUsers = signal<TypingUser[]>([]);

  // WebSocket (placeholder for real implementation)
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Subjects for real-time updates
  private readonly messageReceived$ = new Subject<ChatMessage>();
  private readonly messageUpdated$ = new Subject<ChatMessage>();
  private readonly messageDeleted$ = new Subject<number>();
  private readonly typingStarted$ = new Subject<{ roomId: number; user: any }>();
  private readonly typingEnded$ = new Subject<{ roomId: number; userId: number }>();
  private readonly roomUpdated$ = new Subject<ChatRoom>();
  private readonly destroy$ = new Subject<void>();

  // Public readonly signals
  readonly chatRooms = this._chatRooms.asReadonly();
  readonly currentChatRoom = this._currentChatRoom.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isLoadingMessages = this._isLoadingMessages.asReadonly();
  readonly typingUsers = this._typingUsers.asReadonly();

  // Computed signals
  readonly totalUnreadCount = computed(() => {
    return this._chatRooms().reduce((total, room) => total + (room.unreadCount || 0), 0);
  });

  readonly currentRoomUnreadCount = computed(() => {
    const currentRoom = this._currentChatRoom();
    return currentRoom?.unreadCount || 0;
  });

  readonly typingUsersText = computed(() => {
    const users = this._typingUsers();
    if (users.length === 0) return '';
    if (users.length === 1) return `${users[0].userName} is typing...`;
    if (users.length === 2) return `${users[0].userName} and ${users[1].userName} are typing...`;
    return `${users[0].userName} and ${users.length - 1} others are typing...`;
  });

  constructor() {
    this.initializeWebSocket();
    this.startTypingCleanup();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnectWebSocket();
  }

  // Chat Rooms API
  getChatRooms(familySlug: string): Observable<ApiResponse<ChatRoom[]>> {
    this._isLoading.set(true);

    return this.http
      .get<ApiResponse<ChatRoom[]>>(
        this.apiUrlService.getUrl(`families/${familySlug}/chat/rooms`)
      )
      .pipe(
        tap((response) => {
          this._chatRooms.set(response.data);
        }),
        finalize(() => this._isLoading.set(false))
      );
  }

  getChatRoom(familySlug: string, roomId: number): Observable<ApiResponse<ChatRoom>> {
    return this.http
      .get<ApiResponse<ChatRoom>>(
        this.apiUrlService.getUrl(`families/${familySlug}/chat/rooms/${roomId}`)
      )
      .pipe(
        tap((response) => {
          this._currentChatRoom.set(response.data);
          this.updateChatRoomInList(response.data);
        })
      );
  }

  createChatRoom(
    familySlug: string,
    request: CreateChatRoomRequest
  ): Observable<ApiResponse<ChatRoom>> {
    this._isLoading.set(true);

    return this.http
      .post<ApiResponse<ChatRoom>>(
        this.apiUrlService.getUrl(`families/${familySlug}/chat/rooms`),
        request
      )
      .pipe(
        tap((response) => {
          const currentRooms = this._chatRooms();
          this._chatRooms.set([response.data, ...currentRooms]);
        }),
        finalize(() => this._isLoading.set(false))
      );
  }

  updateChatRoom(
    familySlug: string,
    roomId: number,
    request: UpdateChatRoomRequest
  ): Observable<ApiResponse<ChatRoom>> {
    return this.http
      .put<ApiResponse<ChatRoom>>(
        this.apiUrlService.getUrl(`families/${familySlug}/chat/rooms/${roomId}`),
        request
      )
      .pipe(
        tap((response) => {
          this.updateChatRoomInList(response.data);
          if (this._currentChatRoom()?.id === roomId) {
            this._currentChatRoom.set(response.data);
          }
        })
      );
  }

  deleteChatRoom(familySlug: string, roomId: number): Observable<ApiResponse<void>> {
    return this.http
      .delete<ApiResponse<void>>(
        this.apiUrlService.getUrl(`families/${familySlug}/chat/rooms/${roomId}`)
      )
      .pipe(
        tap(() => {
          const currentRooms = this._chatRooms();
          this._chatRooms.set(currentRooms.filter((room) => room.id !== roomId));
          if (this._currentChatRoom()?.id === roomId) {
            this._currentChatRoom.set(null);
          }
        })
      );
  }

  // Messages API
  getMessages(
    familySlug: string,
    roomId: number,
    page: number = 1,
    perPage: number = 50
  ): Observable<ApiResponse<ChatMessage[]>> {
    if (page === 1) {
      this._isLoadingMessages.set(true);
    }

    return this.http
      .get<ApiResponse<ChatMessage[]>>(
        this.apiUrlService.getUrl(
          `families/${familySlug}/chat/rooms/${roomId}/messages`
        ),
        {
          params: { page: page.toString(), per_page: perPage.toString() },
        }
      )
      .pipe(
        tap((response) => {
          if (page === 1) {
            this._messages.set(response.data);
          } else {
            // Prepend older messages for pagination
            const currentMessages = this._messages();
            this._messages.set([...response.data, ...currentMessages]);
          }
        }),
        finalize(() => {
          if (page === 1) {
            this._isLoadingMessages.set(false);
          }
        })
      );
  }

  sendMessage(
    familySlug: string,
    roomId: number,
    request: SendMessageRequest
  ): Observable<ApiResponse<ChatMessage>> {
    // Add optimistic message
    const optimisticMessage: ChatMessage = {
      id: Date.now(), // Temporary ID
      chatRoomId: roomId,
      userId: this.authService.user()?.id || 0,
      message: request.message,
      type: request.type,
      replyToId: request.replyToId,
      attachments: request.attachments ? [] : undefined,
      metadata: request.metadata,
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: this.authService.user(),
      isOptimistic: true,
      isSending: true,
    };

    this.addMessageToList(optimisticMessage);

    return this.http
      .post<ApiResponse<ChatMessage>>(
        this.apiUrlService.getUrl(
          `families/${familySlug}/chat/rooms/${roomId}/messages`
        ),
        request
      )
      .pipe(
        tap((response) => {
          // Replace optimistic message with real one
          this.replaceOptimisticMessage(optimisticMessage.id, response.data);
        }),
        tap(() => {
          // Update last message in room list
          this.updateLastMessage(roomId, optimisticMessage);
        }),
        finalize(() => {
          // Mark as sent/failed
          this.updateMessageSendingState(optimisticMessage.id, false);
        })
      );
  }

  updateMessage(
    familySlug: string,
    messageId: number,
    message: string
  ): Observable<ApiResponse<ChatMessage>> {
    return this.http
      .put<ApiResponse<ChatMessage>>(
        this.apiUrlService.getUrl(`families/${familySlug}/chat/messages/${messageId}`),
        { message }
      )
      .pipe(
        tap((response) => {
          this.updateMessageInList(response.data);
        })
      );
  }

  deleteMessage(familySlug: string, messageId: number): Observable<ApiResponse<void>> {
    return this.http
      .delete<ApiResponse<void>>(
        this.apiUrlService.getUrl(`families/${familySlug}/chat/messages/${messageId}`)
      )
      .pipe(
        tap(() => {
          this.markMessageAsDeleted(messageId);
        })
      );
  }

  // Message Reactions API
  addReaction(
    familySlug: string,
    messageId: number,
    emoji: string
  ): Observable<ApiResponse<MessageReaction>> {
    return this.http
      .post<ApiResponse<MessageReaction>>(
        this.apiUrlService.getUrl(
          `families/${familySlug}/chat/messages/${messageId}/reactions`
        ),
        { emoji }
      )
      .pipe(
        tap((response) => {
          this.addReactionToMessage(messageId, response.data);
        })
      );
  }

  removeReaction(
    familySlug: string,
    messageId: number,
    emoji: string
  ): Observable<ApiResponse<void>> {
    const currentUserId = this.authService.user()?.id;

    return this.http
      .delete<ApiResponse<void>>(
        this.apiUrlService.getUrl(
          `families/${familySlug}/chat/messages/${messageId}/reactions/${emoji}`
        )
      )
      .pipe(
        tap(() => {
          if (currentUserId) {
            this.removeReactionFromMessage(messageId, emoji, currentUserId);
          }
        })
      );
  }

  // Room Management
  markAsRead(familySlug: string, roomId: number): Observable<ApiResponse<void>> {
    return this.http
      .post<ApiResponse<void>>(
        this.apiUrlService.getUrl(`families/${familySlug}/chat/rooms/${roomId}/read`),
        {}
      )
      .pipe(
        tap(() => {
          this.markRoomAsRead(roomId);
        })
      );
  }

  // Typing Indicators
  sendTypingIndicator(familySlug: string, roomId: number): Observable<ApiResponse<void>> {
    return this.http
      .post<ApiResponse<void>>(
        this.apiUrlService.getUrl(`families/${familySlug}/chat/rooms/${roomId}/typing`),
        {}
      );
  }

  // WebSocket Methods (Placeholder implementation)
  private initializeWebSocket() {
    // In a real implementation, you would connect to your WebSocket server
    // For now, we'll use a placeholder that simulates real-time updates

    // Example WebSocket connection:
    // const token = this.authService.getToken();
    // const wsUrl = `wss://your-api-domain/ws?token=${token}`;
    // this.websocket = new WebSocket(wsUrl);

    // this.websocket.onopen = () => {
    //   console.log('WebSocket connected');
    //   this.reconnectAttempts = 0;
    // };

    // this.websocket.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   this.handleWebSocketMessage(data);
    // };

    // this.websocket.onclose = () => {
    //   console.log('WebSocket disconnected');
    //   this.attemptReconnect();
    // };

    // this.websocket.onerror = (error) => {
    //   console.error('WebSocket error:', error);
    // };
  }

  private disconnectWebSocket() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'message_received':
        this.handleNewMessage(data.message);
        break;
      case 'message_updated':
        this.handleMessageUpdate(data.message);
        break;
      case 'message_deleted':
        this.handleMessageDeletion(data.messageId);
        break;
      case 'typing_started':
        this.handleTypingStarted(data.roomId, data.user);
        break;
      case 'typing_ended':
        this.handleTypingEnded(data.roomId, data.userId);
        break;
      case 'room_updated':
        this.handleRoomUpdate(data.room);
        break;
    }
  }

  private handleNewMessage(message: ChatMessage) {
    this.addMessageToList(message);
    this.updateLastMessage(message.chatRoomId, message);
  }

  private handleMessageUpdate(message: ChatMessage) {
    this.updateMessageInList(message);
  }

  private handleMessageDeletion(messageId: number) {
    this.markMessageAsDeleted(messageId);
  }

  private handleTypingStarted(roomId: number, user: any) {
    if (this._currentChatRoom()?.id === roomId) {
      const currentUsers = this._typingUsers();
      if (!currentUsers.find(u => u.userId === user.id)) {
        this._typingUsers.set([
          ...currentUsers,
          {
            userId: user.id,
            userName: user.name,
            lastTyping: Date.now()
          }
        ]);
      }
    }
  }

  private handleTypingEnded(roomId: number, userId: number) {
    if (this._currentChatRoom()?.id === roomId) {
      const currentUsers = this._typingUsers();
      this._typingUsers.set(currentUsers.filter(u => u.userId !== userId));
    }
  }

  private handleRoomUpdate(room: ChatRoom) {
    this.updateChatRoomInList(room);
    if (this._currentChatRoom()?.id === room.id) {
      this._currentChatRoom.set(room);
    }
  }

  // Helper methods
  private addMessageToList(message: ChatMessage) {
    const currentMessages = this._messages();
    this._messages.set([...currentMessages, message]);
  }

  private updateMessageInList(updatedMessage: ChatMessage) {
    const currentMessages = this._messages();
    const index = currentMessages.findIndex(m => m.id === updatedMessage.id);
    if (index !== -1) {
      const newMessages = [...currentMessages];
      newMessages[index] = updatedMessage;
      this._messages.set(newMessages);
    }
  }

  private replaceOptimisticMessage(optimisticId: number, realMessage: ChatMessage) {
    const currentMessages = this._messages();
    const index = currentMessages.findIndex(m => m.id === optimisticId);
    if (index !== -1) {
      const newMessages = [...currentMessages];
      newMessages[index] = realMessage;
      this._messages.set(newMessages);
    }
  }

  private updateMessageSendingState(messageId: number, isSending: boolean, error?: string) {
    const currentMessages = this._messages();
    const index = currentMessages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      const newMessages = [...currentMessages];
      newMessages[index] = {
        ...newMessages[index],
        isSending,
        sendError: error
      };
      this._messages.set(newMessages);
    }
  }

  private markMessageAsDeleted(messageId: number) {
    const currentMessages = this._messages();
    const index = currentMessages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      const newMessages = [...currentMessages];
      newMessages[index] = {
        ...newMessages[index],
        isDeleted: true,
        message: 'This message was deleted'
      };
      this._messages.set(newMessages);
    }
  }

  private addReactionToMessage(messageId: number, reaction: MessageReaction) {
    const currentMessages = this._messages();
    const index = currentMessages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      const newMessages = [...currentMessages];
      if (!newMessages[index].reactions) {
        newMessages[index].reactions = [];
      }
      newMessages[index].reactions!.push(reaction);
      this._messages.set(newMessages);
    }
  }

  private removeReactionFromMessage(messageId: number, emoji: string, userId: number) {
    const currentMessages = this._messages();
    const index = currentMessages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      const newMessages = [...currentMessages];
      if (newMessages[index].reactions) {
        newMessages[index].reactions = newMessages[index].reactions!.filter(
          r => !(r.emoji === emoji && r.userId === userId)
        );
      }
      this._messages.set(newMessages);
    }
  }

  private updateChatRoomInList(updatedRoom: ChatRoom) {
    const currentRooms = this._chatRooms();
    const index = currentRooms.findIndex(r => r.id === updatedRoom.id);
    if (index !== -1) {
      const newRooms = [...currentRooms];
      newRooms[index] = updatedRoom;
      this._chatRooms.set(newRooms);
    }
  }

  private updateLastMessage(roomId: number, message: ChatMessage) {
    const currentRooms = this._chatRooms();
    const index = currentRooms.findIndex(r => r.id === roomId);
    if (index !== -1) {
      const newRooms = [...currentRooms];
      newRooms[index] = {
        ...newRooms[index],
        lastMessage: message,
        lastMessageAt: message.createdAt
      };
      // Move to top of list if it's a new message
      if (!message.isOptimistic) {
        const [updatedRoom] = newRooms.splice(index, 1);
        newRooms.unshift(updatedRoom);
      }
      this._chatRooms.set(newRooms);
    }
  }

  private markRoomAsRead(roomId: number) {
    const currentRooms = this._chatRooms();
    const index = currentRooms.findIndex(r => r.id === roomId);
    if (index !== -1) {
      const newRooms = [...currentRooms];
      newRooms[index] = {
        ...newRooms[index],
        unreadCount: 0
      };
      this._chatRooms.set(newRooms);
    }
  }

  private startTypingCleanup() {
    // Clean up typing indicators every 3 seconds
    interval(3000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const now = Date.now();
        const currentUsers = this._typingUsers();
        const activeUsers = currentUsers.filter(
          user => (now - user.lastTyping) < 5000 // 5 seconds timeout
        );

        if (activeUsers.length !== currentUsers.length) {
          this._typingUsers.set(activeUsers);
        }
      });
  }

  // Public utility methods
  clearCurrentRoom() {
    this._currentChatRoom.set(null);
    this._messages.set([]);
    this._typingUsers.set([]);
  }

  getCurrentMessages(): ChatMessage[] {
    return this._messages();
  }

  getCurrentChatRooms(): ChatRoom[] {
    return this._chatRooms();
  }
}
