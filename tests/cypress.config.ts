import { defineConfig } from "cypress";

export default defineConfig({
  video: false,
  screenshotsFolder: "tests/screenshots",
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "tests/support/e2e.ts",
  },
});
