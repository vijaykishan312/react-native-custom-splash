package com.rncustomsplash

import android.app.Dialog
import android.content.res.AssetManager
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import android.widget.VideoView
import android.app.Activity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

class SplashScreenModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private var splashDialog: Dialog? = null
        private var isVisible = false
        private var logoView: ImageView? = null

        @JvmStatic
        fun show(activity: Activity) {
            if (isVisible) return

            UiThreadUtil.runOnUiThread {
                try {
                    splashDialog = Dialog(activity, android.R.style.Theme_NoTitleBar_Fullscreen).apply {
                        setContentView(R.layout.splash_screen)
                        setCancelable(false)
                        window?.apply {
                            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
                            
                            // Make splash screen full screen
                            setFlags(
                                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                                WindowManager.LayoutParams.FLAG_FULLSCREEN
                            )
                            
                            // For API 30+, use WindowInsetsController
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                                setDecorFitsSystemWindows(false)
                            } else {
                                @Suppress("DEPRECATION")
                                decorView.systemUiVisibility = (
                                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                                )
                            }
                        }
                        show()
                    }
                    
                    // Store reference to logo image for animation
                    logoView = splashDialog?.findViewById(R.id.splash_image)
                    
                    isVisible = true
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }

        // --- Animated Splash Support (Addon) ---

        /**
         * Show splash with animation support. Falls back to static show() if no
         * animation/video assets are found. This does NOT modify the existing show().
         */
        @JvmStatic
        fun showAnimated(activity: Activity) {
            if (isVisible) return

            // Check for Lottie animation file in assets
            if (hasAssetFile(activity, "splash_animation.json") && isLottieAvailable()) {
                showLottieSplash(activity)
                return
            }

            // Check for video file in raw resources
            val videoResId = activity.resources.getIdentifier("splash_video", "raw", activity.packageName)
            if (videoResId != 0) {
                showVideoSplash(activity, videoResId)
                return
            }

            // No animation assets found — fall back to existing static splash
            show(activity)

            // Apply logo animation preset if configured
            applyLogoAnimationIfConfigured(activity)
        }

        /**
         * Show Lottie animation splash screen
         */
        private fun showLottieSplash(activity: Activity) {
            UiThreadUtil.runOnUiThread {
                try {
                    splashDialog = Dialog(activity, android.R.style.Theme_NoTitleBar_Fullscreen).apply {
                        setContentView(R.layout.splash_screen_animation)
                        setCancelable(false)
                        window?.apply {
                            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
                            setFlags(
                                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                                WindowManager.LayoutParams.FLAG_FULLSCREEN
                            )
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                                setDecorFitsSystemWindows(false)
                            } else {
                                @Suppress("DEPRECATION")
                                decorView.systemUiVisibility = (
                                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                                )
                            }
                        }

                        // Configure Lottie via reflection (avoids compile-time dependency)
                        try {
                            val lottieView = findViewById<View>(R.id.splash_lottie)
                            val setAnimationMethod = lottieView.javaClass.getMethod("setAnimation", String::class.java)
                            setAnimationMethod.invoke(lottieView, "splash_animation.json")

                            // Check loop config
                            val shouldLoop = readConfigValue(activity, "animationLoop") == "true"
                            if (shouldLoop) {
                                val repeatModeClass = Class.forName("com.airbnb.lottie.LottieDrawable")
                                val infiniteField = repeatModeClass.getField("INFINITE")
                                val setRepeatCount = lottieView.javaClass.getMethod("setRepeatCount", Int::class.java)
                                setRepeatCount.invoke(lottieView, infiniteField.getInt(null))
                            }

                            val playMethod = lottieView.javaClass.getMethod("playAnimation")
                            playMethod.invoke(lottieView)
                        } catch (e: Exception) {
                            // Lottie configuration failed — still show the dialog
                            e.printStackTrace()
                        }

                        // Show background image if available
                        val bgImageView = findViewById<ImageView>(R.id.splash_bg_image)
                        val bgResId = activity.resources.getIdentifier("splash_image", "drawable", activity.packageName)
                        if (bgResId != 0) {
                            bgImageView.setImageResource(bgResId)
                            bgImageView.visibility = View.VISIBLE
                        }

                        show()
                    }
                    isVisible = true
                } catch (e: Exception) {
                    e.printStackTrace()
                    // Fallback to static splash on any error
                    show(activity)
                }
            }
        }

        /**
         * Show video splash screen
         */
        private fun showVideoSplash(activity: Activity, videoResId: Int) {
            UiThreadUtil.runOnUiThread {
                try {
                    splashDialog = Dialog(activity, android.R.style.Theme_NoTitleBar_Fullscreen).apply {
                        setContentView(R.layout.splash_screen_video)
                        setCancelable(false)
                        window?.apply {
                            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
                            setFlags(
                                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                                WindowManager.LayoutParams.FLAG_FULLSCREEN
                            )
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                                setDecorFitsSystemWindows(false)
                            } else {
                                @Suppress("DEPRECATION")
                                decorView.systemUiVisibility = (
                                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                                )
                            }
                        }

                        val videoView = findViewById<VideoView>(R.id.splash_video)
                        val videoUri = Uri.parse("android.resource://${activity.packageName}/$videoResId")
                        videoView.setVideoURI(videoUri)

                        // Mute the video (splash videos should be silent)
                        videoView.setOnPreparedListener { mp ->
                            mp.setVolume(0f, 0f)

                            // Check if loop is configured
                            val shouldLoop = readConfigValue(activity, "videoLoop") == "true"
                            mp.isLooping = shouldLoop
                        }

                        videoView.start()
                        show()
                    }
                    isVisible = true
                } catch (e: Exception) {
                    e.printStackTrace()
                    // Fallback to static splash on any error
                    show(activity)
                }
            }
        }

        /**
         * Apply logo animation preset if configured
         */
        private fun applyLogoAnimationIfConfigured(activity: Activity) {
            val animationType = readConfigValue(activity, "logoAnimation") ?: return
            val logo = logoView ?: return
            SplashAnimationHelper.animate(logo, animationType)
        }

        /**
         * Check if an asset file exists
         */
        private fun hasAssetFile(activity: Activity, filename: String): Boolean {
            return try {
                activity.assets.open(filename).use { true }
            } catch (e: Exception) {
                false
            }
        }

        /**
         * Check if Lottie library is available at runtime
         */
        private fun isLottieAvailable(): Boolean {
            return try {
                Class.forName("com.airbnb.lottie.LottieAnimationView")
                true
            } catch (e: ClassNotFoundException) {
                false
            }
        }

        /**
         * Read a value from splash_config.xml resources (written by Expo plugin)
         */
        private fun readConfigValue(activity: Activity, key: String): String? {
            return try {
                val resId = activity.resources.getIdentifier("splash_$key", "string", activity.packageName)
                if (resId != 0) activity.getString(resId) else null
            } catch (e: Exception) {
                null
            }
        }
    }

    override fun getName(): String {
        return "SplashScreen"
    }

    @ReactMethod
    fun show() {
        reactApplicationContext.currentActivity?.let { activity ->
            Companion.show(activity)
        }
    }

    @ReactMethod
    fun showAnimated() {
        reactApplicationContext.currentActivity?.let { activity ->
            showAnimated(activity)
        }
    }

    @ReactMethod
    fun hide(animated: Boolean, promise: Promise) {
        if (!isVisible) {
            promise.resolve(false)
            return
        }

        UiThreadUtil.runOnUiThread {
            try {
                splashDialog?.let { dialog ->
                    // Stop any running logo animations before hiding
                    logoView?.let { SplashAnimationHelper.stopAnimations(it) }
                    logoView = null
                    
                    if (animated) {
                        // Add fade out animation
                        dialog.window?.decorView?.animate()
                            ?.alpha(0f)
                            ?.setDuration(300)
                            ?.withEndAction {
                                dialog.dismiss()
                                splashDialog = null
                                isVisible = false
                            }
                            ?.start()
                    } else {
                        dialog.dismiss()
                        splashDialog = null
                        isVisible = false
                    }
                }
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }
}
