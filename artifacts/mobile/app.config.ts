import type { ExpoConfig } from "expo/config";

/**
 * Expo SDK 54 Dynamic Configuration
 *
 * This config file enables environment variable injection at build time.
 * Static app.json cannot reference process.env — this file can.
 *
 * @see https://docs.expo.dev/workflow/configuration/
 */

// Expo Router origin for deep linking/universal links
// Falls back to localhost for development if not set
const appOrigin = process.env.EXPO_PUBLIC_APP_ORIGIN ?? "https://localhost";

const config: ExpoConfig = {
  name: "AI Personal Assistant",
  slug: "mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "mobile",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },

  ios: {
    supportsTablet: false,
  },

  android: {
    package: "com.intellitaskhub.app",
    versionCode: 1,
    permissions: [
      // Network access for API calls
      "ACCESS_NETWORK_STATE",
      "INTERNET",
      // Image picker functionality
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      // Location features (used by expo-location)
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
    ],
  },

  web: {
    favicon: "./assets/images/icon.png",
  },

  plugins: [
    [
      "expo-router",
      {
        origin: appOrigin,
      },
    ],
    "expo-font",
    "expo-web-browser",
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
