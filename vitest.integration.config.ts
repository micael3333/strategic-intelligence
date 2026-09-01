import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["src/**/*.integration.test.ts"], setupFiles: [fileURLToPath(new URL("./src/test/integration-setup.ts", import.meta.url))], testTimeout: 45_000 },
});
