import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prohorsematch.app',
  appName: 'ProHorseMatch',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
