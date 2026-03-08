import type { Config } from "tailwindcss";

// Tailwind v4: design tokens are defined in src/app/globals.css inside @theme {}
// This file is kept only for editor/tooling compatibility.
const config: Config = {
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};

export default config;
