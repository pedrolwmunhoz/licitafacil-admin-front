import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1D1D1B",
        yellow: "#FFCC00",
        muted: "#374044",
        line: "#A7B3B7",
        soft: "#DAE0E3",
        panel: "#F4F5F6",
        danger: "#9E3229",
      },
      fontFamily: {
        sans: ['"Montserrat"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        mock: "4px",
      },
    },
  },
  plugins: [],
} satisfies Config;
