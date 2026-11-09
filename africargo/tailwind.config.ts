import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0B2E4F", // navy - nav, headers, dark sections
          dark: "#081F38",
          50: "#EAF0F5",
        },
        accent: {
          DEFAULT: "#1E7A4C", // green - CTAs, active states, positive metrics
          light: "#E8F5EE",
          dark: "#155C39",
        },
        warn: {
          DEFAULT: "#E8833A", // orange - used sparingly: badges, map pins
          light: "#FDECDF",
        },
        ink: {
          DEFAULT: "#0F172A",
          muted: "#64748B",
          faint: "#94A3B8",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F8FAFC",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 8px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
