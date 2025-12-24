const {
    withDangerousMod,
    withPlugins,
    withMainActivity,
    withMainApplication,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Plugin to add SplashScreenModule to Android
 */
const withSplashScreenAndroid = (config) => {
    // Add package to MainApplication
    config = withMainApplication(config, async (config) => {
        const { modResults } = config;
        let contents = modResults.contents;

        // Add import if not already present
        if (!contents.includes('import com.rncustomsplash.SplashScreenPackage')) {
            contents = contents.replace(
                /(package\s+[\w.]+)/,
                '$1\nimport com.rncustomsplash.SplashScreenPackage'
            );
        }

        // Add package to packages list
        if (!contents.includes('SplashScreenPackage()')) {
            contents = contents.replace(
                /(packages\.apply\s*{[^}]*)/,
                '$1\n              add(SplashScreenPackage())'
            );
        }

        modResults.contents = contents;
        return config;
    });

    // Add splash initialization to MainActivity
    config = withMainActivity(config, async (config) => {
        const { modResults } = config;
        let contents = modResults.contents;

        // Add import if not already present
        if (!contents.includes('import com.rncustomsplash.SplashScreenModule')) {
            contents = contents.replace(
                /(package\s+[\w.]+)/,
                '$1\nimport com.rncustomsplash.SplashScreenModule'
            );
        }

        // Add splash show in onCreate
        if (!contents.includes('SplashScreenModule.show(this)')) {
            contents = contents.replace(
                /(override\s+fun\s+onCreate\([^)]*\)\s*{)/,
                '$1\n    // Show splash screen\n    SplashScreenModule.show(this)\n'
            );
        }

        modResults.contents = contents;
        return config;
    });

    return config;
};

/**
 * Plugin to add SplashScreenModule to iOS
 */
const withSplashScreenIOS = (config) => {
    return withDangerousMod(config, [
        'ios',
        async (config) => {
            // The native files will be linked via CocoaPods
            // No additional configuration needed here
            return config;
        },
    ]);
};

/**
 * Main plugin export
 */
module.exports = (config) => {
    return withPlugins(config, [
        withSplashScreenAndroid,
        withSplashScreenIOS,
    ]);
};
