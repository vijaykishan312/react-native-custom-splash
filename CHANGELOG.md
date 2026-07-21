# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.0] - 2026-07-21

### Added
- 📐 **Responsive multi-device support** — splash screen now adapts to all iPhone, iPad, and Android phone/tablet sizes automatically.
- 🔢 **`logoWidth` now accepts percentage strings** (e.g. `"35%"`) on both iOS and Android — interpreted as a percentage of the shorter screen dimension, so the logo scales proportionally across all screen sizes. Plain point/dp values still work unchanged.
- 📐 **Expo storyboard is now device-agnostic** — root view uses `autoresizingMask` instead of a hardcoded `393×852` frame; logo uses an Auto Layout proportional width multiplier constraint instead of fixed pixels.

### Changed
- 🎯 **Default logo size** changed from a fixed `150pt/dp` to **25% of the shorter screen dimension** on both platforms (≈80pt on iPhone SE, ≈130pt on iPhone 15 Pro, ≈260pt on iPad Pro 12.9"). Explicit `logoWidth` overrides this.
- 📹 **iOS video player** — `AVPlayerLayer` frame now updates on device rotation (important for iPad landscape).
- 📹 **Android video player** — `VideoView` sizes itself based on the actual video's aspect ratio via `OnPreparedListener`, preventing stretching on wide tablet screens.
- 🎞️ **`slideUp` animation offset** is now `25%` of screen height (was a hardcoded `200pt/200f`) on both iOS and Android, so the slide distance is proportional on every device.
- 🪟 **Android dialog** now explicitly calls `setLayout(MATCH_PARENT, MATCH_PARENT)` to guarantee full-screen coverage on tablets.
- 🍎 **iOS window restore** after hide now uses the modern scene-based API (`connectedScenes`) instead of the deprecated `UIApplication.shared.windows`.

## [3.1.1] - 2026-07-04


### Added
- 🎬 Added **Lottie animation support** (requires `lottie-ios` on iOS, built-in on Android).
- 🎭 Added **native logo animation presets** (`fadeIn`, `scaleUp`, `bounce`, `pulse`, `slideUp`).
- 📹 Added **video splash screen support** (`.mp4`).
- 🛡️ All new features are **100% additive** and backwards compatible. Existing static images continue to work perfectly.
- ⚡ Exposed new `SplashScreen.showAnimated()` API in JS.

## [3.1.0] - 2026-07-03

### Added
- New Architecture (TurboModules) support for React Native 0.76+
- `CHANGELOG.md` following Keep a Changelog format
- `CONTRIBUTING.md` with contribution guidelines
- `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1)
- `SECURITY.md` with vulnerability reporting instructions
- `react-native.config.js` for proper auto-linking

### Changed
- Updated `src/index.tsx` to use TurboModules with graceful fallback to legacy `NativeModules`
- Added `codegenConfig` to `package.json` for Codegen compatibility

## [3.0.4] - 2025-12-25

### Fixed
- Image directly shows in splash screen storybook
- iOS splash screen display issues

## [3.0.3] - 2025-12-25

### Fixed
- Prebuild configuration issues

## [3.0.0] - 2025-12-25

### Added
- New Architecture awareness
- Improved TypeScript definitions

### Changed
- Major version bump for breaking API changes

## [2.2.0] - 2025-12-25

### Added
- Enhanced logo support on both platforms
- Background image + logo layering

## [2.1.0] - 2025-12-25

### Added
- Auto image copy to native folders via Expo config plugin
- Multi-density image support for Android

## [2.0.0] - 2025-12-24

### Added
- Automatic image handling via Expo plugin
- Comprehensive input validation
- 4 configuration options (full image, color+logo, image+logo, color only)

### Changed
- Complete rewrite of the Expo config plugin

## [1.0.0] - 2025-12-24

### Added
- Initial release
- Native iOS and Android splash screen module
- Expo compatibility
- `show()` and `hide(animated)` API
- TypeScript support
