# react-native-custom-splash 🎨

A powerful and easy-to-use custom splash screen module for React Native with native iOS and Android support, **fully compatible with Expo**!

## ✨ Features

- 🚀 **Zero Native Code Required** - Just configure in `app.json`
- 🎨 **Auto Image Setup** - Automatically copies images from your project to native folders
- 🖼️ **Background + Logo Support** - Add a full background image and/or center logo
- 🎨 **Customizable Colors** - Set your brand's background color
- 📱 **Native Performance** - Pure native implementation for both iOS and Android
- ⚡ **Expo Compatible** - Works seamlessly with Expo managed workflow
- 🔄 **Simple API** - Easy show/hide methods with animation support

## 📦 Installation

```bash
npm install react-native-custom-splash
# or
yarn add react-native-custom-splash
```

## 🎯 Quick Start (The Easy Way!)

### Step 1: Add your images to your project

Create an `assets` folder in your project root and add your images:

```
your-project/
├── assets/
│   ├── splash-background.png  (your full background image - optional)
│   └── logo.png               (your center logo - optional)
├── app.json
└── ...
```

### Step 2: Configure in app.json

Choose one of the 4 configuration options below based on your needs:

## 🎨 Configuration Examples

### **Option 1: Single Full Image** (Most Common) ⭐

Perfect for a complete branded splash screen with your custom design.

```json
{
  "expo": {
    "name": "YourApp",
    "plugins": [
      [
        "react-native-custom-splash",
        {
          "image": "./assets/splash.png"
        }
      ]
    ]
  }
}
```

**Project Structure:**
```
your-project/
├── assets/
│   └── splash.png          ← Your full-screen image (1242×2688px)
└── app.json
```

---

### **Option 2: Background Color + Center Logo**

Great for a clean, minimal look with just your logo.

```json
{
  "expo": {
    "name": "YourApp",
    "plugins": [
      [
        "react-native-custom-splash",
        {
          "backgroundColor": "#4F46E5",
          "logo": "./assets/logo.png",
          "logoWidth": 180
        }
      ]
    ]
  }
}
```

**Project Structure:**
```
your-project/
├── assets/
│   └── logo.png            ← Your center logo (512×512px)
└── app.json
```

---

### **Option 3: Background Image + Center Logo**

Maximum customization - background image with logo on top.

```json
{
  "expo": {
    "name": "YourApp",
    "plugins": [
      [
        "react-native-custom-splash",
        {
          "backgroundColor": "#FFFFFF",
          "image": "./assets/splash-bg.png",
          "logo": "./assets/logo.png",
          "logoWidth": 150
        }
      ]
    ]
  }
}
```

**Project Structure:**
```
your-project/
├── assets/
│   ├── splash-bg.png       ← Background image
│   └── logo.png            ← Center logo
└── app.json
```

---

### **Option 4: Only Background Color**

Simple solid color background.

```json
{
  "expo": {
    "name": "YourApp",
    "plugins": [
      [
        "react-native-custom-splash",
        {
          "backgroundColor": "#FF6B6B"
        }
      ]
    ]
  }
}
```

---

### Step 3: Run prebuild

```bash
npx expo prebuild --clean
```

**That's it!** 🎉 The plugin will automatically:
- ✅ Copy your images to iOS and Android native folders
- ✅ Configure the native splash screen
- ✅ Set up all the required files
- ✅ Handle different screen densities

### Step 4: Use in your app

```javascript
import SplashScreen from 'react-native-custom-splash';
import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Hide splash screen after app loads
    setTimeout(() => {
      SplashScreen.hide(true); // true = animated
    }, 2000);
  }, []);

  return (
    // Your app content
  );
}
```

## ⚙️ Configuration Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `backgroundColor` | `string` | `#FFFFFF` | Background color (hex format: #RRGGBB) |
| `image` | `string` | `null` | Path to full background image (optional) |
| `logo` | `string` | `null` | Path to center logo image (optional) |
| `logoWidth` | `number` | `150` | Width of the center logo in pixels |

## 📱 API Reference

### `SplashScreen.hide(animated)`

Hides the splash screen.

**Parameters:**
- `animated` (boolean): Whether to animate the hide transition. Default: `true`

**Returns:** Promise<boolean>

**Example:**
```javascript
// With animation (recommended)
await SplashScreen.hide(true);

// Without animation
await SplashScreen.hide(false);
```

### `SplashScreen.show()`

Shows the splash screen (usually not needed as it shows automatically on app launch).

**Example:**
```javascript
SplashScreen.show();
```

## 🎨 Image Guidelines

### Background Image
- **Recommended size:** 1242 x 2688 px (iPhone 13 Pro Max size)
- **Format:** PNG or JPG
- **Aspect ratio:** Match your target device screens
- **Tip:** The plugin will handle different screen densities automatically

