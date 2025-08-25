// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-out",
      },
      boxShadow: {
        glow: "0 0 25px rgba(168, 85, 247, 0.7)", // violeta glow
      },
    },
  },
  plugins: [],
};
