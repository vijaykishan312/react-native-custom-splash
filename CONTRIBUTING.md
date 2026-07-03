# Contributing to react-native-custom-splash

Thank you for your interest in contributing! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

1. Check the [existing issues](https://github.com/vijaykishan312/react-native-custom-splash/issues) to see if it's already reported.
2. If not, [open a new issue](https://github.com/vijaykishan312/react-native-custom-splash/issues/new) with:
   - A clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (React Native version, Expo SDK, OS, etc.)

### Suggesting Features

Open an issue with the `enhancement` label describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the code style guidelines below
4. **Test your changes**:
   ```bash
   # Run the example app
   cd example
   npx expo prebuild --clean
   npx expo run:ios   # or run:android
   ```
5. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add your feature description"
   ```
6. **Push** and open a Pull Request

## Code Style Guidelines

- Use TypeScript for all source files
- Follow existing code patterns and naming conventions
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use meaningful variable and function names

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `chore:` — Maintenance tasks
- `refactor:` — Code refactoring (no feature/fix)
- `test:` — Adding or updating tests

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/react-native-custom-splash.git
cd react-native-custom-splash

# Install dependencies
npm install

# Navigate to example app
cd example
npm install

# Run on iOS
npx expo prebuild --clean
npx expo run:ios

# Run on Android
npx expo run:android
```

## Project Structure

```
react-native-custom-splash/
├── src/                  # TypeScript source (JS module)
├── ios/                  # Native iOS code (Objective-C)
├── android/              # Native Android code (Java)
├── plugin/               # Expo config plugin
├── example/              # Example Expo app
├── app.plugin.js         # Expo plugin entry point
└── package.json
```

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
