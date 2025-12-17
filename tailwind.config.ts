import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#137fec",
        "primary-hover": "#0f6ac6",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
        "bg-dark": "#101922",
        "card-dark": "#192633",
        "input-border": "#324d67",
        "text-secondary": "#92adc9",
      },
      fontFamily: {
        display: ["Lexend", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
