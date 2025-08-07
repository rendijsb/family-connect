import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.myawesomeapp',
  appName: 'My Awesome App',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