### Logo Image
- **Recommended size:** 512 x 512 px (or your desired aspect ratio)
- **Format:** PNG with transparency recommended
- **Tip:** The logo will be centered and sized according to `logoWidth`

## 🔧 Advanced Usage

### TypeScript Support

Full TypeScript support is included:

```typescript
import SplashScreen, { SplashScreenInterface } from 'react-native-custom-splash';

const hideSplash = async (): Promise<void> => {
  await SplashScreen.hide(true);
};
```

### React Navigation Integration

```javascript
import { NavigationContainer } from '@react-navigation/native';
import SplashScreen from 'react-native-custom-splash';

function App() {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    async function prepare() {
      try {
        // Load your resources here
        await loadFonts();
        await loadData();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  React.useEffect(() => {
    if (isReady) {
      SplashScreen.hide(true);
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer>
      {/* Your navigation */}
    </NavigationContainer>
  );
}
```

## 🔄 Migration from Manual Setup

If you were using the old manual method, you can now simplify:

**Before (Manual Method):**
1. ❌ Manually copy images to `ios/` folder
2. ❌ Open Xcode and add images to Assets
3. ❌ Manually copy images to `android/app/src/main/res/drawable/`
4. ❌ Manually edit `colors.xml`
5. ❌ Configure multiple drawable folders

**After (Automatic Method):**
1. ✅ Add images to `assets/` folder
2. ✅ Configure in `app.json`
3. ✅ Run `npx expo prebuild --clean`
4. ✅ Done!

## 🛠️ Manual Setup (Non-Expo Projects)

If you're not using Expo, you can still use this package with manual setup:

### iOS

Add your splash image to your Xcode project:
1. Open your project in Xcode
2. Add an image asset named `splash_image` for background and/or `splash_logo` for center logo to your Assets catalog

### Android

Add your images to Android resources:
1. Add `splash_image.png` (background) and/or `splash_logo.png` (center logo) to `android/app/src/main/res/drawable/`
2. Customize the background color in `android/app/src/main/res/values/colors.xml`:

```xml
<color name="splash_background">#FFFFFF</color>
```

## ❓ Troubleshooting

### ⚠️ Error: "Plugin is an unexpected object"

**Full Error:**
```
PluginError: Plugin is an unexpected object, with keys: "backgroundColor, image, logoWidth".
```

**Cause:** Your plugin configuration is not properly wrapped in square brackets.

**❌ Wrong:**
```json
{
  "plugins": [
    "react-native-custom-splash",
    {
      "backgroundColor": "#FF6B6B"
    }
  ]
}
```

**✅ Correct:**
```json
{
  "plugins": [
    [
      "react-native-custom-splash",
      {
        "backgroundColor": "#FF6B6B"
      }
    ]
  ]
}
```

**Key Point:** When passing configuration to a plugin, wrap BOTH the plugin name and the config object in square brackets `[]`.

---

### Splash screen not showing
- Make sure you run `npx expo prebuild --clean` after changing configuration
- Check that your image paths in `app.json` are correct and files exist
- Verify images are in the `assets/` folder
- Try cleaning your build:
  - iOS: `cd ios && pod install && cd ..`
  - Android: `cd android && ./gradlew clean && cd ..`

### Images not updating
- Run `npx expo prebuild --clean` to force regeneration of native projects
- Delete `ios/` and `android/` folders, then run `npx expo prebuild --clean` again
- Clear build caches:
  - iOS: `rm -rf ios/Pods ios/build`
  - Android: `cd android && ./gradlew clean && cd ..`

### Image paths not working
- Use relative paths from project root: `"./assets/splash.png"` ✅
- Don't use absolute paths: `"/Users/..."` ❌
- Make sure the file extension matches (`.png`, `.jpg`)
- Check file actually exists at that path

### Background color not working
- Use hex format: `"#FF6B6B"` ✅
- Don't forget the `#`: `"FF6B6B"` ❌
- Use 6-digit format: `"#FFFFFF"` ✅ not `"#FFF"` ❌

### TypeScript errors
- Make sure you have `@types/react` and `@types/react-native` installed
- The package includes TypeScript definitions
- Try: `npm install --save-dev @types/react @types/react-native`

### Pod install fails (iOS)
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

### Still having issues?
1. Delete `node_modules/` and reinstall: `npm install` or `yarn install`
2. Delete `ios/` and `android/` folders
3. Run `npx expo prebuild --clean`
4. Check the [GitHub Issues](https://github.com/vijaykishan312/react-native-custom-splash/issues)

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💖 Support

If you find this package helpful, please give it a ⭐️ on [GitHub](https://github.com/vijaykishan312/react-native-custom-splash)!

---

Made with ❤️ for the React Native community
