import { ExpoConfig } from "expo/config";

export default ({ config }: { config: ExpoConfig }) => {
  return {
    ...config,
    name: "Magnus Flipper AI",
    slug: "magnus-flipper-ai",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "magnusflipper",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#000000",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.magnus.flipper",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000",
      },
      package: "com.magnus.flipper",
      softwareKeyboardLayoutMode: "pan",
    },
    extra: {
      API_URL: process.env.API_URL,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV ?? "production",
      eas: {
        projectId: "REPLACE_WITH_REAL_EAS_PROJECT_ID",
      },
    },
    updates: {
      url: "https://u.expo.dev/REPLACE_WITH_RUNTIME_ID",
      enabled: true,
      checkAutomatically: "ON_LOAD",
    },
    runtimeVersion: {
      policy: "sdkVersion",
    },
    plugins: [
      "expo-router",
      [
        "expo-build-properties",
        {
          android: { compileSdkVersion: 34 },
          ios: { deploymentTarget: "13.0" },
        },
      ],
    ],
  };
};
