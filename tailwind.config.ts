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
        bordeaux: {
          DEFAULT: "#7c1d35",
          light: "#9b2445",
          dark: "#5e1528",
        },
        rose: {
          crm: "#e8648a",
        },
        offwhite: "#f7f5f3",
        brand: {
          bg: "#f7f5f3",
          text: "#1a1218",
          primary: "#7c1d35",
          secondary: "#e8648a",
        },
      },
      fontFamily: {
        sans: ["var(--font-bricolage)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
