const {
    withDangerousMod,
    withPlugins,
    withMainActivity,
    withMainApplication,
    AndroidConfig,
    IOSConfig,
    withAndroidColors,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');
const { withForcediOSSplash, withAppDelegateSplash } = require('./withCustomSplash');

/**
 * Validate and normalize plugin configuration
 */
function validateAndNormalizeConfig(props) {
    // Check if props is valid
    if (!props || typeof props !== 'object') {
        console.warn('⚠️  react-native-custom-splash: No configuration provided, using defaults');
        return {
            backgroundColor: '#FFFFFF',
            image: null,
            logo: null,
            logoWidth: 150,
            logoDuration: 2000,
            animationDuration: 0,
            videoDuration: 0,
        };
    }

    // Validate backgroundColor
    if (props.backgroundColor && !/^#[0-9A-Fa-f]{6}$/.test(props.backgroundColor)) {
        console.warn(`⚠️  react-native-custom-splash: Invalid backgroundColor "${props.backgroundColor}", using default #FFFFFF`);
        props.backgroundColor = '#FFFFFF';
    }

    // Validate logoWidth
    if (props.logoWidth && (typeof props.logoWidth !== 'number' || props.logoWidth <= 0)) {
        console.warn(`⚠️  react-native-custom-splash: Invalid logoWidth "${props.logoWidth}", using default 150`);
        props.logoWidth = 150;
    }

    // Validate logoDuration
    if (props.logoDuration !== undefined && (typeof props.logoDuration !== 'number' || props.logoDuration < 0)) {
        console.warn(`⚠️  react-native-custom-splash: Invalid logoDuration "${props.logoDuration}", using default 2000`);
        props.logoDuration = 2000;
    }

    // Validate animationDuration
    if (props.animationDuration !== undefined && (typeof props.animationDuration !== 'number' || props.animationDuration < 0)) {
        console.warn(`⚠️  react-native-custom-splash: Invalid animationDuration "${props.animationDuration}", using default 0`);
        props.animationDuration = 0;
    }

    // Validate videoDuration
    if (props.videoDuration !== undefined && (typeof props.videoDuration !== 'number' || props.videoDuration < 0)) {
        console.warn(`⚠️  react-native-custom-splash: Invalid videoDuration "${props.videoDuration}", using default 0`);
        props.videoDuration = 0;
    }

    // Validate image path
    if (props.image && typeof props.image !== 'string') {
        console.warn(`⚠️  react-native-custom-splash: Invalid image path, must be a string`);
        props.image = null;
    }

    // Validate logo path
    if (props.logo && typeof props.logo !== 'string') {
        console.warn(`⚠️  react-native-custom-splash: Invalid logo path, must be a string`);
        props.logo = null;
    }

    return {
        backgroundColor: props.backgroundColor || '#FFFFFF',
        image: props.image || null,
        logo: props.logo || null,
        logoWidth: props.logoWidth || 150,
        logoDuration: props.logoDuration ?? 2000,
        // Animation addon config (all optional)
        animation: props.animation || null,
        animationLoop: props.animationLoop ?? false,
        animationDuration: props.animationDuration ?? 0,
        logoAnimation: props.logoAnimation || null,
        video: props.video || null,
        videoLoop: props.videoLoop ?? false,
        videoDuration: props.videoDuration ?? 0,
    };
}

/**
 * Get plugin configuration from app.json
 */
function getPluginConfig(config) {
    const plugins = config.plugins || [];
    const splashPlugin = plugins.find(plugin => {
        if (Array.isArray(plugin) && plugin[0] === 'react-native-custom-splash') {
            return true;
        }
        return plugin === 'react-native-custom-splash';
    });

    if (Array.isArray(splashPlugin) && splashPlugin[1]) {
        return validateAndNormalizeConfig(splashPlugin[1]);
    }

    // Default configuration
    return {
        backgroundColor: '#FFFFFF',
        image: null,
        logo: null,
        logoWidth: 150,
        logoDuration: 2000,
        animation: null,
        animationLoop: false,
        animationDuration: 0,
        logoAnimation: null,
        video: null,
        videoLoop: false,
        videoDuration: 0,
    };
}

/**
 * Copy and resize image to Android drawable folders
 */
async function copyImageToAndroid(projectRoot, imagePath, outputName, resDir) {
    if (!imagePath || !fs.existsSync(path.join(projectRoot, imagePath))) {
        return false;
    }

    const sourceImage = path.join(projectRoot, imagePath);

    // Define sizes for different densities
    const densities = {
        'mdpi': 1,
        'hdpi': 1.5,
        'xhdpi': 2,
        'xxhdpi': 3,
        'xxxhdpi': 4,
    };

    for (const [density, scale] of Object.entries(densities)) {
        const drawableDir = path.join(resDir, `drawable-${density}`);

        // Create directory if it doesn't exist
        if (!fs.existsSync(drawableDir)) {
            fs.mkdirSync(drawableDir, { recursive: true });
        }

        const outputPath = path.join(drawableDir, `${outputName}.png`);

        // Copy the image (you can add resizing logic here if needed)
        fs.copyFileSync(sourceImage, outputPath);
    }

    return true;
}

/**
 * Copy image to iOS assets
 */
async function copyImageToIOS(projectRoot, imagePath, outputName, iosProjectPath, projectName) {
    if (!imagePath || !fs.existsSync(path.join(projectRoot, imagePath))) {
        return false;
    }

    const sourceImage = path.join(projectRoot, imagePath);
    const assetsDir = path.join(iosProjectPath, projectName, 'Images.xcassets', `${outputName}.imageset`);

    // Create imageset directory
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Copy image files for different scales
    const scales = ['1x', '2x', '3x'];
    const images = [];

    for (const scale of scales) {
        const filename = `${outputName}@${scale}.png`;
        const destPath = path.join(assetsDir, filename);
        fs.copyFileSync(sourceImage, destPath);

        images.push({
            idiom: 'universal',
            filename: filename,
            scale: scale,
        });
    }

    // Create Contents.json
    const contentsJson = {
        images: images,
        info: {
            author: 'xcode',
            version: 1,
        },
    };

    fs.writeFileSync(
        path.join(assetsDir, 'Contents.json'),
        JSON.stringify(contentsJson, null, 2)
    );

    return true;
}

/**
 * Update Android colors.xml
 */
// Removed updateAndroidColors

/**
 * Update Android splash drawable
 */
function updateAndroidSplashDrawable(resDir, hasImage, hasLogo) {
    const drawableDir = path.join(resDir, 'drawable');
    if (!fs.existsSync(drawableDir)) {
        fs.mkdirSync(drawableDir, { recursive: true });
    }

    const splashPath = path.join(drawableDir, 'splash.xml');

    let items = [];

    // Background color
    items.push('    <item android:drawable="@color/splash_background"/>');

    // Background image if provided
    if (hasImage) {
        items.push('    <item>');
        items.push('        <bitmap');
        items.push('            android:gravity="fill"');
        items.push('            android:src="@drawable/splash_image"/>');
        items.push('    </item>');
    }

    // Logo if provided
    if (hasLogo) {
        items.push('    <item>');
        items.push('        <bitmap');
        items.push('            android:gravity="center"');
        items.push('            android:src="@drawable/splash_logo"/>');
        items.push('    </item>');
    }

    const splashXml = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
${items.join('\n')}
</layer-list>
`;

    fs.writeFileSync(splashPath, splashXml);
}

/**
 * Update Android splash layout
 */
function updateAndroidSplashLayout(resDir) {
    const layoutDir = path.join(resDir, 'layout');
    if (!fs.existsSync(layoutDir)) {
        fs.mkdirSync(layoutDir, { recursive: true });
    }

    const layoutPath = path.join(layoutDir, 'splash_screen.xml');
    const layoutXml = `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/splash">
</FrameLayout>
`;

    fs.writeFileSync(layoutPath, layoutXml);
}

/**
 * Plugin to configure Android splash screen
 */
const withSplashScreenAndroid = (config, pluginConfig) => {
    // Add colors via Expo API to prevent overriding other plugins' color properties
    config = withAndroidColors(config, (config) => {
        if (!config.modResults.resources) {
            config.modResults.resources = {};
        }
        if (!config.modResults.resources.color) {
            config.modResults.resources.color = [];
        }
        config.modResults = AndroidConfig.Colors.setColorItem(
            {
                $: { name: 'splash_background' },
                _: pluginConfig.backgroundColor,
            },
            config.modResults
        );
        config.modResults = AndroidConfig.Colors.setColorItem(
            {
                $: { name: 'splashscreen_background' },
                _: pluginConfig.backgroundColor,
            },
            config.modResults
        );
        return config;
    });

    // Add splash initialization to MainActivity
    config = withMainActivity(config, async (config) => {
        const { modResults } = config;
        let contents = modResults.contents;
        const isKotlin = modResults.language === 'kt';

        if (isKotlin) {
            // Ensure android.os.Bundle is imported
            if (!contents.includes('import android.os.Bundle')) {
                contents = contents.replace(
                    /(package\s+[\w.]+)/,
                    '$1\nimport android.os.Bundle'
                );
            }
            // Ensure SplashScreenModule is imported
            if (!contents.includes('import com.rncustomsplash.SplashScreenModule')) {
                contents = contents.replace(
                    /(package\s+[\w.]+)/,
                    '$1\nimport com.rncustomsplash.SplashScreenModule'
                );
            }

            // Add splash show in onCreate
            if (!contents.includes('SplashScreenModule.showAnimated(this)')) {
                if (contents.includes('SplashScreenModule.show(this)')) {
                    contents = contents.replace('SplashScreenModule.show(this)', 'SplashScreenModule.showAnimated(this)');
                } else if (contents.includes('override fun onCreate(')) {
                    contents = contents.replace(
                        /(override\s+fun\s+onCreate\s*\([^)]*\)\s*\{[^}]*super\.onCreate\([^)]*\))/,
                        '$1\n    // Show splash screen\n    SplashScreenModule.showAnimated(this)'
                    );
                } else {
                    const onCreateMethod = `\n  override fun onCreate(savedInstanceState: Bundle?) {
    // Show splash screen
    SplashScreenModule.showAnimated(this)
    super.onCreate(savedInstanceState)
  }\n`;
                    contents = contents.replace(
                        /(class\s+MainActivity\s*:\s*[^{]+\{)/,
                        `$1${onCreateMethod}`
                    );
                }
            }
        } else {
            // Java project
            if (!contents.includes('import android.os.Bundle;')) {
                contents = contents.replace(
                    /(package\s+[\w.]+;)/,
                    '$1\nimport android.os.Bundle;'
                );
            }
            if (!contents.includes('import com.rncustomsplash.SplashScreenModule;')) {
                contents = contents.replace(
                    /(package\s+[\w.]+;)/,
                    '$1\nimport com.rncustomsplash.SplashScreenModule;'
                );
            }

            if (!contents.includes('SplashScreenModule.showAnimated(this)')) {
                if (contents.includes('SplashScreenModule.show(this)')) {
                    contents = contents.replace('SplashScreenModule.show(this)', 'SplashScreenModule.showAnimated(this)');
                } else if (contents.includes('void onCreate(')) {
                    contents = contents.replace(
                        /(protected\s+void\s+onCreate\s*\([^)]*\)\s*\{[^}]*super\.onCreate\([^)]*\);)/,
                        '$1\n    // Show splash screen\n    SplashScreenModule.showAnimated(this);'
                    );
                } else {
                    const onCreateMethod = `\n  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // Show splash screen
    SplashScreenModule.showAnimated(this);
    super.onCreate(savedInstanceState);
  }\n`;
                    contents = contents.replace(
                        /(public\s+class\s+MainActivity\s+extends\s+[^{]+\{)/,
                        `$1${onCreateMethod}`
                    );
                }
            }
        }

        modResults.contents = contents;
        return config;
    });

    // Configure Android resources
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const resDir = path.join(
                config.modRequest.platformProjectRoot,
                'app',
                'src',
                'main',
                'res'
            );

            // Colors are updated dynamically via withAndroidColors above


            // Copy images if provided
            let hasImage = false;
            let hasLogo = false;

            if (pluginConfig.image) {
                hasImage = await copyImageToAndroid(
                    projectRoot,
                    pluginConfig.image,
                    'splash_image',
                    resDir
                );
            }

            if (pluginConfig.logo) {
                hasLogo = await copyImageToAndroid(
                    projectRoot,
                    pluginConfig.logo,
                    'splash_logo',
                    resDir
                );
            }

            // Update splash drawable
            updateAndroidSplashDrawable(resDir, hasImage, hasLogo);

            // Update splash layout
            updateAndroidSplashLayout(resDir);

            // --- Animation Addon: Copy animation/video assets ---

            // Copy Lottie animation JSON to assets folder
            if (pluginConfig.animation) {
                const animSrc = path.join(projectRoot, pluginConfig.animation);
                if (fs.existsSync(animSrc)) {
                    const assetsDir = path.join(
                        config.modRequest.platformProjectRoot,
                        'app',
                        'src',
                        'main',
                        'assets'
                    );
                    if (!fs.existsSync(assetsDir)) {
                        fs.mkdirSync(assetsDir, { recursive: true });
                    }
                    fs.copyFileSync(animSrc, path.join(assetsDir, 'splash_animation.json'));
                    console.log('✅ Lottie animation copied to Android assets');
                } else {
                    console.warn(`⚠️  Animation file not found: ${pluginConfig.animation}`);
                }
            }

            // Copy video MP4 to res/raw folder
            if (pluginConfig.video) {
                const videoSrc = path.join(projectRoot, pluginConfig.video);
                if (fs.existsSync(videoSrc)) {
                    const rawDir = path.join(resDir, 'raw');
                    if (!fs.existsSync(rawDir)) {
                        fs.mkdirSync(rawDir, { recursive: true });
                    }
                    fs.copyFileSync(videoSrc, path.join(rawDir, 'splash_video.mp4'));
                    console.log('✅ Video copied to Android res/raw');
                } else {
                    console.warn(`⚠️  Video file not found: ${pluginConfig.video}`);
                }
            }

            // Write splash config values (logoAnimation, animationLoop, videoLoop, etc.)
            if (
                pluginConfig.logoAnimation ||
                pluginConfig.animationLoop ||
                pluginConfig.videoLoop ||
                pluginConfig.logoWidth ||
                pluginConfig.logoDuration ||
                pluginConfig.animationDuration ||
                pluginConfig.videoDuration ||
                pluginConfig.backgroundColor
            ) {
                const valuesDir = path.join(resDir, 'values');
                if (!fs.existsSync(valuesDir)) {
                    fs.mkdirSync(valuesDir, { recursive: true });
                }

                let configEntries = [];
                if (pluginConfig.logoAnimation) {
                    configEntries.push(`    <string name="splash_logoAnimation">${pluginConfig.logoAnimation}</string>`);
                }
                if (pluginConfig.animationLoop) {
                    configEntries.push(`    <string name="splash_animationLoop">true</string>`);
                }
                if (pluginConfig.videoLoop) {
                    configEntries.push(`    <string name="splash_videoLoop">true</string>`);
                }
                if (pluginConfig.logoWidth !== undefined) {
                    configEntries.push(`    <string name="splash_logoWidth">${pluginConfig.logoWidth}</string>`);
                }
                if (pluginConfig.logoDuration !== undefined) {
                    configEntries.push(`    <string name="splash_logoDuration">${pluginConfig.logoDuration}</string>`);
                }
                if (pluginConfig.animationDuration !== undefined) {
                    configEntries.push(`    <string name="splash_animationDuration">${pluginConfig.animationDuration}</string>`);
                }
                if (pluginConfig.videoDuration !== undefined) {
                    configEntries.push(`    <string name="splash_videoDuration">${pluginConfig.videoDuration}</string>`);
                }
                if (pluginConfig.backgroundColor) {
                    configEntries.push(`    <string name="splash_backgroundColor">${pluginConfig.backgroundColor}</string>`);
                }

                const configXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
${configEntries.join('\n')}
</resources>
`;
                fs.writeFileSync(path.join(valuesDir, 'splash_config.xml'), configXml);
                console.log('✅ Splash config written to Android values');
            }

            // Auto-inject Lottie dependency into app/build.gradle if animation is configured
            if (pluginConfig.animation) {
                const appBuildGradle = path.join(
                    config.modRequest.platformProjectRoot,
                    'app',
                    'build.gradle'
                );
                if (fs.existsSync(appBuildGradle)) {
                    let gradleContent = fs.readFileSync(appBuildGradle, 'utf8');
                    if (!gradleContent.includes('com.airbnb.android:lottie')) {
                        gradleContent = gradleContent.replace(
                            /dependencies\s*\{/,
                            `dependencies {\n    implementation 'com.airbnb.android:lottie:6.4.0'`
                        );
                        fs.writeFileSync(appBuildGradle, gradleContent);
                        console.log('✅ Added Lottie dependency to Android app/build.gradle');
                    }
                }
            }

            return config;
        },
    ]);

    return config;
};




/**
 * Main plugin export
 */
module.exports = (config, props = {}) => {
    // Validate the props parameter
    let pluginConfig;

    if (props && Object.keys(props).length > 0) {
        // Props provided directly (from array syntax)
        pluginConfig = validateAndNormalizeConfig(props);
    } else {
        // Try to get from config (fallback)
        pluginConfig = getPluginConfig(config);
    }

    return withPlugins(config, [
        [withSplashScreenAndroid, pluginConfig],
        [withForcediOSSplash, pluginConfig],
        withAppDelegateSplash,
    ]);
};
