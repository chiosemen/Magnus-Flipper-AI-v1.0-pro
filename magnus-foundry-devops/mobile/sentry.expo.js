import * as Sentry from "@sentry/react-native";
import { NativeModules } from "react-native";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  enableAutoSessionTracking: true,
  integrations: [],
});

export const withSentry = (AppRoot) => {
  return Sentry.wrap(AppRoot);
};
