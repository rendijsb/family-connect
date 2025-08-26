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

    if (this.isConnected && this.echo) {
      console.log('🔌 Already connected');
      return;
    }

    if (!this.authService.isAuthenticated()) {
      console.log('🔌 User not authenticated');
      throw new Error('User not authenticated');
    }

    console.log('🔌 Loading WebSocket libraries...');
    await this.loadLibraries();

    if (!Echo || !Pusher) {
      console.error('❌ WebSocket libraries not loaded');
      throw new Error('WebSocket libraries not available');
    }

    // Get token from auth service
    const token = this.authService.getToken();
    if (!token) {
      console.error('❌ No auth token available for WebSocket connection');
      throw new Error('No authentication token');
    }

    console.log('✅ Auth token retrieved');

    try {
      // Create Echo instance with proper Reverb configuration
      this.echo = new Echo({
        broadcaster: 'reverb',
        key: environment.reverb.key,
        wsHost: environment.reverb.host,
        wsPort: environment.reverb.port,
        wssPort: environment.reverb.port,
        forceTLS: environment.reverb.scheme === 'https',
        enabledTransports: environment.reverb.scheme === 'https' ? ['wss'] : ['ws'],
        authEndpoint: `${environment.apiUrl}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
        authorizer: (channel: any, options: any) => {
          return {
            authorize: (socketId: string, callback: Function) => {
              fetch(`${environment.apiUrl}/broadcasting/auth`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                  socket_id: socketId,
                  channel_name: channel.name,
                }),
              })
                .then(response => {
                  if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                  }
                  return response.json();
                })
                .then(data => {
                  callback(null, data);
                })
                .catch(error => {
                  console.error('❌ Channel authorization failed:', error);
                  callback(error, null);
                });
            }
          };
        },
      });

      // Set up connection event handlers
      this.setupConnectionHandlers();

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

  private setupConnectionHandlers() {
    if (!this.echo) return;

    // Listen for connection events if available
    if (this.echo.connector && this.echo.connector.pusher) {
      const pusher = this.echo.connector.pusher;

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
