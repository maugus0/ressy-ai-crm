import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/utils/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "src/**/*.tests.{ts,tsx}"],
    // Use forks pool to avoid inspector module dependency issues
    // This helps when running on Node.js versions that don't fully support node:inspector/promises
    pool: "forks",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/utils/__tests__/setup.ts",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

