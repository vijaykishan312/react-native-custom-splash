//
//  SplashScreenModule.swift
//  RNCustomSplash
//
//  Custom Native Splash Screen Module for iOS
//

import Foundation
import UIKit
import React

@objc(SplashScreen)
class SplashScreenModule: NSObject {
  
  private static var splashWindow: UIWindow?
  private static var isVisible = false
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  override init() {
    super.init()
    // Show splash automatically when module initializes
    DispatchQueue.main.async {
      SplashScreenModule.showSplashScreen()
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
      
      // Try to load splash image from the main bundle
      // Users should add their splash image to their app's assets
      if let splashImage = UIImage(named: "splash") {
        let imageView = UIImageView(image: splashImage)
        imageView.contentMode = .scaleAspectFill
        imageView.frame = splashVC.view.bounds
        imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        splashVC.view.addSubview(imageView)
      } else {
        // Fallback: show white screen if no splash image is provided
        if #available(iOS 13.0, *) {
          splashVC.view.backgroundColor = .systemBackground
        } else {
          splashVC.view.backgroundColor = .white
        }
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
  
  @objc
  func hide(_ animated: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard SplashScreenModule.isVisible, let window = SplashScreenModule.splashWindow else {
        resolve(false)
        return
      }
      
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
