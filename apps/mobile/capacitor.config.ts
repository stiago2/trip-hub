import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.triphub.app',
  appName: 'TripHub',
  webDir: '../../dist/apps/mobile/browser',
  server: {
    androidScheme: 'https',
  },
};

export default config;
