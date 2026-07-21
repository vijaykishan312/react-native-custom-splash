//
//  SplashScreenModule.swift
//  RNCustomSplash
//
//  Custom Native Splash Screen Module for iOS
//  Responsive for all iPhone/iPad sizes and orientations.
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
  private static var playerLayer: AVPlayerLayer?
  private static var orientationObserver: NSObjectProtocol?
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  // No init auto-show: AppDelegate injection handles showing splash early (before RN bridge loads).
  // This prevents the white screen flash.
  
  @objc(show)
  static func show() {
    if Thread.isMainThread {
      SplashScreenModule.showAnimatedSplashScreen()
    } else {
      DispatchQueue.main.sync {
        SplashScreenModule.showAnimatedSplashScreen()
      }
    }
  }
  
  @objc
  func show() {
    if Thread.isMainThread {
      SplashScreenModule.showAnimatedSplashScreen()
    } else {
      DispatchQueue.main.sync {
        SplashScreenModule.showAnimatedSplashScreen()
      }
    }
  }
  
  @objc
  func showAnimated() {
    if Thread.isMainThread {
      SplashScreenModule.showAnimatedSplashScreen()
    } else {
      DispatchQueue.main.sync {
        SplashScreenModule.showAnimatedSplashScreen()
      }
    }
  }
  
  // MARK: - Animated Splash Screen
  
  private static func showAnimatedSplashScreen() {
    guard !isVisible else { return }
    
    // Find active window scene
    guard let scene = UIApplication.shared.connectedScenes
      .first(where: { $0.activationState == .foregroundActive || $0.activationState == .foregroundInactive }) as? UIWindowScene
      ?? UIApplication.shared.connectedScenes.first as? UIWindowScene else {
      return
    }
    
    let window = UIWindow(windowScene: scene)
    window.windowLevel = .alert + 1
    
    let splashVC = UIViewController()
    splashVC.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    
    // Read background color from config, default to white
    let bgColorStr = readConfigValue(key: "backgroundColor") ?? "#FFFFFF"
    let bgColor = colorFromHex(bgColorStr)
    splashVC.view.backgroundColor = bgColor
    
    // 1. Add background image if available
    if let splashImage = UIImage(named: "SplashBg") ?? UIImage(named: "splash_image") ?? UIImage(named: "splash") {
      let bgImageView = UIImageView(image: splashImage)
      bgImageView.contentMode = .scaleAspectFill
      bgImageView.frame = splashVC.view.bounds
      bgImageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      splashVC.view.addSubview(bgImageView)
    }
    
    // 2. Check assets and options
    let logoImage = UIImage(named: "SplashLogo") ?? UIImage(named: "splash_logo")
    let animationPath = Bundle.main.path(forResource: "splash_animation", ofType: "json")
    let videoPath = Bundle.main.path(forResource: "splash_video", ofType: "mp4")
    
    let hasLogo = logoImage != nil
    let hasAnimation = animationPath != nil
    let hasVideo = videoPath != nil
    
    if hasLogo && (hasAnimation || hasVideo) {
      // Phase 1: Show logo first
      let logoView = createLogoView(logoImage: logoImage!, superview: splashVC.view)
      splashVC.view.addSubview(logoView)
      logoImageView = logoView
      applyLogoAnimationIfConfigured()
      
      let logoDurationMs = readConfigValue(key: "logoDuration") ?? "2000"
      let logoDurationSec = (Double(logoDurationMs) ?? 2000.0) / 1000.0
      
      DispatchQueue.main.asyncAfter(deadline: .now() + logoDurationSec) {
        // Phase 2: Start Lottie animation or Video BEHIND the logo
        if hasAnimation {
          playLottie(animationPath: animationPath!, container: splashVC.view)
        } else if hasVideo {
          playVideo(videoPath: videoPath!, container: splashVC.view)
        }
        
        // Ensure logo view is in front
        splashVC.view.bringSubviewToFront(logoView)
        
        // Fade out logo and remove it
        UIView.animate(withDuration: 0.4, animations: {
          logoView.alpha = 0
        }) { _ in
          logoView.removeFromSuperview()
          if logoImageView == logoView {
            logoImageView = nil
          }
        }
      }
      
      // Auto-hide if duration configured
      let durationKey = hasAnimation ? "animationDuration" : "videoDuration"
      let durationMsStr = readConfigValue(key: durationKey) ?? "0"
      let durationSec = (Double(durationMsStr) ?? 0.0) / 1000.0
      if durationSec > 0 {
        DispatchQueue.main.asyncAfter(deadline: .now() + logoDurationSec + durationSec) {
          hideSplashInternal(animated: true)
        }
      }
    } else if hasAnimation {
      // Show animation immediately
      playLottie(animationPath: animationPath!, container: splashVC.view)
      
      let durationMsStr = readConfigValue(key: "animationDuration") ?? "0"
      let durationSec = (Double(durationMsStr) ?? 0.0) / 1000.0
      if durationSec > 0 {
        DispatchQueue.main.asyncAfter(deadline: .now() + durationSec) {
          hideSplashInternal(animated: true)
        }
      }
    } else if hasVideo {
      // Show video immediately
      playVideo(videoPath: videoPath!, container: splashVC.view)
      
      let durationMsStr = readConfigValue(key: "videoDuration") ?? "0"
      let durationSec = (Double(durationMsStr) ?? 0.0) / 1000.0
      if durationSec > 0 {
        DispatchQueue.main.asyncAfter(deadline: .now() + durationSec) {
          hideSplashInternal(animated: true)
        }
      }
    } else {
      // Show logo/image static only
      if hasLogo {
        let logoView = createLogoView(logoImage: logoImage!, superview: splashVC.view)
        splashVC.view.addSubview(logoView)
        logoImageView = logoView
        applyLogoAnimationIfConfigured()
      }
    }
    
    window.rootViewController = splashVC
    window.makeKeyAndVisible()
    splashWindow = window
    isVisible = true
  }
  
  // MARK: - Responsive Logo Sizing
  
  /// Returns a logo size adapted to the current screen:
  /// - If `logoWidth` config contains `%` (e.g. "30%"), it's treated as a percentage of the shorter screen dimension.
  /// - If it's a plain number (e.g. "200"), it's used as points directly.
  /// - Default: 25% of the shorter screen dimension.
  private static func resolveLogoWidth(superview: UIView) -> CGFloat {
    let screenBounds = superview.bounds
    let shorterDimension = min(screenBounds.width, screenBounds.height)
    
    guard let logoWidthStr = readConfigValue(key: "logoWidth") else {
      // Default: 25% of the shorter screen dimension — works on all phones, iPads, tablets
      return shorterDimension * 0.25
    }
    
    if logoWidthStr.hasSuffix("%"),
       let pct = Double(logoWidthStr.dropLast()) {
      // Percentage of the shorter dimension
      return shorterDimension * CGFloat(pct / 100.0)
    } else if let pts = Double(logoWidthStr) {
      // Plain point value — clamp so it's never more than 60% of the short side
      return min(CGFloat(pts), shorterDimension * 0.60)
    }
    
    return shorterDimension * 0.25
  }
  
  private static func createLogoView(logoImage: UIImage, superview: UIView) -> UIImageView {
    let logoView = UIImageView(image: logoImage)
    logoView.contentMode = .scaleAspectFit
    
    let logoWidth = resolveLogoWidth(superview: superview)
    let aspectRatio = logoImage.size.height / logoImage.size.width
    let logoHeight = logoWidth * aspectRatio
    
    logoView.frame = CGRect(
      x: (superview.bounds.width - logoWidth) / 2,
      y: (superview.bounds.height - logoHeight) / 2,
      width: logoWidth,
      height: logoHeight
    )
    // Flexible margins keep it centred when the view resizes (rotation, iPad split-view)
    logoView.autoresizingMask = [
      .flexibleLeftMargin, .flexibleRightMargin,
      .flexibleTopMargin, .flexibleBottomMargin
    ]
    return logoView
  }
  
  // MARK: - Lottie
  
  private static func playLottie(animationPath: String, container: UIView) {
    #if canImport(Lottie)
    let animationView = LottieAnimationView(filePath: animationPath)
    animationView.contentMode = .scaleAspectFit
    animationView.frame = container.bounds
    animationView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    animationView.backgroundBehavior = .pauseAndRestore
    
    let shouldLoop = readConfigValue(key: "animationLoop") == "true"
    animationView.loopMode = shouldLoop ? .loop : .playOnce
    
    container.addSubview(animationView)
    animationView.play()
    #endif
  }
  
  // MARK: - Video (rotation-aware)
  
  private static func playVideo(videoPath: String, container: UIView) {
    let videoURL = URL(fileURLWithPath: videoPath)
    let avPlayer = AVPlayer(url: videoURL)
    avPlayer.isMuted = true
    
    let layer = AVPlayerLayer(player: avPlayer)
    layer.frame = container.bounds
    layer.videoGravity = .resizeAspectFill
    container.layer.addSublayer(layer)
    
    // Keep reference so we can resize on rotation
    playerLayer = layer
    
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
    
    // Observe orientation changes to resize the player layer (important for iPad)
    orientationObserver = NotificationCenter.default.addObserver(
      forName: UIDevice.orientationDidChangeNotification,
      object: nil,
      queue: .main
    ) { [weak container] _ in
      guard let containerView = container else { return }
      CATransaction.begin()
      CATransaction.setDisableActions(true)
      playerLayer?.frame = containerView.bounds
      CATransaction.commit()
    }
    
    avPlayer.play()
    player = avPlayer
  }
  
  private static func applyLogoAnimationIfConfigured() {
    guard let logoView = logoImageView else { return }
    guard let animationType = readConfigValue(key: "logoAnimation") else { return }
    
    SplashAnimationHelper.animate(view: logoView, type: animationType)
  }
  
  private static func readConfigValue(key: String) -> String? {
    guard let configPath = Bundle.main.path(forResource: "splash_config", ofType: "plist"),
          let config = NSDictionary(contentsOfFile: configPath) as? [String: Any] else {
      return nil
    }
    return config[key] as? String
  }
  
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
  
  // MARK: - Hide
  
  fileprivate static func hideSplashInternal(animated: Bool) {
    guard isVisible, let window = splashWindow else { return }
    
    // Remove orientation observer for video
    if let obs = orientationObserver {
      NotificationCenter.default.removeObserver(obs)
      orientationObserver = nil
    }
    
    // Tiny delay of 150ms to allow React Native layout to perform its first draw pass.
    // This completely eliminates the white frame flash.
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
      guard isVisible, let window = splashWindow else { return }
      
      if let logoView = logoImageView {
        SplashAnimationHelper.stopAnimations(view: logoView)
      }
      player?.pause()
      player = nil
      playerLayer = nil
      logoImageView = nil
      
      if animated {
        UIView.animate(withDuration: 0.3, animations: {
          window.alpha = 0
        }) { _ in
          window.isHidden = true
          window.rootViewController = nil
          splashWindow = nil
          isVisible = false
          
          // Scene-based window restoration (replaces deprecated UIApplication.shared.windows)
          if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
            scene.windows.first(where: { $0.rootViewController != nil && $0 != window })?.makeKeyAndVisible()
          }
        }
      } else {
        window.isHidden = true
        window.rootViewController = nil
        splashWindow = nil
        isVisible = false
        
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
          scene.windows.first(where: { $0.rootViewController != nil && $0 != window })?.makeKeyAndVisible()
        }
      }
    }
  }
  
  @objc
  func hide(_ animated: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      if !SplashScreenModule.isVisible {
        resolve(false)
        return
      }
      SplashScreenModule.hideSplashInternal(animated: animated)
      resolve(true)
    }
  }
}
