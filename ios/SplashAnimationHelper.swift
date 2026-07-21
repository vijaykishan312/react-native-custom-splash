//
//  SplashAnimationHelper.swift
//  RNCustomSplash
//
//  Logo animation presets for the splash screen.
//  These are applied to the existing splash_logo UIImageView
//  only when the user configures a logoAnimation in app.json.
//  All offsets are screen-relative so they work on any device size.
//

import Foundation
import UIKit

/// Provides preset logo animations for the splash screen.
/// This is purely additive — only called when logoAnimation config is set.
class SplashAnimationHelper {
  
  /// Available animation preset types
  enum AnimationType: String {
    case fadeIn
    case scaleUp
    case bounce
    case pulse
    case slideUp
  }
  
  /// Apply an animation preset to the given view.
  /// - Parameters:
  ///   - view: The UIImageView (logo) to animate
  ///   - type: The animation type string from config
  ///   - duration: Animation duration in seconds (default: 1.0)
  static func animate(view: UIImageView, type: String, duration: TimeInterval = 1.0) {
    guard let animationType = AnimationType(rawValue: type) else {
      // Unknown animation type — do nothing, logo stays static
      return
    }
    
    switch animationType {
    case .fadeIn:
      applyFadeIn(view: view, duration: duration)
    case .scaleUp:
      applyScaleUp(view: view, duration: duration)
    case .bounce:
      applyBounce(view: view, duration: duration)
    case .pulse:
      applyPulse(view: view, duration: duration)
    case .slideUp:
      applySlideUp(view: view, duration: duration)
    }
  }
  
  // MARK: - Animation Implementations
  
  private static func applyFadeIn(view: UIImageView, duration: TimeInterval) {
    view.alpha = 0
    UIView.animate(withDuration: duration, delay: 0.2, options: .curveEaseInOut) {
      view.alpha = 1
    }
  }
  
  private static func applyScaleUp(view: UIImageView, duration: TimeInterval) {
    view.transform = CGAffineTransform(scaleX: 0.3, y: 0.3)
    view.alpha = 0
    UIView.animate(
      withDuration: duration,
      delay: 0.1,
      usingSpringWithDamping: 0.6,
      initialSpringVelocity: 0.5,
      options: .curveEaseOut
    ) {
      view.transform = .identity
      view.alpha = 1
    }
  }
  
  private static func applyBounce(view: UIImageView, duration: TimeInterval) {
    view.transform = CGAffineTransform(scaleX: 0.1, y: 0.1)
    view.alpha = 0
    UIView.animate(
      withDuration: duration,
      delay: 0.1,
      usingSpringWithDamping: 0.4,
      initialSpringVelocity: 0.8,
      options: .curveEaseOut
    ) {
      view.transform = .identity
      view.alpha = 1
    }
  }
  
  private static func applyPulse(view: UIImageView, duration: TimeInterval) {
    view.alpha = 1
    let pulseAnimation = CABasicAnimation(keyPath: "transform.scale")
    pulseAnimation.duration = duration * 0.5
    pulseAnimation.fromValue = 0.95
    pulseAnimation.toValue = 1.08
    pulseAnimation.autoreverses = true
    pulseAnimation.repeatCount = .infinity
    pulseAnimation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
    view.layer.add(pulseAnimation, forKey: "pulse")
  }
  
  private static func applySlideUp(view: UIImageView, duration: TimeInterval) {
    let originalCenter = view.center
    // Use 25% of the screen height as the slide offset so it looks natural
    // on both compact iPhones and large iPads (not a fixed 200pt).
    let screenHeight = UIScreen.main.bounds.height
    let slideOffset = screenHeight * 0.25
    
    view.center = CGPoint(x: originalCenter.x, y: originalCenter.y + slideOffset)
    view.alpha = 0
    UIView.animate(
      withDuration: duration,
      delay: 0.1,
      usingSpringWithDamping: 0.7,
      initialSpringVelocity: 0.5,
      options: .curveEaseOut
    ) {
      view.center = originalCenter
      view.alpha = 1
    }
  }
  
  /// Stop all animations on the view (called during hide)
  static func stopAnimations(view: UIImageView) {
    view.layer.removeAllAnimations()
  }
}
