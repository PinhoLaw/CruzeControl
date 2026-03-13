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
      boxShadow: {
        "glow-cyan": "0 0 15px rgba(34, 211, 238, 0.15), 0 0 3px rgba(34, 211, 238, 0.1)",
        "glow-green": "0 0 15px rgba(52, 211, 153, 0.15)",
        "glow-purple": "0 0 15px rgba(167, 139, 250, 0.15)",
        "glow-amber": "0 0 15px rgba(251, 191, 36, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
