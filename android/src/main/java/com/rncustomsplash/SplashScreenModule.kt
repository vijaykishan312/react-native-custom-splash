package com.rncustomsplash

import android.app.Dialog
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.Point
import android.graphics.drawable.ColorDrawable
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.RelativeLayout
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
        private var videoViewRef: VideoView? = null

        @JvmStatic
        fun show(activity: Activity) {
            // Forward static show() to showAnimated() so it handles dual-phase/configs correctly
            showAnimated(activity)
        }

        @JvmStatic
        fun showAnimated(activity: Activity) {
            if (isVisible) return

            UiThreadUtil.runOnUiThread {
                try {
                    val logoResId = activity.resources.getIdentifier("splash_logo", "drawable", activity.packageName)
                    val bgResId = activity.resources.getIdentifier("splash_image", "drawable", activity.packageName)
                    val hasAnimation = hasAssetFile(activity, "splash_animation.json") && isLottieAvailable()
                    val videoResId = activity.resources.getIdentifier("splash_video", "raw", activity.packageName)
                    val hasVideo = videoResId != 0
                    val hasLogo = logoResId != 0

                    var bgColorStr = readConfigValue(activity, "backgroundColor") ?: "#FFFFFF"
                    if (bgColorStr.startsWith("#") && bgColorStr.length == 4) {
                        bgColorStr = "#" + bgColorStr[1] + bgColorStr[1] + bgColorStr[2] + bgColorStr[2] + bgColorStr[3] + bgColorStr[3]
                    }
                    val bgColor = try {
                        Color.parseColor(bgColorStr)
                    } catch (e: Exception) {
                        Color.WHITE
                    }

                    // Create dynamic container
                    val container = FrameLayout(activity).apply {
                        layoutParams = FrameLayout.LayoutParams(
                            FrameLayout.LayoutParams.MATCH_PARENT,
                            FrameLayout.LayoutParams.MATCH_PARENT
                        )
                        setBackgroundColor(bgColor)
                    }

                    // Add background image if available (full-bleed, aspect-fill)
                    if (bgResId != 0) {
                        val bgView = ImageView(activity).apply {
                            layoutParams = FrameLayout.LayoutParams(
                                FrameLayout.LayoutParams.MATCH_PARENT,
                                FrameLayout.LayoutParams.MATCH_PARENT
                            )
                            scaleType = ImageView.ScaleType.CENTER_CROP
                            setImageResource(bgResId)
                        }
                        container.addView(bgView)
                    }

                    // Create the dialog using a style that supports all API levels and form factors
                    val dialog = Dialog(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen).apply {
                        setContentView(container)
                        setCancelable(false)
                        window?.apply {
                            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
                            // Modern edge-to-edge handling
                            addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
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
                            // Ensure dialog fills the full window on tablets too
                            setLayout(
                                WindowManager.LayoutParams.MATCH_PARENT,
                                WindowManager.LayoutParams.MATCH_PARENT
                            )
                        }
                    }

                    splashDialog = dialog
                    isVisible = true

                    if (hasLogo && (hasAnimation || hasVideo)) {
                        // Phase 1: Show logo first
                        val logoWidthPx = resolveLogoWidthPx(activity)
                        val logoParams = FrameLayout.LayoutParams(logoWidthPx, FrameLayout.LayoutParams.WRAP_CONTENT).apply {
                            gravity = Gravity.CENTER
                        }
                        val logoImageView = ImageView(activity).apply {
                            setImageResource(logoResId)
                            scaleType = ImageView.ScaleType.FIT_CENTER
                            layoutParams = logoParams
                        }
                        container.addView(logoImageView)
                        logoView = logoImageView

                        // Apply logo animation preset if configured
                        applyLogoAnimationIfConfigured(activity)

                        val logoDurationStr = readConfigValue(activity, "logoDuration") ?: "2000"
                        val logoDuration = logoDurationStr.toLongOrNull() ?: 2000L

                        // Wait and transition to animation/video
                        val handler = android.os.Handler(android.os.Looper.getMainLooper())
                        handler.postDelayed({
                            // Phase 2: Start animation or video BEHIND the logo first
                            if (hasAnimation) {
                                playLottie(activity, container)
                            } else if (hasVideo) {
                                playVideo(activity, container, videoResId)
                            }

                            // Keep the logo in front while it fades out
                            logoImageView.bringToFront()

                            logoImageView.animate()
                                .alpha(0f)
                                .setDuration(400)
                                .withEndAction {
                                    container.removeView(logoImageView)
                                    if (logoView == logoImageView) {
                                        logoView = null
                                    }
                                }
                                .start()
                        }, logoDuration)

                        // Handle auto-hide duration
                        val durationKey = if (hasAnimation) "animationDuration" else "videoDuration"
                        val durationStr = readConfigValue(activity, durationKey) ?: "0"
                        val duration = durationStr.toLongOrNull() ?: 0L
                        if (duration > 0) {
                            handler.postDelayed({
                                hideSplashInternal(true)
                            }, logoDuration + duration)
                        }

                    } else if (hasAnimation) {
                        playLottie(activity, container)
                        
                        val durationStr = readConfigValue(activity, "animationDuration") ?: "0"
                        val duration = durationStr.toLongOrNull() ?: 0L
                        if (duration > 0) {
                            val handler = android.os.Handler(android.os.Looper.getMainLooper())
                            handler.postDelayed({
                                hideSplashInternal(true)
                            }, duration)
                        }
                    } else if (hasVideo) {
                        playVideo(activity, container, videoResId)
                        
                        val durationStr = readConfigValue(activity, "videoDuration") ?: "0"
                        val duration = durationStr.toLongOrNull() ?: 0L
                        if (duration > 0) {
                            val handler = android.os.Handler(android.os.Looper.getMainLooper())
                            handler.postDelayed({
                                hideSplashInternal(true)
                            }, duration)
                        }
                    } else {
                        // Static splash only (logo or image)
                        if (hasLogo) {
                            val logoWidthPx = resolveLogoWidthPx(activity)
                            val logoParams = FrameLayout.LayoutParams(logoWidthPx, FrameLayout.LayoutParams.WRAP_CONTENT).apply {
                                gravity = Gravity.CENTER
                            }
                            val logoImageView = ImageView(activity).apply {
                                setImageResource(logoResId)
                                scaleType = ImageView.ScaleType.FIT_CENTER
                                layoutParams = logoParams
                            }
                            container.addView(logoImageView)
                            logoView = logoImageView
                            applyLogoAnimationIfConfigured(activity)
                        }
                    }

                    dialog.show()

                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }

        /**
         * Resolve the logo width in pixels, responsive to screen size.
         * - If config has "logoWidth" ending with "%" — use that % of the shorter screen dimension.
         * - If config has a plain number — use it as dp, clamped to 60% of shorter dimension.
         * - Default: 25% of the shorter screen dimension.
         */
        private fun resolveLogoWidthPx(activity: Activity): Int {
            val dm = activity.resources.displayMetrics
            val density = dm.density
            val shorterDimPx = minOf(dm.widthPixels, dm.heightPixels)

            val logoWidthStr = readConfigValue(activity, "logoWidth")

            return when {
                logoWidthStr == null -> {
                    // Default: 25% of the shorter screen dimension
                    (shorterDimPx * 0.25f).toInt()
                }
                logoWidthStr.endsWith("%") -> {
                    val pct = logoWidthStr.dropLast(1).toFloatOrNull() ?: 25f
                    (shorterDimPx * (pct / 100f)).toInt()
                }
                else -> {
                    val dp = logoWidthStr.toFloatOrNull() ?: 150f
                    val px = (dp * density + 0.5f).toInt()
                    // Clamp: never exceed 60% of the shorter screen side
                    minOf(px, (shorterDimPx * 0.60f).toInt())
                }
            }
        }

        private fun playLottie(activity: Activity, container: FrameLayout) {
            try {
                // Instantiating LottieAnimationView dynamically
                val lottieClass = Class.forName("com.airbnb.lottie.LottieAnimationView")
                val lottieView = lottieClass.getConstructor(android.content.Context::class.java).newInstance(activity) as View
                
                lottieView.layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )

                val setAnimationMethod = lottieView.javaClass.getMethod("setAnimation", String::class.java)
                setAnimationMethod.invoke(lottieView, "splash_animation.json")

                val shouldLoop = readConfigValue(activity, "animationLoop") == "true"
                if (shouldLoop) {
                    val setRepeatCount = lottieView.javaClass.getMethod("setRepeatCount", Int::class.java)
                    setRepeatCount.invoke(lottieView, -1) // -1 is LottieDrawable.INFINITE
                }

                val playMethod = lottieView.javaClass.getMethod("playAnimation")
                playMethod.invoke(lottieView)

                container.addView(lottieView)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        /**
         * Play a video with correct aspect-ratio handling for all screen sizes.
         * VideoView is wrapped in a centered container; its size is updated once
         * the video size is known to avoid stretching on tablets.
         */
        private fun playVideo(activity: Activity, container: FrameLayout, videoResId: Int) {
            try {
                val videoView = VideoView(activity)
                
                // Start with MATCH_PARENT; we'll correct the size once video dimensions are known
                val params = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                ).apply {
                    gravity = Gravity.CENTER
                }
                videoView.layoutParams = params
                
                val videoUri = Uri.parse("android.resource://${activity.packageName}/$videoResId")
                videoView.setVideoURI(videoUri)

                videoView.setOnPreparedListener { mp ->
                    mp.setVolume(0f, 0f)
                    val shouldLoop = readConfigValue(activity, "videoLoop") == "true"
                    mp.isLooping = shouldLoop

                    // Correct aspect ratio once we know the video dimensions
                    val videoWidth = mp.videoWidth
                    val videoHeight = mp.videoHeight
                    if (videoWidth > 0 && videoHeight > 0) {
                        val containerWidth = container.width.takeIf { it > 0 }
                            ?: activity.resources.displayMetrics.widthPixels
                        val containerHeight = container.height.takeIf { it > 0 }
                            ?: activity.resources.displayMetrics.heightPixels

                        val videoAspect = videoWidth.toFloat() / videoHeight.toFloat()
                        val containerAspect = containerWidth.toFloat() / containerHeight.toFloat()

                        val newWidth: Int
                        val newHeight: Int
                        if (videoAspect > containerAspect) {
                            // Video is wider — fit to width
                            newWidth = containerWidth
                            newHeight = (containerWidth / videoAspect).toInt()
                        } else {
                            // Video is taller — fit to height
                            newHeight = containerHeight
                            newWidth = (containerHeight * videoAspect).toInt()
                        }

                        videoView.layoutParams = FrameLayout.LayoutParams(newWidth, newHeight).apply {
                            gravity = Gravity.CENTER
                        }
                    }
                }

                videoView.start()
                container.addView(videoView)
                videoViewRef = videoView
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        private fun applyLogoAnimationIfConfigured(activity: Activity) {
            val animationType = readConfigValue(activity, "logoAnimation") ?: return
            val logo = logoView ?: return
            SplashAnimationHelper.animate(logo, animationType)
        }

        private fun hasAssetFile(activity: Activity, filename: String): Boolean {
            return try {
                activity.assets.open(filename).use { true }
            } catch (e: Exception) {
                false
            }
        }

        private fun isLottieAvailable(): Boolean {
            return try {
                Class.forName("com.airbnb.lottie.LottieAnimationView")
                true
            } catch (e: ClassNotFoundException) {
                false
            }
        }

        private fun readConfigValue(activity: Activity, key: String): String? {
            return try {
                val resId = activity.resources.getIdentifier("splash_$key", "string", activity.packageName)
                if (resId != 0) activity.getString(resId) else null
            } catch (e: Exception) {
                null
            }
        }

        fun hideSplashInternal(animated: Boolean) {
            UiThreadUtil.runOnUiThread {
                try {
                    splashDialog?.let { dialog ->
                        val handler = android.os.Handler(android.os.Looper.getMainLooper())
                        handler.postDelayed({
                            try {
                                if (splashDialog == null) return@postDelayed
                                
                                logoView?.let { SplashAnimationHelper.stopAnimations(it) }
                                logoView = null
                                
                                try {
                                    videoViewRef?.stopPlayback()
                                } catch (e: Exception) {}
                                videoViewRef = null

                                if (animated) {
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
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }, 150) // 150ms delay to allow React Native UI to draw its layout
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
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
        hideSplashInternal(animated)
        promise.resolve(true)
    }
}
