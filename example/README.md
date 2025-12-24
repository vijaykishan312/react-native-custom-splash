# Example App for react-native-custom-splash

This example demonstrates how to use the `react-native-custom-splash` package in an Expo app.

## Features Demonstrated

- ✅ Automatic splash screen on app launch
- ✅ Animated hide transition after loading
- ✅ Manual show/hide controls
- ✅ Loading progress simulation
- ✅ TypeScript usage

## Running the Example

### Prerequisites

- Node.js installed
- Expo CLI installed (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or physical device)

### Setup

1. **Install dependencies:**
   ```bash
   cd example
   npm install
   ```

2. **Run prebuild (for native modules):**
   ```bash
   npx expo prebuild
   ```

3. **Add custom splash image (optional):**
   
   **For iOS:**
   - Open `ios/SplashScreenExample.xcworkspace` in Xcode
   - Add your `splash.png` to Assets.xcassets
   
   **For Android:**
   - Add `splash.png` to `android/app/src/main/res/drawable/`

### Run on iOS

```bash
npm run ios
# or
npx expo run:ios
```

### Run on Android

```bash
npm run android
# or
npx expo run:android
```

### Run on Web (limited splash support)

```bash
npm run web
```

## What to Expect

1. **App Launch:**
   - Custom splash screen appears immediately
   - Shows while app initializes resources

2. **Loading Complete:**
   - Splash screen fades out with smooth animation
   - Main app UI appears

3. **Interactive Demo:**
   - Test manual splash control with buttons
   - Try animated and instant hide options
   - Re-show splash screen on demand

## Code Overview

### App.tsx

The main app file demonstrates:

```typescript
import SplashScreen from 'react-native-custom-splash';

// Hide splash after app ready
useEffect(() => {
  if (appIsReady) {
    SplashScreen.hide(true); // with animation
  }
}, [appIsReady]);

// Manual controls
SplashScreen.show();
await SplashScreen.hide(false); // instant
```

### app.json

Expo configuration with plugin:

```json
{
  "expo": {
    "plugins": [
      "react-native-custom-splash"
    ]
  }
}
```

## Customization

### Change Splash Background Color

**iOS:** Update in Xcode or add to splash image  
**Android:** Edit `android/app/src/main/res/values/colors.xml`:

```xml
<color name="splash_background">#YOUR_COLOR</color>
```

### Use Different Splash Image

Replace the default `splash` asset with your own image named `splash.png` (or `splash.jpg`).

## Troubleshooting

**Splash not showing:**
- Make sure you ran `npx expo prebuild`
- Verify custom splash images are properly named and located
- Clean and rebuild: `rm -rf android/build ios/build`

**Module not found:**
- Run `npm install` in the example directory
- Ensure the parent package is built: `cd .. && npm pack`

**TypeScript errors:**
- Run `npm install` to get proper type definitions
- Check that `@types/react` and `@types/react-native` are installed

## Learn More

- [Package README](../README.md) - Full documentation
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)

## License

This example is part of the react-native-custom-splash package (MIT License).
