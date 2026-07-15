package expo.modules.mocklocationdetector

import android.app.AppOpsManager
import android.content.pm.PackageManager
import android.location.LocationManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MockLocationDetectorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MockLocationDetector")

    AsyncFunction("isDeveloperOptionsEnabled") {
      try {
        val enabled = Settings.Secure.getInt(
          appContext.reactContext?.contentResolver,
          Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0
        )
        enabled == 1
      } catch (e: Exception) {
        false
      }
    }

    AsyncFunction("getRawLocationMockStatus") {
      try {
        val ctx = appContext.reactContext ?: return@AsyncFunction false
        val lm = ctx.getSystemService(android.content.Context.LOCATION_SERVICE) as LocationManager
        val providers = lm.getProviders(true)
        var isMocked = false
        for (provider in providers) {
          val loc = try { lm.getLastKnownLocation(provider) } catch (e: SecurityException) { null } ?: continue
          if (android.os.Build.VERSION.SDK_INT >= 31) {
            if (loc.isMock) { isMocked = true; break }
          } else {
            @Suppress("DEPRECATION")
            if (loc.isFromMockProvider) { isMocked = true; break }
          }
        }
        isMocked
      } catch (e: Exception) {
        false
      }
    }

    AsyncFunction("hasMockLocationApp") {
      try {
        val ctx = appContext.reactContext ?: return@AsyncFunction false
        val appOps = ctx.getSystemService(android.content.Context.APP_OPS_SERVICE) as AppOpsManager
        val pm = ctx.packageManager
        val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
        var found = false
        for (appInfo in packages) {
          try {
            val mode = appOps.checkOpNoThrow(
              AppOpsManager.OPSTR_MOCK_LOCATION,
              appInfo.uid, appInfo.packageName
            )
            if (mode == AppOpsManager.MODE_ALLOWED && appInfo.packageName != ctx.packageName) {
              found = true
              break
            }
          } catch (e: Exception) { /* skip */ }
        }
        found
      } catch (e: Exception) {
        false
      }
    }
  }
}