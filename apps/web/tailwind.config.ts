import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "kc-bg": "var(--kc-bg)",
        "kc-surface": "var(--kc-surface)",
        "kc-surface-2": "var(--kc-surface-2)",
        "kc-surface-3": "var(--kc-surface-3)",
        "kc-border": "var(--kc-border)",
        "kc-ink": "var(--kc-ink)",
        "kc-ink-muted": "var(--kc-ink-muted)",
        "kc-accent": "var(--kc-accent)",
        "kc-violet": "var(--kc-violet)",
        "kc-danger": "var(--kc-danger)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
