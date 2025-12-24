const {
    withDangerousMod,
    withPlugins,
    withMainActivity,
    withMainApplication,
    AndroidConfig,
    IOSConfig,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');
const withForcediOSSplash = require('./withCustomSplash');

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
function updateAndroidColors(resDir, backgroundColor) {
    const valuesDir = path.join(resDir, 'values');
    if (!fs.existsSync(valuesDir)) {
        fs.mkdirSync(valuesDir, { recursive: true });
    }

    const colorsPath = path.join(valuesDir, 'colors.xml');
    const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_background">${backgroundColor}</color>
</resources>
`;

    fs.writeFileSync(colorsPath, colorsXml);
}

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

            // Update colors
            updateAndroidColors(resDir, pluginConfig.backgroundColor);

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

            return config;
        },
    ]);

    return config;
};

/**
 * Create LaunchScreen.storyboard with splash configuration
 */
function createLaunchScreenStoryboard(hasImage, hasLogo, backgroundColor) {
    const bgColor = backgroundColor.replace('#', '');
    const r = parseInt(bgColor.substr(0, 2), 16) / 255;
    const g = parseInt(bgColor.substr(2, 2), 16) / 255;
    const b = parseInt(bgColor.substr(4, 2), 16) / 255;

    const imageViewXML = hasImage ? `
                <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFill" horizontalHuggingPriority="251" verticalHuggingPriority="251" image="splash_image" translatesAutoresizingMaskIntoConstraints="NO" id="splashBgImage">
                    <rect key="frame" x="0.0" y="0.0" width="414" height="896"/>
                </imageView>` : '';

    const logoViewXML = hasLogo ? `
                <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" horizontalHuggingPriority="251" verticalHuggingPriority="251" image="splash_logo" translatesAutoresizingMaskIntoConstraints="NO" id="splashLogo">
                    <rect key="frame" x="132" y="348" width="150" height="150"/>
                    <constraints>
                        <constraint firstAttribute="width" constant="150" id="logoWidth"/>
                        <constraint firstAttribute="height" constant="150" id="logoHeight"/>
                    </constraints>
                </imageView>` : '';

    const imageConstraints = hasImage ? `
                <constraint firstItem="splashBgImage" firstAttribute="top" secondItem="Ze5-6b-2t3" secondAttribute="top" id="bgTop"/>
                <constraint firstItem="splashBgImage" firstAttribute="leading" secondItem="Ze5-6b-2t3" secondAttribute="leading" id="bgLeading"/>
                <constraint firstItem="splashBgImage" firstAttribute="trailing" secondItem="Ze5-6b-2t3" secondAttribute="trailing" id="bgTrailing"/>
                <constraint firstItem="splashBgImage" firstAttribute="bottom" secondItem="Ze5-6b-2t3" secondAttribute="bottom" id="bgBottom"/>` : '';

    const logoConstraints = hasLogo ? `
                <constraint firstItem="splashLogo" firstAttribute="centerX" secondItem="Ze5-6b-2t3" secondAttribute="centerX" id="logoCenterX"/>
                <constraint firstItem="splashLogo" firstAttribute="centerY" secondItem="Ze5-6b-2t3" secondAttribute="centerY" id="logoCenterY"/>` : '';

    const imageResources = [];
    if (hasImage) imageResources.push('<image name="splash_image" width="1242" height="2688"/>');
    if (hasLogo) imageResources.push('<image name="splash_logo" width="512" height="512"/>');

    return `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="21507" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    <device id="retina6_1" orientation="portrait" appearance="light"/>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="21505"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <!--View Controller-->
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <rect key="frame" x="0.0" y="0.0" width="414" height="896"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>${imageViewXML}${logoViewXML}
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="6Tk-OE-BBY"/>
                        <color key="backgroundColor" red="${r}" green="${g}" blue="${b}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                        <constraints>${imageConstraints}${logoConstraints}
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="53" y="375"/>
        </scene>
    </scenes>
    <resources>${imageResources.join('\n        ')}
    </resources>
</document>`;
}

/**
 * Plugin to configure iOS splash screen
 */
const withSplashScreenIOS = (config, pluginConfig) => {
    config = withDangerousMod(config, [
        'ios',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const iosProjectPath = config.modRequest.platformProjectRoot;
            const projectName = config.modRequest.projectName;

            // Step 1: Update Info.plist to use LaunchScreen
            const infoPlistPath = path.join(iosProjectPath, projectName, 'Info.plist');
            if (fs.existsSync(infoPlistPath)) {
                let infoPlist = fs.readFileSync(infoPlistPath, 'utf8');

                // Update to use LaunchScreen
                if (!infoPlist.includes('<key>UILaunchStoryboardName</key>')) {
                    infoPlist = infoPlist.replace('</dict>\n</plist>', '\t<key>UILaunchStoryboardName</key>\n\t<string>LaunchScreen</string>\n</dict>\n</plist>');
                } else {
                    // Update existing value to LaunchScreen
                    infoPlist = infoPlist.replace(
                        /<key>UILaunchStoryboardName<\/key>\s*<string>.*?<\/string>/,
                        '<key>UILaunchStoryboardName</key>\n\t<string>LaunchScreen</string>'
                    );
                }

                // Remove UILaunchScreen dictionary if present
                infoPlist = infoPlist.replace(/<key>UILaunchScreen<\/key>[\s\S]*?<\/dict>/g, '');

                fs.writeFileSync(infoPlistPath, infoPlist);
            }

            // Step 2: Delete old/existing storyboards
            const oldStoryboards = [
                path.join(iosProjectPath, projectName, 'SplashScreen.storyboard'),
                path.join(iosProjectPath, projectName, 'LaunchScreen.storyboard'),
            ];

            oldStoryboards.forEach(storyPath => {
                if (fs.existsSync(storyPath)) {
                    fs.unlinkSync(storyPath);
                    console.log(`🗑️  Removed old storyboard: ${path.basename(storyPath)}`);
                }
            });

            // Step 3: Remove SplashScreenLegacy from Images.xcassets
            const legacyImagePath = path.join(iosProjectPath, projectName, 'Images.xcassets', 'SplashScreenLegacy.imageset');
            if (fs.existsSync(legacyImagePath)) {
                fs.rmSync(legacyImagePath, { recursive: true, force: true });
                console.log('🗑️  Removed SplashScreenLegacy imageset');
            }

            // Step 4: Copy user images to iOS assets
            let hasImage = false;
            let hasLogo = false;

            if (pluginConfig.image) {
                hasImage = await copyImageToIOS(projectRoot, pluginConfig.image, 'splash_image', iosProjectPath, projectName);
                if (hasImage) {
                    console.log('✅ Background image copied: splash_image');
                }
            }

            if (pluginConfig.logo) {
                hasLogo = await copyImageToIOS(projectRoot, pluginConfig.logo, 'splash_logo', iosProjectPath, projectName);
                if (hasLogo) {
                    console.log('✅ Logo image copied: splash_logo');
                }
            }

            // Step 5: Create fresh LaunchScreen.storyboard with user images
            const launchScreenPath = path.join(iosProjectPath, projectName, 'LaunchScreen.storyboard');
            const storyboardContent = createLaunchScreenStoryboard(hasImage, hasLogo, pluginConfig.backgroundColor);
            fs.writeFileSync(launchScreenPath, storyboardContent);

            console.log('✅ LaunchScreen.storyboard created with YOUR images!');
            console.log(`   - Background: ${hasImage ? 'splash_image' : 'color only'}`);
            console.log(`   - Logo: ${hasLogo ? 'splash_logo' : 'none'}`);
            console.log(`   - Color: ${pluginConfig.backgroundColor}`);

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
    ]);
};
