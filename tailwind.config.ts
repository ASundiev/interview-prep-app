import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#535bf2", // A brighter, more electric blue/purple often seen in tech/AI
          hover: "#4c51bf",
          light: "#818cf8",
        },
        secondary: {
          DEFAULT: "#10b981", // Emerald green for success/accents
          hover: "#059669",
        },
        dark: {
          950: "#05050a", // Almost black
          900: "#0f111a", // Deep rich dark blue-gray
          800: "#1a1d2d", // Lighter panel color
          700: "#272b42", // Border/Stroke color
        },
        surface: {
          DEFAULT: "#1a1d2d",
          hover: "#22263a",
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)', // Colorful glow background
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        'glow': '0 0 40px -10px rgba(83, 91, 242, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
};
export default config;
