import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arborik.redboard',
  appName: 'RedBoard',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#C8102E',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#C8102E',
    },
  },
  ios: {
    contentInset: 'never',
    allowsLinkPreview: false,
  },
  server: {
    allowNavigation: [
      '*.supabase.co',
      '*.supabase.io',
      'www.hudl.com',
      'hudl.com',
      '*.hudl.com',
    ],
  },
};

export default config;
