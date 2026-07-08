const { withDangerousMod, withAppDelegate, IOSConfig } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');
const { Paths } = IOSConfig;

/**
 * REAL FIX: Replace Expo's SplashScreen.storyboard directly
 * The issue was: We were creating LaunchScreen.storyboard but Expo uses SplashScreen.storyboard!
 */
function withForcediOSSplash(config, pluginConfig) {
    // Disable Expo's splash config
    if (config.splash) delete config.splash;
    if (config.ios && config.ios.splash) delete config.ios.splash;
    if (config.android && config.android.splash) delete config.android.splash;

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

            // Write splash config values (logoAnimation, animationLoop, videoLoop, etc.)
            const plistEntries = [];
            if (pluginConfig.logoAnimation) {
                plistEntries.push(`    <key>logoAnimation</key>\n    <string>${pluginConfig.logoAnimation}</string>`);
            }
            if (pluginConfig.animationLoop) {
                plistEntries.push(`    <key>animationLoop</key>\n    <string>true</string>`);
            }
            if (pluginConfig.videoLoop) {
                plistEntries.push(`    <key>videoLoop</key>\n    <string>true</string>`);
            }
            if (pluginConfig.logoWidth !== undefined) {
                plistEntries.push(`    <key>logoWidth</key>\n    <string>${pluginConfig.logoWidth}</string>`);
            }
            if (pluginConfig.logoDuration !== undefined) {
                plistEntries.push(`    <key>logoDuration</key>\n    <string>${pluginConfig.logoDuration}</string>`);
            }
            if (pluginConfig.animationDuration !== undefined) {
                plistEntries.push(`    <key>animationDuration</key>\n    <string>${pluginConfig.animationDuration}</string>`);
            }
            if (pluginConfig.videoDuration !== undefined) {
                plistEntries.push(`    <key>videoDuration</key>\n    <string>${pluginConfig.videoDuration}</string>`);
            }
            if (pluginConfig.backgroundColor) {
                plistEntries.push(`    <key>backgroundColor</key>\n    <string>${pluginConfig.backgroundColor}</string>`);
            }

            if (plistEntries.length > 0) {
                const plistContent = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n${plistEntries.join('\n')}\n</dict>\n</plist>`;
                fs.writeFileSync(path.join(projectDir, 'splash_config.plist'), plistContent);
                console.log('✅ Splash config written to iOS project');
            }

            // CRITICAL: Add splash files to Xcode project so they end up in the app bundle
            addFilesToXcodeProject(iosPath, projectName, pluginConfig);

            // If animation is used, automatically add lottie-ios to Podfile
            if (pluginConfig.animation) {
                const podfilePath = path.join(iosPath, 'Podfile');
                if (fs.existsSync(podfilePath)) {
                    let podfileContent = fs.readFileSync(podfilePath, 'utf8');
                    if (!podfileContent.includes("lottie-ios")) {
                        if (podfileContent.includes('use_react_native!')) {
                            podfileContent = podfileContent.replace(
                                'use_react_native!',
                                "pod 'lottie-ios', '~> 4.4'\n  use_react_native!"
                            );
                            fs.writeFileSync(podfilePath, podfileContent);
                            console.log("✅ Added lottie-ios dependency to Podfile");
                        } else {
                            const targetRegex = /(target\s+'[^']+'\s+do)/;
                            if (targetRegex.test(podfileContent)) {
                                podfileContent = podfileContent.replace(
                                    targetRegex,
                                    `$1\n  pod 'lottie-ios', '~> 4.4'`
                                );
                                fs.writeFileSync(podfilePath, podfileContent);
                                console.log("✅ Added lottie-ios dependency to Podfile (target block)");
                            }
                        }
                    }
                }
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

/**
 * Add splash resource files to the Xcode project's pbxproj
 * so they are included in the app bundle at runtime.
 */
function addFilesToXcodeProject(iosPath, projectName, pluginConfig) {
    const pbxprojPath = path.join(iosPath, `${projectName}.xcodeproj`, 'project.pbxproj');
    if (!fs.existsSync(pbxprojPath)) return;

    let pbxproj = fs.readFileSync(pbxprojPath, 'utf8');
    const projectDir = path.join(iosPath, projectName);

    // Files to add to the Xcode project resources (must use valid 24-character hex UUIDs)
    const filesToAdd = [];
    if (fs.existsSync(path.join(projectDir, 'splash_config.plist'))) {
        filesToAdd.push({ name: 'splash_config.plist', id: 'FFD0D1D2D3D4D5D6D7D8D901', buildId: 'FFD0D1D2D3D4D5D6D7D8D902' });
    }
    if (pluginConfig.animation && fs.existsSync(path.join(projectDir, 'splash_animation.json'))) {
        filesToAdd.push({ name: 'splash_animation.json', id: 'FFD0D1D2D3D4D5D6D7D8D903', buildId: 'FFD0D1D2D3D4D5D6D7D8D904' });
    }
    if (pluginConfig.video && fs.existsSync(path.join(projectDir, 'splash_video.mp4'))) {
        filesToAdd.push({ name: 'splash_video.mp4', id: 'FFD0D1D2D3D4D5D6D7D8D905', buildId: 'FFD0D1D2D3D4D5D6D7D8D906' });
    }

    if (filesToAdd.length === 0) return;

    for (const file of filesToAdd) {
        // Clean up any old/incorrect references using the same unique IDs to avoid duplicates or broken paths
        pbxproj = pbxproj.split('\n').filter(line => {
            return !line.includes(file.id) && !line.includes(file.buildId);
        }).join('\n');

        // 1. Add PBXFileReference
        const fileRefEntry = `\t\t${file.id} /* ${file.name} */ = {isa = PBXFileReference; lastKnownFileType = ${getFileType(file.name)}; name = ${file.name}; path = ${projectName}/${file.name}; sourceTree = "<group>"; };`;
        pbxproj = pbxproj.replace(
            /(\/\* End PBXFileReference section \*\/)/,
            `${fileRefEntry}\n$1`
        );

        // 2. Add PBXBuildFile (for Resources build phase)
        const buildFileEntry = `\t\t${file.buildId} /* ${file.name} in Resources */ = {isa = PBXBuildFile; fileRef = ${file.id} /* ${file.name} */; };`;
        pbxproj = pbxproj.replace(
            /(\/\* End PBXBuildFile section \*\/)/,
            `${buildFileEntry}\n$1`
        );

        // 3. Add to Resources build phase (PBXResourcesBuildPhase)
        pbxproj = pbxproj.replace(
            /(\s*\/\* Resources \*\/\s*=\s*\{[^}]*files\s*=\s*\()/,
            `$1\n\t\t\t\t${file.buildId} /* ${file.name} in Resources */,`
        );

        // 4. Add to the main group's children
        // Find the project group that contains the app target files
        const escapedName = projectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const groupRegex = new RegExp(`(\\/\\*\\s*${escapedName}\\s*\\*\\/\\s*=\\s*\\{[^}]*children\\s*=\\s*\\()`);
        if (groupRegex.test(pbxproj)) {
            pbxproj = pbxproj.replace(
                groupRegex,
                `$1\n\t\t\t\t${file.id} /* ${file.name} */,`
            );
        }
    }

    fs.writeFileSync(pbxprojPath, pbxproj);
    console.log(`✅ Added ${filesToAdd.map(f => f.name).join(', ')} to Xcode project`);
}

function getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case '.plist': return 'text.plist.xml';
        case '.json': return 'text.json';
        case '.mp4': return 'file';
        default: return 'file';
    }
}

function withAppDelegateSplash(config) {
    return withAppDelegate(config, (config) => {
        let contents = config.modResults.contents;
        const isSwift = config.modResults.language === 'swift';

        if (isSwift) {
            // Swift AppDelegate
            if (!contents.includes('NSClassFromString("SplashScreen")')) {
                const searchString = 'func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {';
                if (contents.includes(searchString)) {
                    const injection = `
    if let splashClass = NSClassFromString("SplashScreen") as? NSObject.Type {
        splashClass.perform(Selector(("show")))
    }
`;
                    contents = contents.replace(searchString, `${searchString}${injection}`);
                    console.log('✅ Added SplashScreen show call to AppDelegate.swift');
                }
            }
        } else {
            // Objective-C AppDelegate (AppDelegate.mm)
            if (!contents.includes('NSClassFromString(@"SplashScreen")')) {
                const searchString = '- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions\n{';
                const searchStringAlt = '- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {';
                
                const injection = `\n  Class splashClass = NSClassFromString(@"SplashScreen");\n  if (splashClass != nil) {\n    [splashClass performSelector:@selector(show)];\n  }\n`;

                if (contents.includes(searchString)) {
                    contents = contents.replace(searchString, `${searchString}${injection}`);
                    console.log('✅ Added SplashScreen show call to AppDelegate.mm (Format 1)');
                } else if (contents.includes(searchStringAlt)) {
                    contents = contents.replace(searchStringAlt, `${searchStringAlt}${injection}`);
                    console.log('✅ Added SplashScreen show call to AppDelegate.mm (Format 2)');
                } else {
                    const regex = /(-\s*\(BOOL\)\s*application\s*:\s*\(UIApplication\s*\*\s*\)\s*application\s+didFinishLaunchingWithOptions\s*:\s*\(NSDictionary\s*\*\s*\)\s*launchOptions\s*\{)/;
                    if (regex.test(contents)) {
                        contents = contents.replace(regex, `$1${injection}`);
                        console.log('✅ Added SplashScreen show call to AppDelegate.mm (Regex)');
                    } else {
                        console.warn('⚠️  Could not find didFinishLaunchingWithOptions in AppDelegate.mm to auto-inject splash screen.');
                    }
                }
            }
        }

        config.modResults.contents = contents;
        return config;
    });
}

module.exports = {
    withForcediOSSplash,
    withAppDelegateSplash,
};
