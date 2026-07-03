//
//  SplashScreenModule.swift
//  RNCustomSplash
//
//  Custom Native Splash Screen Module for iOS
//

import Foundation
import UIKit
import React
import AVFoundation
import AVKit

#if canImport(Lottie)
import Lottie
#endif

@objc(SplashScreen)
class SplashScreenModule: NSObject {
  
  private static var splashWindow: UIWindow?
  private static var isVisible = false
  private static var logoImageView: UIImageView?
  private static var player: AVPlayer?
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  override init() {
    super.init()
    // Show splash automatically when module initializes
    // Try animated version first, falls back to static if no animation assets found
    DispatchQueue.main.async {
      SplashScreenModule.showAnimatedSplashScreen()
    }
  }
  
  private static func showSplashScreen() {
    guard !isVisible else { return }
    
    if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
      let window = UIWindow(windowScene: scene)
      window.windowLevel = .alert + 1
      window.backgroundColor = .white
      
      // Create splash view controller
      let splashVC = UIViewController()
      splashVC.view.backgroundColor = .white
      
      // Try to load background splash image from the main bundle
      if let splashImage = UIImage(named: "splash_image") {
        let imageView = UIImageView(image: splashImage)
        imageView.contentMode = .scaleAspectFill
        imageView.frame = splashVC.view.bounds
        imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        splashVC.view.addSubview(imageView)
      } else if let splashImage = UIImage(named: "splash") {
        // Fallback to old "splash" name for backward compatibility
        let imageView = UIImageView(image: splashImage)
        imageView.contentMode = .scaleAspectFill
        imageView.frame = splashVC.view.bounds
        imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        splashVC.view.addSubview(imageView)
      } else {
        // Fallback: show white screen if no background image
        if #available(iOS 13.0, *) {
          splashVC.view.backgroundColor = .systemBackground
        } else {
          splashVC.view.backgroundColor = .white
        }
      }
      
      // Add center logo if available
      if let logoImage = UIImage(named: "splash_logo") {
        let logoView = UIImageView(image: logoImage)
        logoView.contentMode = .scaleAspectFit
        
        // Set logo size (150pt width by default, maintaining aspect ratio)
        let logoWidth: CGFloat = 150
        let aspectRatio = logoImage.size.height / logoImage.size.width
        let logoHeight = logoWidth * aspectRatio
        
        logoView.frame = CGRect(
          x: (splashVC.view.bounds.width - logoWidth) / 2,
          y: (splashVC.view.bounds.height - logoHeight) / 2,
          width: logoWidth,
          height: logoHeight
        )
        
        logoView.autoresizingMask = [.flexibleLeftMargin, .flexibleRightMargin, .flexibleTopMargin, .flexibleBottomMargin]
        splashVC.view.addSubview(logoView)
        
        // Store reference for logo animation
        logoImageView = logoView
      }
      
      window.rootViewController = splashVC
      window.makeKeyAndVisible()
      
