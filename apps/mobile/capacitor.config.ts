import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.triphub.app',
  appName: 'TripHub',
  webDir: '../../dist/apps/mobile/browser',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Deep link: triphub://auth/callback?token=xxx
    // iOS: register in Info.plist via Capacitor (automatic when using cap sync)
    // Android: register in AndroidManifest.xml via Capacitor (automatic)
    App: {
      // URL schemes handled by the app
    },
  },
};

export default config;
