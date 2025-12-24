package com.rncustomsplash

import android.app.Dialog
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Build
import android.view.View
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

class SplashScreenModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private var splashDialog: Dialog? = null
        private var isVisible = false

        @JvmStatic
        fun show(activity: AppCompatActivity) {
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
                    isVisible = true
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
            if (activity is AppCompatActivity) {
                show(activity)
            }
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
