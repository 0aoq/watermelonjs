import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
    build: {
        lib: {
            name: "WatermelonJS",
            fileName: "watermelon",
            entry: resolve(__dirname, "package", "index.js"),
        },
        rollupOptions: {
            external: [],
            output: { globals: {} },
        },
    },
});
