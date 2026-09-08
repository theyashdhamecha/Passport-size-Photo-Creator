import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F3EA",
        "paper-2": "#EEE8D9",
        "paper-3": "#E4DCC8",
        ink: "#232A3B",
        "ink-soft": "#5B6478",
        line: "#D9CFB8",
        coral: "#E4572E",
        "coral-dark": "#C24A24",
        teal: "#2C8F94",
        "teal-dark": "#206B6F",
        warn: "#C98A1F",
        danger: "#B23A2E",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "grain": "radial-gradient(circle, rgba(35,42,59,0.05) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
export default config;
