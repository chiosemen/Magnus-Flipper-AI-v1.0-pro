import { ExpoRoot } from "expo-router";
import { withSentry } from "./sentry.expo";

function Root() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}

export default withSentry(Root);
