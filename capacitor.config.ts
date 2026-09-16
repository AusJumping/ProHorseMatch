import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prohorsematch.app',
  appName: 'Pro Horse Match',
  webDir: 'dist/public',
  server: {
    url: 'https://prohorsematch.com',
    androidScheme: 'https',
    cleartext: false
  }
};

export default config;
