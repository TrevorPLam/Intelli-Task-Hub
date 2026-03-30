/**
 * Mockup Sandbox Vite Configuration
 *
 * Environment Variables:
 *
 * Required:
 * - PORT: Server port number (e.g., "5173")
 * - BASE_PATH: Base path for the application (e.g., "/" or "/mockup-sandbox")
 *
 * Optional:
 * - NODE_ENV: Environment mode ("development" | "production")
 * - ENABLE_REPLIT_PLUGINS: Enable Replit-specific plugins ("true" | "false")
 * - REPL_ID: Replit environment identifier (auto-provided in Replit)
 *
 * Workspace Package Aliases:
 * This configuration supports @workspace/* package aliases for importing
 * from workspace libraries. Add aliases to the resolve.alias object as needed.
 *
 * Example:
 * '@workspace/api-client-react': path.resolve(__dirname, '../../lib/api-client-react/src/index.ts')
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { visualizer } from "rollup-plugin-visualizer";
import { mockupPreviewPlugin } from "./mockupPreviewPlugin";

const rawPort = process.env.PORT;

let port = rawPort ? Number(rawPort) : 5173;

if (Number.isNaN(port) || port <= 0) {
  console.error(`Invalid PORT value: "${rawPort}", using default 5173`);
  port = 5173;
}

if (!rawPort) {
  console.warn("PORT environment variable not provided, using default 5173");
}

const basePath = process.env.BASE_PATH ?? "/";

if (!process.env.BASE_PATH) {
  console.warn(
    'BASE_PATH environment variable not provided, using default "/"'
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    mockupPreviewPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: "dist/stats.html",
    }),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_REPLIT_PLUGINS === "true"
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            })
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // Workspace package aliases for importing from workspace libraries
      "@workspace/api-client-react": path.resolve(__dirname, "../../lib/api-client-react/src/index.ts"),
      "@workspace/api-spec": path.resolve(__dirname, "../../lib/api-spec/openapi.yaml"),
      "@workspace/api-zod": path.resolve(__dirname, "../../lib/api-zod/src/index.ts"),
      "@workspace/db": path.resolve(__dirname, "../../lib/db/src/index.ts"),
      "@workspace/integrations-openai-ai-server": path.resolve(__dirname, "../../lib/integrations-openai-ai-server/src/index.ts"),
      "@workspace/integrations-openai-ai-react": path.resolve(__dirname, "../../lib/integrations-openai-ai-react/src/index.ts"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
