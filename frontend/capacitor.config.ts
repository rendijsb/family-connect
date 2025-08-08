import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.familyconnect',
  appName: 'Family Connect',
  webDir: 'dist',
  server: {
    url: 'http://192.168.1.118:4200',
    cleartext: true,
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 500, // Much shorter - 0.5 seconds
      backgroundColor: "#1a1a1a",
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a1a'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark'
    },
    Preferences: {
      group: 'FamilyConnectApp'
    }
  }
};

export default config;
