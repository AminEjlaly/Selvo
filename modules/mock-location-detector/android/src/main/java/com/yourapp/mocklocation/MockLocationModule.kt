package com.yourapp.mocklocation

import android.content.Context
import android.location.LocationManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MockLocationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MockLocationDetector")

    Function("isMockLocationActive") {
      val context = appContext.reactContext ?: return@Function false
      val lm = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

      val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, LocationManager.FUSED_PROVIDER)
      for (provider in providers) {
        try {
          val location = lm.getLastKnownLocation(provider) ?: continue
          val isMocked = if (Build.VERSION.SDK_INT >= 31) {
            location.isMock
          } else {
            @Suppress("DEPRECATION")
            location.isFromMockProvider
          }
          if (isMocked) return@Function true
        } catch (e: Exception) {
          // provider ممکنه وجود نداشته باشه یا permission نده
        }
      }
      return@Function false
    }
  }
}