// frontend/src/app/core/services/websocket/websocket.service.ts
import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../../environments/environment';

// Import libraries with proper types
declare global {
  interface Window {
    Pusher: any;
    Echo: any;
  }
}

// Dynamic imports for Laravel Echo and Pusher
let Echo: any = null;
let Pusher: any = null;

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private readonly authService = inject(AuthService);
  private echo: any = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  constructor() {
    this.loadLibraries();
  }

  private async loadLibraries() {
    try {
      if (!Echo) {
        const [echoModule, pusherModule] = await Promise.all([
          import('laravel-echo'),
          import('pusher-js'),
        ]);

        Echo = echoModule.default;
        Pusher = pusherModule.default;
        window.Pusher = Pusher;
      }
    } catch (error) {
      console.error('Failed to load WebSocket libraries:', error);
    }
  }

  async connect(): Promise<void> {
    console.log('🔌 WebSocket connect() called');

    if (this.isConnected) {
      console.log('🔌 Already connected');
      return;
    }

    if (!this.authService.isAuthenticated()) {
      console.log('🔌 User not authenticated');
      return;
    }

    console.log('🔌 Loading WebSocket libraries...');
    await this.loadLibraries();

    if (!Echo || !Pusher) {
      console.error('❌ WebSocket libraries not loaded');
      throw new Error('WebSocket libraries not available');
    }

    // Get token from signal correctly
    const token = this.authService.authToken();
    if (!token) {
      console.error('❌ No auth token available for WebSocket connection');
      throw new Error('No authentication token');
    }

    console.log('✅ Auth token retrieved');

    try {
      // Create Pusher instance with proper configuration for Reverb
      const pusher = new Pusher(environment.reverb.key, {
        cluster: environment.reverb.cluster || '',
        wsHost: environment.reverb.host,
        wsPort: environment.reverb.port,
        wssPort: environment.reverb.port,
        forceTLS: environment.reverb.scheme === 'https',
        encrypted: environment.reverb.scheme === 'https',
        enabledTransports: environment.reverb.scheme === 'https' ? ['wss'] : ['ws'],
        disableStats: true,
        channelAuthorization: {
          endpoint: `${environment.apiUrl}/broadcasting/auth`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      // Create Echo instance
      this.echo = new Echo({
        broadcaster: 'reverb',
        key: environment.reverb.key,
        client: pusher,
        channelAuthorization: {
          endpoint: `${environment.apiUrl}/broadcasting/auth`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      // Set up connection event handlers
      this.setupConnectionHandlers(pusher);

      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ WebSocket connection established');
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket connection:', error);
      this.isConnected = false;
      this.handleReconnection();
      throw error;
    }
  }

  private setupConnectionHandlers(pusher: any) {
    pusher.connection.bind('connected', () => {
      console.log('🎉 Pusher connection established');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    pusher.connection.bind('disconnected', () => {
      console.log('💔 Pusher connection disconnected');
      this.isConnected = false;
      this.handleReconnection();
    });

    pusher.connection.bind('error', (error: any) => {
      console.error('❌ Pusher connection error:', error);
      this.isConnected = false;
      this.handleReconnection();
    });

    pusher.connection.bind('failed', () => {
      console.error('❌ Pusher connection failed completely');
      this.isConnected = false;
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
    );

    setTimeout(() => {
      if (!this.isConnected && this.authService.isAuthenticated()) {
        this.connect().catch(console.error);
      }
    }, this.reconnectInterval * this.reconnectAttempts);
  }

  disconnect(): void {
    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
      this.isConnected = false;
      console.log('🔌 WebSocket disconnected');
    }
  }

  getEcho(): any {
    return this.echo;
  }

  isWebSocketConnected(): boolean {
    return this.isConnected && this.echo !== null;
  }

  // Join a private channel (for chat rooms)
  joinPrivateChannel(channelName: string) {
    console.log('📢 Attempting to join private channel:', channelName);

    if (!this.echo || !this.isConnected) {
      console.error('❌ WebSocket not connected. Call connect() first.');
      throw new Error('WebSocket not connected');
    }

    try {
      const channel = this.echo.private(channelName);
      console.log('📢 Channel created:', channelName);

      // Add debugging event listeners
      channel.subscribed(() => {
        console.log('✅ Successfully subscribed to channel:', channelName);
      });

      channel.error((error: any) => {
        console.error(
          '❌ Channel subscription error for',
          channelName,
          ':',
          error
        );
      });

      return channel;
    } catch (error) {
      console.error(`❌ Failed to join private channel ${channelName}:`, error);
      throw error;
    }
  }

  // Leave a channel
  leaveChannel(channelName: string): void {
    if (!this.echo) {
      return;
    }

    try {
      this.echo.leave(channelName);
      console.log(`📢 Left channel: ${channelName}`);
    } catch (error) {
      console.error(`❌ Failed to leave channel ${channelName}:`, error);
    }
  }

  // Join a presence channel (for typing indicators, user presence)
  joinPresenceChannel(channelName: string) {
    if (!this.echo || !this.isConnected) {
      console.error('❌ WebSocket not connected. Call connect() first.');
      throw new Error('WebSocket not connected');
    }

    try {
      const channel = this.echo.join(channelName);
      console.log(`📢 Joined presence channel: ${channelName}`);
      return channel;
    } catch (error) {
      console.error(
        `❌ Failed to join presence channel ${channelName}:`,
        error
      );
      throw error;
    }
  }
}
