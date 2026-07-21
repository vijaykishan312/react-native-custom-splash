package com.rncustomsplash

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.view.View
import android.view.animation.OvershootInterpolator
import android.view.animation.AccelerateDecelerateInterpolator

/**
 * Provides preset logo animations for the splash screen.
 * This is purely additive — only called when logoAnimation config is set.
 * All offsets are screen-relative so they work on phones and tablets alike.
 */
object SplashAnimationHelper {

    /**
     * Apply an animation preset to the given view.
     * @param view The ImageView (logo) to animate
     * @param type The animation type string from config
     * @param duration Animation duration in milliseconds (default: 1000)
     */
    fun animate(view: View, type: String, duration: Long = 1000L) {
        when (type) {
            "fadeIn" -> applyFadeIn(view, duration)
            "scaleUp" -> applyScaleUp(view, duration)
            "bounce" -> applyBounce(view, duration)
            "pulse" -> applyPulse(view, duration)
            "slideUp" -> applySlideUp(view, duration)
            // Unknown animation type — do nothing, logo stays static
        }
    }

    private fun applyFadeIn(view: View, duration: Long) {
        view.alpha = 0f
        view.animate()
            .alpha(1f)
            .setDuration(duration)
            .setStartDelay(200)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .start()
    }

    private fun applyScaleUp(view: View, duration: Long) {
        view.scaleX = 0.3f
        view.scaleY = 0.3f
        view.alpha = 0f

        val scaleX = ObjectAnimator.ofFloat(view, "scaleX", 0.3f, 1f)
        val scaleY = ObjectAnimator.ofFloat(view, "scaleY", 0.3f, 1f)
        val alpha = ObjectAnimator.ofFloat(view, "alpha", 0f, 1f)

        AnimatorSet().apply {
            playTogether(scaleX, scaleY, alpha)
            this.duration = duration
            startDelay = 100
            interpolator = OvershootInterpolator(1.5f)
            start()
        }
    }

    private fun applyBounce(view: View, duration: Long) {
        view.scaleX = 0.1f
        view.scaleY = 0.1f
        view.alpha = 0f

        val scaleX = ObjectAnimator.ofFloat(view, "scaleX", 0.1f, 1f)
        val scaleY = ObjectAnimator.ofFloat(view, "scaleY", 0.1f, 1f)
        val alpha = ObjectAnimator.ofFloat(view, "alpha", 0f, 1f)

        AnimatorSet().apply {
            playTogether(scaleX, scaleY, alpha)
            this.duration = duration
            startDelay = 100
            interpolator = OvershootInterpolator(3.0f)
            start()
        }
    }

    private fun applyPulse(view: View, duration: Long) {
        view.alpha = 1f
        val halfDuration = duration / 2

        val scaleXUp = ObjectAnimator.ofFloat(view, "scaleX", 0.95f, 1.08f).apply {
            this.duration = halfDuration
            repeatCount = ObjectAnimator.INFINITE
            repeatMode = ObjectAnimator.REVERSE
            interpolator = AccelerateDecelerateInterpolator()
        }
        val scaleYUp = ObjectAnimator.ofFloat(view, "scaleY", 0.95f, 1.08f).apply {
            this.duration = halfDuration
            repeatCount = ObjectAnimator.INFINITE
            repeatMode = ObjectAnimator.REVERSE
            interpolator = AccelerateDecelerateInterpolator()
        }

        AnimatorSet().apply {
            playTogether(scaleXUp, scaleYUp)
            start()
        }
    }

    private fun applySlideUp(view: View, duration: Long) {
        // Use 25% of the screen height as the slide offset.
        // This scales correctly from a 5" phone to a 13" tablet.
        val screenHeightPx = view.resources.displayMetrics.heightPixels.toFloat()
        val slideOffset = screenHeightPx * 0.25f

        view.translationY = slideOffset
        view.alpha = 0f

        val translateY = ObjectAnimator.ofFloat(view, "translationY", slideOffset, 0f)
        val alpha = ObjectAnimator.ofFloat(view, "alpha", 0f, 1f)

        AnimatorSet().apply {
            playTogether(translateY, alpha)
            this.duration = duration
            startDelay = 100
            interpolator = OvershootInterpolator(1.2f)
            start()
        }
    }

    /**
     * Stop all animations on the view (called during hide)
     */
    fun stopAnimations(view: View) {
        view.clearAnimation()
        view.animate().cancel()
    }
}
