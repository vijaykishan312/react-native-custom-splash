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
    guard let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive || $0.activationState == .foregroundInactive }) as? UIWindowScene ?? UIApplication.shared.connectedScenes.first as? UIWindowScene else {
      return
    }
    
    let window = UIWindow(windowScene: scene)
    window.windowLevel = .alert + 1
    
    let splashVC = UIViewController()
    
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
  
  private static func createLogoView(logoImage: UIImage, superview: UIView) -> UIImageView {
    let logoView = UIImageView(image: logoImage)
    logoView.contentMode = .scaleAspectFit
    
    let logoWidthStr = readConfigValue(key: "logoWidth") ?? "150"
    let logoWidth = CGFloat(Double(logoWidthStr) ?? 150.0)
    let aspectRatio = logoImage.size.height / logoImage.size.width
    let logoHeight = logoWidth * aspectRatio
    
    logoView.frame = CGRect(
      x: (superview.bounds.width - logoWidth) / 2,
      y: (superview.bounds.height - logoHeight) / 2,
      width: logoWidth,
      height: logoHeight
    )
    logoView.autoresizingMask = [.flexibleLeftMargin, .flexibleRightMargin, .flexibleTopMargin, .flexibleBottomMargin]
    return logoView
  }
  
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
  
  private static func playVideo(videoPath: String, container: UIView) {
    let videoURL = URL(fileURLWithPath: videoPath)
    let avPlayer = AVPlayer(url: videoURL)
    avPlayer.isMuted = true
    
    let playerLayer = AVPlayerLayer(player: avPlayer)
    playerLayer.frame = container.bounds
    playerLayer.videoGravity = .resizeAspectFill
    container.layer.addSublayer(playerLayer)
    
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
  
  fileprivate static func hideSplashInternal(animated: Bool) {
    guard isVisible, let window = splashWindow else { return }
    
    // Tiny delay of 150ms to allow React Native layout to perform its first draw pass.
    // This completely eliminates the white frame flash.
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
      guard isVisible, let window = splashWindow else { return }
      
      if let logoView = logoImageView {
        SplashAnimationHelper.stopAnimations(view: logoView)
      }
      player?.pause()
      player = nil
      logoImageView = nil
      
      if animated {
        UIView.animate(withDuration: 0.3, animations: {
          window.alpha = 0
        }) { _ in
          window.isHidden = true
          window.rootViewController = nil
          splashWindow = nil
          isVisible = false
          
          if let mainWindow = UIApplication.shared.windows.first(where: { $0.rootViewController != nil && $0 != window }) {
            mainWindow.makeKeyAndVisible()
          }
        }
      } else {
        window.isHidden = true
        window.rootViewController = nil
        splashWindow = nil
        isVisible = false
        
        if let mainWindow = UIApplication.shared.windows.first(where: { $0.rootViewController != nil && $0 != window }) {
          mainWindow.makeKeyAndVisible()
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
