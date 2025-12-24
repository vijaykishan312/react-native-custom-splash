# react-native-custom-splash

A custom splash screen module for React Native with native iOS and Android support, fully compatible with Expo.

## Features

- ✅ **Native iOS & Android** splash screens
- ✅ **Expo compatible** with config plugin
- ✅ **Customizable** splash images
- ✅ **Animated transitions** for smooth hiding
- ✅ **TypeScript** support
- ✅ **Auto-show** on app launch
- ✅ **Manual control** with show/hide methods

## Installation

### For Expo Projects

```bash
npm install react-native-custom-splash
# or
yarn add react-native-custom-splash
```

Add the plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      "react-native-custom-splash"
    ]
  }
}
```

Then run prebuild:

```bash
npx expo prebuild
```

### For Bare React Native Projects

```bash
npm install react-native-custom-splash
# or
yarn add react-native-custom-splash
```

#### iOS Setup

1. Install pods:
```bash
cd ios && pod install && cd ..
```

2. The module will be automatically linked.

#### Android Setup

1. Add the package to your `MainApplication.kt`:

```kotlin
import com.rncustomsplash.SplashScreenPackage

// In getPackages() method:
packages.add(SplashScreenPackage())
```

2. Show splash in `MainActivity.kt`:

```kotlin
import com.rncustomsplash.SplashScreenModule

override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreenModule.show(this)
    super.onCreate(savedInstanceState)
}
```

## Adding Custom Splash Images

### iOS

Add your splash image to your Xcode project:
1. Open your project in Xcode
2. Add an image asset named `splash` to your Assets catalog
3. Or add a `splash.png` file to your project

### Android

Add your splash image to Android resources:
1. Add `splash.png` (or `splash.jpg`) to `android/app/src/main/res/drawable/`
2. Or create a drawable resource named `splash`

You can also customize the background color in `android/app/src/main/res/values/colors.xml`:

```xml
<color name="splash_background">#FFFFFF</color>
```

## Usage

```typescript
import SplashScreen from 'react-native-custom-splash';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Hide splash screen after app is ready
    // The splash screen shows automatically on launch
    
    // Simple hide (instant)
    SplashScreen.hide(false);
    
    // Or with animation
    SplashScreen.hide(true);
    
    // You can also show it again
    // SplashScreen.show();
  }, []);

  return (
    // Your app content
  );
}
```

## Example Project

A complete working example is included in the `example/` directory. It demonstrates:

- ✅ Automatic splash screen on launch
- ✅ Loading progress simulation
- ✅ Animated hide transitions
- ✅ Manual show/hide controls
- ✅ Full TypeScript integration

### Run the Example

```bash
cd example
npm install
npx expo prebuild
npm run ios  # or npm run android
```

See [example/README.md](./example/README.md) for detailed instructions.

## API Reference

### `SplashScreen.show()`

Shows the splash screen.

```typescript
SplashScreen.show();
```

### `SplashScreen.hide(animated?)`

Hides the splash screen.

**Parameters:**
- `animated` (boolean, optional): Whether to animate the hide transition. Default: `false`

**Returns:** `Promise<boolean>` - Resolves to `true` if successful

```typescript
// Hide instantly
await SplashScreen.hide();

// Hide with fade animation
await SplashScreen.hide(true);
```

## Example

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import SplashScreen from 'react-native-custom-splash';

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load your resources here
        await loadFonts();
        await loadData();
        
        // Artificially delay for demo
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide splash screen with animation when app is ready
      SplashScreen.hide(true);
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null; // Splash screen is visible
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>App is ready!</Text>
    </View>
  );
}
```

## Troubleshooting

### iOS

**Module not found:**
- Make sure you ran `pod install` in the `ios/` directory
- Clean build folder: `cd ios && rm -rf build && cd ..`
- Rebuild the app

**Splash image not showing:**
- Verify the image is named `splash` in your Assets catalog
- Check that the image is added to the target

### Android

**Module not found:**
- Verify `SplashScreenPackage()` is added to `MainApplication.kt`
- Clean build: `cd android && ./gradlew clean && cd ..`
- Rebuild the app

**Splash image not showing:**
- Check that `splash.png` exists in `res/drawable/`
- Verify the resource name matches in `splash_screen.xml`

### Expo

**Plugin not working:**
- Make sure you added the plugin to `app.json`
- Run `npx expo prebuild --clean`
- Rebuild the app

## TypeScript

This package includes TypeScript definitions. The module exports the following interface:

```typescript
interface SplashScreenInterface {
  show(): void;
  hide(animated?: boolean): Promise<boolean>;
}
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Issues

If you encounter any issues, please file them on the GitHub repository.
