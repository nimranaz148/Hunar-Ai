import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Playwright specs run under `playwright test`, not Vitest.
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
    fileParallelism: false,
    isolate: false,
    pool: "forks",
    testTimeout: 30000,
  },

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname || ".", "./"),
    },
  },
});
