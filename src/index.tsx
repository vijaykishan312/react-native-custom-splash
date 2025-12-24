import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-custom-splash' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- Run 'pod install' in the ios/ directory\n", default: '' }) +
  '- Rebuild the app after installing the package\n' +
  '- If you are using Expo, run npx expo prebuild\n';

// Try both module names for compatibility
const SplashScreenModule =
  NativeModules.SplashScreen || NativeModules.SplashScreenModule;

if (!SplashScreenModule) {
  throw new Error(LINKING_ERROR);
}

if (__DEV__ && !SplashScreenModule) {
  console.error(
    '❌ SplashScreen native module not found!',
    '\nAvailable modules:',
    Object.keys(NativeModules).filter((m) => m.includes('Splash'))
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
};

export default SplashScreen;
