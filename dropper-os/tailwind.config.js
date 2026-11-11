/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        titanium: {
          950: "#09090B", // Obsidian base
          900: "#121215", // Elevated surface
          800: "#18181B", // Card border/surface
          700: "#27272A", // Soft border
          600: "#3F3F46", // Muted border
          400: "#A1A1AA", // Muted text
          200: "#E4E4E7", // Primary text
          100: "#FAFAFA", // Bright white text
        },
        cyber: {
          emerald: "#10B981",
          emeraldDark: "#064E3B",
          cyan: "#06B6D4",
          violet: "#8B5CF6",
          amber: "#F59E0B",
          rose: "#F43F5E",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
