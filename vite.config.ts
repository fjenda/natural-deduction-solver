import { build, defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { configDefaults } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: "/natural-deduction-solver/",
  build: {
    sourcemap: true,
  },
  test: {
    exclude: [
      ...configDefaults.exclude,
      "src/stores/**",
      "src/types/**",
      "src/lib/**/**.svelte",
    ],
    coverage: {
      exclude: [
        ...configDefaults.exclude,
        "src/stores/**",
        "src/types/**",
        "src/lib/**/**.svelte",
      ],
    },
  },
});
