import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Configuración de Vitest (tests unitarios).
 * El alias "@" permite usar las mismas rutas que en tsconfig ("@/*").
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.dirname(fileURLToPath(import.meta.url)),
    },
  },
});
