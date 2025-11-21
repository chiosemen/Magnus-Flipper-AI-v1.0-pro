import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: "src/index.ts",
    client: "src/provider/MagnusContext.tsx"
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
  external: ["react"],
  jsx: "react"
});
