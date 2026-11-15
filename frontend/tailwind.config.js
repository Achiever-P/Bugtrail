/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0a0d13",
        surface: {
          DEFAULT: "#12151f",
          raised: "#171b26",
          sunken: "#0d0f16",
        },
        stroke: {
          DEFAULT: "#1f2430",
          soft: "#181c26",
        },
        ink: {
          primary: "#e7e9ee",
          secondary: "#8b93a7",
          tertiary: "#565d70",
        },
        accent: {
          DEFAULT: "#4c8dff",
          hover: "#3b7ae8",
          soft: "#182338",
        },
        severity: {
          p0: "#f0475a",
          p1: "#f0a02b",
          p2: "#e6c227",
          p3: "#3ecf8e",
        },
        state: {
          open: "#f0475a",
          progress: "#f0a02b",
          review: "#4c8dff",
          resolved: "#3ecf8e",
          closed: "#6b7385",
          reopened: "#c77dff",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
