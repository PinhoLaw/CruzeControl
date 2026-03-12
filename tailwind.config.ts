import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jde: {
          bg: "#0a0f1e",
          surface: "#0f172a",
          panel: "#1e293b",
          border: "#334155",
          cyan: "#22d3ee",
          success: "#34d399",
          purple: "#a78bfa",
          warning: "#fbbf24",
          danger: "#f87171",
          text: "#e2e8f0",
          muted: "#94a3b8",
          input: "#1e3a5f",
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
