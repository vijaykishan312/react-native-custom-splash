import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-custom-splash' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- Run 'pod install' in the ios/ directory\n", default: '' }) +
  '- Rebuild the app after installing the package\n' +
  '- If you are using Expo, run npx expo prebuild\n';

// Try TurboModule (New Architecture) first, then fall back to legacy NativeModules
let SplashScreenModule: any;
try {
  SplashScreenModule = TurboModuleRegistry.get('SplashScreen');
} catch {
  // TurboModuleRegistry not available on old architecture
}

if (!SplashScreenModule) {
  SplashScreenModule =
    NativeModules.SplashScreen || NativeModules.SplashScreenModule;
}

if (!SplashScreenModule && __DEV__) {
  console.warn(
    `[react-native-custom-splash] Native module not found. ` +
    `If you are testing or using Expo Go, this is normal and the splash methods will be no-ops. ` +
    `For production or development clients, make sure to rebuild the native app.\n` +
    LINKING_ERROR
  );
}

export interface SplashScreenInterface {
  /**
   * Show the splash screen
   */
  show(): void;
  
  /**
   * Hide the splash screen
   * @param animated - Whether to animate the hide transition (default: false)
   * @returns Promise that resolves to true if successful
   */
  hide(animated?: boolean): Promise<boolean>;

  /**
   * Show the splash screen with animation (Lottie/video if configured)
   * Falls back to static show() if no animation assets are bundled
   */
  showAnimated?(): void;
}

const SplashScreen: SplashScreenInterface = {
  show: () => {
    if (SplashScreenModule?.show) {
      if (__DEV__) {
        console.log('📱 Calling SplashScreen.show()');
      }
      SplashScreenModule.show();
    } else {
      console.warn('⚠️ SplashScreen.show() not available');
    }
  },
  
  hide: async (animated: boolean = false): Promise<boolean> => {
    if (SplashScreenModule?.hide) {
      if (__DEV__) {
        console.log('📱 Calling SplashScreen.hide(animated:', animated, ')');
      }
      try {
        return await SplashScreenModule.hide(animated);
      } catch (error) {
        console.error('❌ Error hiding splash screen:', error);
        return false;
      }
    } else {
      console.warn('⚠️ SplashScreen.hide() not available');
      return false;
    }
  },

  showAnimated: () => {
    if (SplashScreenModule?.showAnimated) {
      if (__DEV__) {
        console.log('📱 Calling SplashScreen.showAnimated()');
      }
      SplashScreenModule.showAnimated();
    } else if (SplashScreenModule?.show) {
      if (__DEV__) {
        console.log('📱 Calling SplashScreen.show() (fallback from showAnimated)');
      }
      SplashScreenModule.show();
    } else {
      console.warn('⚠️ SplashScreen.showAnimated() not available');
    }
  },
};

export default SplashScreen;