      splashWindow = window
      isVisible = true
    }
  }
  
  @objc
  func show() {
    DispatchQueue.main.async {
      SplashScreenModule.showSplashScreen()
    }
  }
  
  // MARK: - Animated Splash Screen (Addon)
  
  /// Shows splash with animation support. Falls back to static if no animation assets found.
  /// This does NOT modify the existing showSplashScreen() — it wraps it with animation logic.
  private static func showAnimatedSplashScreen() {
    // Check for Lottie animation file
    if let animationPath = Bundle.main.path(forResource: "splash_animation", ofType: "json") {
      showLottieSplash(animationPath: animationPath)
      return
    }
    
    // Check for video file
    if let videoPath = Bundle.main.path(forResource: "splash_video", ofType: "mp4") {
      showVideoSplash(videoPath: videoPath)
      return
    }
    
    // No animation assets found — fall back to existing static splash
    showSplashScreen()
    
    // Apply logo animation preset if configured
    applyLogoAnimationIfConfigured()
  }
  
  /// Show Lottie animation splash screen
  private static func showLottieSplash(animationPath: String) {
    #if canImport(Lottie)
    guard !isVisible else { return }
    
    if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
      let window = UIWindow(windowScene: scene)
      window.windowLevel = .alert + 1
      
      let splashVC = UIViewController()
      
      // Read background color from config, default to white
      let bgColor = readConfigValue(key: "backgroundColor") ?? "#FFFFFF"
      splashVC.view.backgroundColor = colorFromHex(bgColor)
      
      // Add background image if available (same as static splash)
      if let splashImage = UIImage(named: "splash_image") {
        let imageView = UIImageView(image: splashImage)
        imageView.contentMode = .scaleAspectFill
        imageView.frame = splashVC.view.bounds
        imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        splashVC.view.addSubview(imageView)
      }
      
      // Add Lottie animation view
      let animationView = LottieAnimationView(filePath: animationPath)
      animationView.contentMode = .scaleAspectFit
      animationView.frame = splashVC.view.bounds
      animationView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      animationView.backgroundBehavior = .pauseAndRestore
      
      // Check if loop is configured
      let shouldLoop = readConfigValue(key: "animationLoop") == "true"
      animationView.loopMode = shouldLoop ? .loop : .playOnce
      
      splashVC.view.addSubview(animationView)
      animationView.play()
      
      window.rootViewController = splashVC
      window.makeKeyAndVisible()
      
      splashWindow = window
      isVisible = true
    }
    #else
    // Lottie not available — fall back to static splash
    showSplashScreen()
    applyLogoAnimationIfConfigured()
    #endif
  }
  
  /// Show video splash screen
  private static func showVideoSplash(videoPath: String) {
    guard !isVisible else { return }
    
    if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
      let window = UIWindow(windowScene: scene)
      window.windowLevel = .alert + 1
      
      let splashVC = UIViewController()
      
      // Read background color from config, default to white
      let bgColor = readConfigValue(key: "backgroundColor") ?? "#FFFFFF"
      splashVC.view.backgroundColor = colorFromHex(bgColor)
      
      // Setup AVPlayer
      let videoURL = URL(fileURLWithPath: videoPath)
      let avPlayer = AVPlayer(url: videoURL)
      avPlayer.isMuted = true  // Splash videos should be silent
      
      let playerLayer = AVPlayerLayer(player: avPlayer)
      playerLayer.frame = splashVC.view.bounds
      playerLayer.videoGravity = .resizeAspectFill
      splashVC.view.layer.addSublayer(playerLayer)
      
      // Check if loop is configured
      let shouldLoop = readConfigValue(key: "videoLoop") == "true"
      if shouldLoop {
        NotificationCenter.default.addObserver(
          forName: .AVPlayerItemDidPlayToEndTime,
          object: avPlayer.currentItem,
          queue: .main
        ) { _ in
          avPlayer.seek(to: .zero)
          avPlayer.play()
        }
      }
      
      avPlayer.play()
      player = avPlayer
      
      window.rootViewController = splashVC
      window.makeKeyAndVisible()
      
      splashWindow = window
      isVisible = true
    }
  }
  
  /// Apply logo animation preset if configured in splash_config.plist
  private static func applyLogoAnimationIfConfigured() {
    guard let logoView = logoImageView else { return }
    guard let animationType = readConfigValue(key: "logoAnimation") else { return }
    
    SplashAnimationHelper.animate(view: logoView, type: animationType)
  }
  
  /// Read a value from splash_config.plist (written by Expo plugin)
  private static func readConfigValue(key: String) -> String? {
    guard let configPath = Bundle.main.path(forResource: "splash_config", ofType: "plist"),
          let config = NSDictionary(contentsOfFile: configPath) as? [String: Any] else {
      return nil
    }
    return config[key] as? String
  }
  
  /// Convert hex color string to UIColor
  private static func colorFromHex(_ hex: String) -> UIColor {
    let cleanHex = hex.replacingOccurrences(of: "#", with: "")
    guard cleanHex.count == 6 else { return .white }
    
    var rgb: UInt64 = 0
    Scanner(string: cleanHex).scanHexInt64(&rgb)
    
    return UIColor(
      red: CGFloat((rgb >> 16) & 0xFF) / 255.0,
      green: CGFloat((rgb >> 8) & 0xFF) / 255.0,
      blue: CGFloat(rgb & 0xFF) / 255.0,
      alpha: 1.0
    )
  }
  
  @objc
  func showAnimated() {
    DispatchQueue.main.async {
      SplashScreenModule.showAnimatedSplashScreen()
    }
  }
  
  @objc
  func hide(_ animated: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard SplashScreenModule.isVisible, let window = SplashScreenModule.splashWindow else {
        resolve(false)
        return
      }
      
      // Stop any running animations/video before hiding
      if let logoView = SplashScreenModule.logoImageView {
        SplashAnimationHelper.stopAnimations(view: logoView)
      }
      SplashScreenModule.player?.pause()
      SplashScreenModule.player = nil
      SplashScreenModule.logoImageView = nil
      
      if animated {
        UIView.animate(withDuration: 0.3, animations: {
          window.alpha = 0
        }) { _ in
          window.isHidden = true
          window.rootViewController = nil
          SplashScreenModule.splashWindow = nil
          SplashScreenModule.isVisible = false
          
          // Ensure the main window becomes key again
          if let mainWindow = UIApplication.shared.windows.first(where: { $0.rootViewController != nil && $0 != window }) {
            mainWindow.makeKeyAndVisible()
          }
          
          resolve(true)
        }
      } else {
        window.isHidden = true
        window.rootViewController = nil
        SplashScreenModule.splashWindow = nil
        SplashScreenModule.isVisible = false
        
        // Ensure the main window becomes key again
        if let mainWindow = UIApplication.shared.windows.first(where: { $0.rootViewController != nil && $0 != window }) {
          mainWindow.makeKeyAndVisible()
        }
        
        resolve(true)
      }
    }
  }
}
