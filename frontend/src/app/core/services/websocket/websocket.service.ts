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
    console.log('🔌 Current connection status:', this.isConnected);
    console.log('🔌 User authenticated:', this.authService.isAuthenticated());

    if (this.isConnected || !this.authService.isAuthenticated()) {
      console.log(
        '🔌 Skipping connection - already connected or not authenticated'
      );
      return;
    }

    console.log('🔌 Loading WebSocket libraries...');
    await this.loadLibraries();

    if (!Echo || !Pusher) {
      console.error('❌ WebSocket libraries not loaded');
      return;
    }
    console.log('✅ WebSocket libraries loaded successfully');

    const token = this.authService.authToken();
    if (!token) {
      console.error('❌ No auth token available for WebSocket connection');
      return;
    }
    console.log('✅ Auth token retrieved:', token?.substring(0, 20) + '...');

    try {
      console.log('🔌 Initializing Echo with config:', {
        broadcaster: 'reverb',
        key: environment.reverb.key,
        wsHost: environment.reverb.host,
        wsPort: environment.reverb.port,
        wssPort: environment.reverb.port,
        forceTLS: environment.reverb.scheme === 'https',
        enabledTransports: ['ws', 'wss'],
      });

      console.log('🌐 Connecting to WebSocket with HTTP protocol...');

      console.log(
        '🌐 Creating Echo instance with explicit HTTP configuration...'
      );

      // Configure Pusher explicitly for HTTP
      const pusherConfig = {
        cluster: '',
        host: environment.reverb.host,
        port: environment.reverb.port,
        scheme: 'http',
        useTLS: false,
        encrypted: false,
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        disabledTransports: [
          'sockjs',
          'xhr_polling',
          'xhr_streaming',
          'htmlfile',
        ],
        forceTLS: false,
        wsHost: environment.reverb.host,
        wsPort: environment.reverb.port,
        wssHost: environment.reverb.host,
        wssPort: environment.reverb.port,
      };

      console.log('🌐 Configuring Echo with forced HTTP settings...');

      // Create Pusher instance with explicit HTTP configuration
      const pusher = new Pusher(environment.reverb.key, {
        cluster: '',
        host: environment.reverb.host,
        port: environment.reverb.port,
        scheme: 'http',
        useTLS: false,
        encrypted: false,
        disableStats: true,
        enabledTransports: ['ws'],
        disabledTransports: [
          'wss',
          'sockjs',
          'xhr_polling',
          'xhr_streaming',
          'htmlfile',
        ],
        forceTLS: false,
        wsHost: environment.reverb.host,
        wsPort: environment.reverb.port,
        wssHost: environment.reverb.host,
        wssPort: environment.reverb.port,
        channelAuthorization: {
          endpoint: `${environment.apiUrl}/broadcasting/auth`,
          transport: 'ajax',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      this.echo = new Echo({
        broadcaster: 'reverb',
        key: environment.reverb.key,
        client: pusher,
        wsHost: environment.reverb.host,
        wsPort: environment.reverb.port,
        wssPort: environment.reverb.port,
        forceTLS: false,
        enabledTransports: ['ws'],
        disableStats: true,
        channelAuthorization: {
          endpoint: `${environment.apiUrl}/broadcasting/auth`,
          transport: 'ajax',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      this.isConnected = true;
      console.log('✅ WebSocket Echo instance created successfully');

      // Handle Pusher connection events
      pusher.connection.bind('connecting', () => {
        console.log('🔄 Pusher connecting...');
      });

      pusher.connection.bind('connected', () => {
        console.log('🎉 Pusher connection established');
        console.log('🔗 Pusher connection details:', {
          socketId: pusher.connection.socket_id,
          transport: pusher.connection.transport?.name,
          host: pusher.connection.options?.host,
          port: pusher.connection.options?.port,
        });
      });

      pusher.connection.bind('disconnected', () => {
        console.log('💔 Pusher connection disconnected');
      });

      pusher.connection.bind('error', (error: any) => {
        console.error('❌ Pusher connection error:', error);
      });

      pusher.connection.bind('failed', () => {
        console.error('❌ Pusher connection failed completely');
      });

      // Handle Echo connection events
      this.echo.connector.pusher.connection.bind('connected', () => {
        console.log('🎉 WebSocket connection established');
      });

      this.echo.connector.pusher.connection.bind('disconnected', () => {
        console.log('💔 WebSocket connection disconnected');
        this.isConnected = false;
      });

      this.echo.connector.pusher.connection.bind('error', (error: any) => {
        console.error('❌ WebSocket connection error:', error);
        this.isConnected = false;
      });

      this.echo.connector.pusher.connection.bind('connecting', () => {
        console.log('🔄 WebSocket connecting...');
      });

      this.echo.connector.pusher.connection.bind('unavailable', () => {
        console.log('❌ WebSocket unavailable');
      });
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket connection:', error);
      this.isConnected = false;
    }
  }

  disconnect(): void {
    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
      this.isConnected = false;
      console.log('WebSocket disconnected');
    }
  }

  getEcho(): any {
    return this.echo;
  }

  isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  // Join a private channel (for chat rooms)
  joinPrivateChannel(channelName: string) {
    console.log('📢 Attempting to join private channel:', channelName);

    if (!this.echo) {
      console.error('❌ WebSocket not connected. Call connect() first.');
      return null;
    }

    try {
      console.log('✅ Echo is available, joining channel:', channelName);
      const channel = this.echo.private(channelName);
      console.log('📢 Channel created:', channelName, channel);

      // Add channel-specific event listeners for debugging
      if (channel) {
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
      }

      return channel;
    } catch (error) {
      console.error(`❌ Failed to join private channel ${channelName}:`, error);
      return null;
    }
  }

  // Leave a channel
  leaveChannel(channelName: string): void {
    if (!this.echo) {
      return;
    }

    try {
      this.echo.leave(channelName);
      console.log(`Left channel: ${channelName}`);
    } catch (error) {
      console.error(`Failed to leave channel ${channelName}:`, error);
    }
  }

  // Join a presence channel (for typing indicators, user presence)
  joinPresenceChannel(channelName: string) {
    if (!this.echo) {
      console.error('WebSocket not connected. Call connect() first.');
      return null;
    }

    try {
      const channel = this.echo.join(channelName);
      console.log(`Joined presence channel: ${channelName}`);
      return channel;
    } catch (error) {
      console.error(`Failed to join presence channel ${channelName}:`, error);
      return null;
    }
  }
}
