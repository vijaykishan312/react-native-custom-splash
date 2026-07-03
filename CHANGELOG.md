# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
