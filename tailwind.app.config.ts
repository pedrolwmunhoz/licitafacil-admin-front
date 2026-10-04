import type { Config } from "tailwindcss";
import baseConfig from "./tailwind.config";

export default {
  presets: [baseConfig],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
} satisfies Config;
