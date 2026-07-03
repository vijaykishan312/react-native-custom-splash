const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * REAL FIX: Replace Expo's SplashScreen.storyboard directly
 * The issue was: We were creating LaunchScreen.storyboard but Expo uses SplashScreen.storyboard!
 */
function withForcediOSSplash(config, pluginConfig) {
    // Disable Expo's splash config
    if (config.splash) delete config.splash;
    if (config.ios && config.ios.splash) delete config.ios.splash;

    return withDangerousMod(config, [
        'ios',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const iosPath = config.modRequest.platformProjectRoot;
            const projectName = config.modRequest.projectName;
            const projectDir = path.join(iosPath, projectName);
            const assetsPath = path.join(projectDir, 'Images.xcassets');

            console.log('\n🔥 REPLACING EXPO SPLASH WITH CUSTOM SPLASH...\n');

            // STEP 1: Delete Expo's splash images
            const foldersToDelete = [
                'Images.xcassets/SplashScreen.imageset',
                'Images.xcassets/SplashScreenBackground.imageset',
                'Images.xcassets/SplashScreenLegacy.imageset',
            ];

            foldersToDelete.forEach(folder => {
                const fullPath = path.join(projectDir, folder);
                if (fs.existsSync(fullPath)) {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                    console.log('🗑️  Deleted:', folder);
                }
            });

            // STEP 2: Copy user images
            let hasBackground = false;
            let hasLogo = false;

            if (pluginConfig.image) {
                const srcPath = path.join(projectRoot, pluginConfig.image);
                if (fs.existsSync(srcPath)) {
                    const imagesetDir = path.join(assetsPath, 'SplashBg.imageset');
                    if (fs.existsSync(imagesetDir)) {
                        fs.rmSync(imagesetDir, { recursive: true, force: true });
                    }
                    fs.mkdirSync(imagesetDir, { recursive: true });

                    fs.copyFileSync(srcPath, path.join(imagesetDir, 'image.png'));
                    fs.writeFileSync(path.join(imagesetDir, 'Contents.json'), JSON.stringify({
                        images: [
                            { idiom: 'universal', filename: 'image.png', scale: '1x' },
                            { idiom: 'universal', filename: 'image.png', scale: '2x' },
                            { idiom: 'universal', filename: 'image.png', scale: '3x' }
                        ],
                        info: { author: 'xcode', version: 1 }
                    }, null, 2));

                    hasBackground = true;
                    console.log('✅ Background image copied');
                }
            }

            if (pluginConfig.logo) {
                const srcPath = path.join(projectRoot, pluginConfig.logo);
                if (fs.existsSync(srcPath)) {
                    const imagesetDir = path.join(assetsPath, 'SplashLogo.imageset');
                    if (fs.existsSync(imagesetDir)) {
                        fs.rmSync(imagesetDir, { recursive: true, force: true });
                    }
                    fs.mkdirSync(imagesetDir, { recursive: true });

                    fs.copyFileSync(srcPath, path.join(imagesetDir, 'logo.png'));
                    fs.writeFileSync(path.join(imagesetDir, 'Contents.json'), JSON.stringify({
                        images: [
                            { idiom: 'universal', filename: 'logo.png', scale: '1x' },
                            { idiom: 'universal', filename: 'logo.png', scale: '2x' },
                            { idiom: 'universal', filename: 'logo.png', scale: '3x' }
                        ],
                        info: { author: 'xcode', version: 1 }
                    }, null, 2));

                    hasLogo = true;
                    console.log('✅ Logo image copied');
                }
            }

            // STEP 3: Create CLEAN SplashScreen.storyboard (SAME NAME AS EXPO!)
            const bgColor = pluginConfig.backgroundColor || '#FFFFFF';
            const color = bgColor.replace('#', '');
            const r = (parseInt(color.substr(0, 2), 16) / 255).toFixed(6);
            const g = (parseInt(color.substr(2, 2), 16) / 255).toFixed(6);
            const b = (parseInt(color.substr(4, 2), 16) / 255).toFixed(6);

            // Build subviews
            let subviews = '';
            let constraints = '';
            let resources = '';

            if (hasBackground) {
                subviews += `
                            <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFill" horizontalHuggingPriority="251" verticalHuggingPriority="251" image="SplashBg" translatesAutoresizingMaskIntoConstraints="NO" id="bgImage">
                                <rect key="frame" x="0.0" y="0.0" width="393" height="852"/>
                            </imageView>`;
                constraints += `
                            <constraint firstItem="bgImage" firstAttribute="top" secondItem="rootView" secondAttribute="top" id="c1"/>
                            <constraint firstItem="bgImage" firstAttribute="leading" secondItem="rootView" secondAttribute="leading" id="c2"/>
                            <constraint firstItem="bgImage" firstAttribute="trailing" secondItem="rootView" secondAttribute="trailing" id="c3"/>
                            <constraint firstItem="bgImage" firstAttribute="bottom" secondItem="rootView" secondAttribute="bottom" id="c4"/>`;
                resources += `
        <image name="SplashBg" width="1242" height="2688"/>`;
            }

            if (hasLogo) {
                subviews += `
                            <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" horizontalHuggingPriority="251" verticalHuggingPriority="251" image="SplashLogo" translatesAutoresizingMaskIntoConstraints="NO" id="logoImage">
                                <rect key="frame" x="121" y="376" width="150" height="100"/>
                                <constraints>
                                    <constraint firstAttribute="width" constant="150" id="c5"/>
                                    <constraint firstAttribute="height" constant="100" id="c6"/>
                                </constraints>
                            </imageView>`;
                constraints += `
                            <constraint firstItem="logoImage" firstAttribute="centerX" secondItem="rootView" secondAttribute="centerX" id="c7"/>
                            <constraint firstItem="logoImage" firstAttribute="centerY" secondItem="rootView" secondAttribute="centerY" id="c8"/>`;
                resources += `
        <image name="SplashLogo" width="512" height="512"/>`;
            }

            const storyboard = `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="22505" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="MAIN-VC">
    <device id="retina6_12" orientation="portrait" appearance="light"/>
    <dependencies>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="22504"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <scene sceneID="MAIN-SCENE">
            <objects>
                <viewController id="MAIN-VC" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="rootView">
                        <rect key="frame" x="0.0" y="0.0" width="393" height="852"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>${subviews}
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="safeArea"/>
                        <color key="backgroundColor" red="${r}" green="${g}" blue="${b}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                        <constraints>${constraints}
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="FIRST-RESP" userLabel="First Responder" customClass="UIResponder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="0" y="0"/>
        </scene>
    </scenes>
    <resources>${resources}
    </resources>
</document>`;

            // IMPORTANT: Write to SplashScreen.storyboard (same as Expo!)
            const storyboardPath = path.join(projectDir, 'SplashScreen.storyboard');
            fs.writeFileSync(storyboardPath, storyboard);

            // --- Animation Addon: Copy animation/video assets ---
            
            if (pluginConfig.animation) {
                const animSrc = path.join(projectRoot, pluginConfig.animation);
                if (fs.existsSync(animSrc)) {
                    fs.copyFileSync(animSrc, path.join(projectDir, 'splash_animation.json'));
                    
                    // We need to add it to the pbxproj but since we can't easily parse it here,
                    // we expect users to run prebuild, which adds resources in some cases,
                    // or we rely on Expo's built-in asset copying if configured, 
                    // or we could use the pbxproj modifier (complex).
                    // For now, copying to project dir is the first step.
                    // Better approach for Expo: add to resources in xcodeProject mod if needed,
                    // but for this plugin, just dropping it in the folder works for Expo prebuild 
                    // which often sweeps up files, or they can be explicitly added.
                    console.log('✅ Lottie animation copied to iOS project');
                } else {
                    console.warn(`⚠️  Animation file not found: ${pluginConfig.animation}`);
                }
            }

            if (pluginConfig.video) {
                const videoSrc = path.join(projectRoot, pluginConfig.video);
                if (fs.existsSync(videoSrc)) {
                    fs.copyFileSync(videoSrc, path.join(projectDir, 'splash_video.mp4'));
                    console.log('✅ Video copied to iOS project');
                } else {
                    console.warn(`⚠️  Video file not found: ${pluginConfig.video}`);
                }
            }

            // Write splash config values (logoAnimation, animationLoop, videoLoop)
            if (pluginConfig.logoAnimation || pluginConfig.animationLoop || pluginConfig.videoLoop) {
                const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${pluginConfig.logoAnimation ? `    <key>logoAnimation</key>\n    <string>${pluginConfig.logoAnimation}</string>` : ''}
${pluginConfig.animationLoop ? `    <key>animationLoop</key>\n    <string>true</string>` : ''}
${pluginConfig.videoLoop ? `    <key>videoLoop</key>\n    <string>true</string>` : ''}
</dict>
</plist>`;
                fs.writeFileSync(path.join(projectDir, 'splash_config.plist'), plistContent);
                console.log('✅ Splash config written to iOS project');
            }

            // --- End Animation Addon ---

            console.log('✅ SplashScreen.storyboard REPLACED!');
            console.log(`   📸 Background: ${hasBackground ? 'SplashBg ✓' : 'NO'}`);
            console.log(`   🎨 Logo: ${hasLogo ? 'SplashLogo ✓' : 'NO'}`);
            console.log(`   🌈 Color: ${bgColor}\n`);

            return config;
        },
    ]);
}

module.exports = withForcediOSSplash;
