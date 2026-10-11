import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prohorsematch.app',
  appName: 'Pro Horse Match',
  webDir: 'dist/public',
  // Dark app colour behind the web page, so there is no white flash while the site loads
  backgroundColor: '#2b2b2b',
  server: {
    url: 'https://prohorsematch.com',
    androidScheme: 'https',
    cleartext: false
  }
};

export default config;
