import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        steel: {
          50: "#f5f7fa",
          100: "#e4e9f0",
          200: "#c9d2de",
          300: "#9aa8bd",
          400: "#677793",
          500: "#445674",
          600: "#33415b",
          700: "#283147",
          800: "#1b2233",
          900: "#10151f",
        },
        accent: {
          500: "#ff7a1a",
          600: "#e5690f",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
