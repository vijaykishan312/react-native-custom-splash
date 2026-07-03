import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Show the splash screen
   */
  show(): void;

  /**
   * Hide the splash screen
   * @param animated - Whether to animate the hide transition
   * @returns Promise that resolves to true if successful
   */
  hide(animated: boolean): Promise<boolean>;

  /**
   * Show the splash screen with animation
   */
  showAnimated?(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SplashScreen',
);
