# react-native-custom-splash Example App

This example demonstrates how to use `react-native-custom-splash` in your Expo app.

## 📁 Project Structure

```
example/
├── assets/
│   ├── splash-bg.png       ← Background image for splash
│   ├── logo.png            ← Center logo
│   ├── icon.png            ← App icon
│   └── ...
├── app.json                ← Configuration with plugin setup
├── App.tsx                 ← Main app with SplashScreen usage
└── package.json
```

## 🚀 Running the Example

### 1. Install Dependencies

```bash
cd example
npm install
```

### 2. Run Prebuild

```bash
npx expo prebuild --clean
```

### 3. Run on Device/Simulator

**iOS:**
```bash
npx expo run:ios
```

**Android:**
```bash
npx expo run:android
```

## 🎨 Configuration Examples

The example `app.json` is configured with **Option 3** (Background Image + Logo):

```json
{
  "plugins": [
    [
      "react-native-custom-splash",
      {
        "backgroundColor": "#4F46E5",
        "image": "./assets/splash-bg.png",
        "logo": "./assets/logo.png",
        "logoWidth": 180
      }
    ]
  ]
}
```

### Try Different Configurations:

#### Option 1: Single Full Image (Simplest)
```json
{
  "plugins": [
    [
      "react-native-custom-splash",
      {
        "image": "./assets/splash.png"
      }
    ]
  ]
}
```

#### Option 2: Color + Logo (Minimal)
```json
{
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
```

#### Option 4: Only Color (Fastest)
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

**After changing configuration:**
```bash
npx expo prebuild --clean
```

## 💡 Usage in Code

Check `App.tsx` to see how the splash screen is used:

```typescript
import SplashScreen from 'react-native-custom-splash';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Hide splash after 2 seconds
    const timer = setTimeout(() => {
      SplashScreen.hide(true); // true = with animation
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Your app content...
}
```

## 🖼️ Image Guidelines

### Background Image (`splash-bg.png`)
- **Size:** 1242 x 2688 px (iPhone 13 Pro Max)
- **Format:** PNG or JPG
- **Aspect Ratio:** 9:19.5 (standard phone ratio)
- **Design:** Center-weighted content

### Logo (`logo.png`)
- **Size:** 512 x 512 px (or your aspect ratio)
- **Format:** PNG with transparency
- **Design:** Will be scaled based on `logoWidth`

## 🔧 Troubleshooting

### Changes not reflecting?
```bash
# Clean everything and rebuild
npx expo prebuild --clean
cd ios && pod install && cd ..
```

### Images not showing?
- Check image paths in `app.json` are correct
- Ensure images exist in `assets/` folder
- Run `npx expo prebuild --clean`

### TypeScript errors?
```bash
npm install --save-dev @types/react @types/react-native
```

## 📚 Learn More

- [Main README](../README.md)
- [npm Package](https://www.npmjs.com/package/react-native-custom-splash)
- [GitHub Repository](https://github.com/vijaykishan312/react-native-custom-splash)
