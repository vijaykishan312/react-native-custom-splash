const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

function withForcediOSSplash(config, pluginConfig) {
    config = {
        ...config,
        splash: undefined,
        ios: { ...config.ios, splash: undefined }
    };

    return withDangerousMod(config, [
        'ios',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const iosPath = config.modRequest.platformProjectRoot;
            const projectName = config.modRequest.projectName;

            console.log('\n🔥 Setting up splash screen...\n');

            // Delete old files
            const toDelete = [
                'SplashScreen.storyboard',
                'LaunchScreen.storyboard',
                'Images.xcassets/SplashScreenLegacy.imageset',
                'Images.xcassets/SplashScreen.imageset',
                'Images.xcassets/SplashScreenBackground.imageset',
            ];

            toDelete.forEach(file => {
                const fullPath = path.join(iosPath, projectName, file);
                try {
                    if (fs.existsSync(fullPath)) {
                        if (fs.lstatSync(fullPath).isDirectory()) {
                            fs.rmSync(fullPath, { recursive: true, force: true });
                        } else {
                            fs.unlinkSync(fullPath);
                        }
                    }
                } catch (e) { }
            });

            // Update Info.plist
            const plistPath = path.join(iosPath, projectName, 'Info.plist');
            if (fs.existsSync(plistPath)) {
                let plist = fs.readFileSync(plistPath, 'utf8');
                plist = plist.replace(/<key>UILaunchStoryboardName<\/key>\s*<string>.*?<\/string>/g, '');
                plist = plist.replace(/<key>UILaunchScreen<\/key>[\s\S]*?<\/dict>/g, '');

                if (!plist.includes('UILaunchStoryboardName')) {
                    plist = plist.replace('</dict>\n</plist>', '\t<key>UILaunchStoryboardName</key>\n\t<string>LaunchScreen</string>\n</dict>\n</plist>');
                }

                fs.writeFileSync(plistPath, plist);
            }

            const assetsPath = path.join(iosPath, projectName, 'Images.xcassets');
            let hasImage = false;
            let hasLogo = false;

            // Copy background image
            if (pluginConfig.image) {
                const srcPath = path.join(projectRoot, pluginConfig.image);
                if (fs.existsSync(srcPath)) {
                    const imagesetDir = path.join(assetsPath, 'SplashBg.imageset');

                    if (fs.existsSync(imagesetDir)) fs.rmSync(imagesetDir, { recursive: true, force: true });
                    fs.mkdirSync(imagesetDir, { recursive: true });

                    fs.copyFileSync(srcPath, path.join(imagesetDir, 'image.png'));

                    fs.writeFileSync(path.join(imagesetDir, 'Contents.json'), JSON.stringify({
                        images: [
                            { filename: 'image.png', idiom: 'universal', scale: '1x' },
                            { filename: 'image.png', idiom: 'universal', scale: '2x' },
                            { filename: 'image.png', idiom: 'universal', scale: '3x' }
                        ],
                        info: { author: 'xcode', version: 1 }
                    }, null, 2));

                    hasImage = true;
                    console.log('✅ Background copied');
                }
            }

            // Copy logo
            if (pluginConfig.logo) {
                const srcPath = path.join(projectRoot, pluginConfig.logo);
                if (fs.existsSync(srcPath)) {
                    const imagesetDir = path.join(assetsPath, 'SplashIcon.imageset');

                    if (fs.existsSync(imagesetDir)) fs.rmSync(imagesetDir, { recursive: true, force: true });
                    fs.mkdirSync(imagesetDir, { recursive: true });

                    fs.copyFileSync(srcPath, path.join(imagesetDir, 'icon.png'));

                    fs.writeFileSync(path.join(imagesetDir, 'Contents.json'), JSON.stringify({
                        images: [
                            { filename: 'icon.png', idiom: 'universal', scale: '1x' },
                            { filename: 'icon.png', idiom: 'universal', scale: '2x' },
                            { filename: 'icon.png', idiom: 'universal', scale: '3x' }
                        ],
                        info: { author: 'xcode', version: 1 }
                    }, null, 2));

                    hasLogo = true;
                    console.log('✅ Logo copied');
                }
            }

            // Create storyboard
            const color = pluginConfig.backgroundColor.replace('#', '');
            const r = parseInt(color.substr(0, 2), 16) / 255;
            const g = parseInt(color.substr(2, 2), 16) / 255;
            const b = parseInt(color.substr(4, 2), 16) / 255;

            const storyboard = `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="21701" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    <device id="retina6_1" orientation="portrait" appearance="light"/>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="21679"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <rect key="frame" x="0.0" y="0.0" width="414" height="896"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>${hasImage ? `
                            <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFill" horizontalHuggingPriority="251" verticalHuggingPriority="251" image="SplashBg" translatesAutoresizingMaskIntoConstraints="NO" id="bg-img">
                                <rect key="frame" x="0.0" y="0.0" width="414" height="896"/>
                            </imageView>` : ''}${hasLogo ? `
                            <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" horizontalHuggingPriority="251" verticalHuggingPriority="251" image="SplashIcon" translatesAutoresizingMaskIntoConstraints="NO" id="logo-img">
                                <rect key="frame" x="132" y="373" width="150" height="150"/>
                                <constraints>
                                    <constraint firstAttribute="width" constant="150" id="w"/>
                                    <constraint firstAttribute="height" constant="150" id="h"/>
                                </constraints>
                            </imageView>` : ''}
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="6Tk-OE-BBY"/>
                        <color key="backgroundColor" red="${r}" green="${g}" blue="${b}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                        <constraints>${hasImage ? `
                            <constraint firstItem="bg-img" firstAttribute="top" secondItem="Ze5-6b-2t3" secondAttribute="top"/>
                            <constraint firstItem="bg-img" firstAttribute="leading" secondItem="Ze5-6b-2t3" secondAttribute="leading"/>
                            <constraint firstItem="bg-img" firstAttribute="trailing" secondItem="Ze5-6b-2t3" secondAttribute="trailing"/>
                            <constraint firstItem="bg-img" firstAttribute="bottom" secondItem="Ze5-6b-2t3" secondAttribute="bottom"/>` : ''}${hasLogo ? `
                            <constraint firstItem="logo-img" firstAttribute="centerX" secondItem="Ze5-6b-2t3" secondAttribute="centerX"/>
                            <constraint firstItem="logo-img" firstAttribute="centerY" secondItem="Ze5-6b-2t3" secondAttribute="centerY"/>` : ''}
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="53" y="375"/>
        </scene>
    </scenes>
    <resources>${hasImage ? `
        <image name="SplashBg" width="1242" height="2688"/>` : ''}${hasLogo ? `
        <image name="SplashIcon" width="512" height="512"/>` : ''}
    </resources>
</document>`;

            const storyboardPath = path.join(iosPath, projectName, 'LaunchScreen.storyboard');
            if (fs.existsSync(storyboardPath)) fs.unlinkSync(storyboardPath);
            fs.writeFileSync(storyboardPath, storyboard);

            console.log('✅ LaunchScreen.storyboard created!');
            console.log(`   Background: ${hasImage ? 'YES' : 'NO'}`);
            console.log(`   Logo: ${hasLogo ? 'YES' : 'NO'}\n`);

            return config;
        },
    ]);
}

module.exports = withForcediOSSplash;
