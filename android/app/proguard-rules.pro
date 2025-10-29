# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class expo.** { *; }

-dontwarn com.facebook.react.**
-dontwarn expo.**
