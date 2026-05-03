/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        ink: "#14213d",
        coral: "#ff6b6b",
        sand: "#f7f2e8",
        mint: "#d7f9f1",
        smoke: "#f8fafc",
      },
      boxShadow: {
        card: "0 20px 45px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        sans: ["Trebuchet MS", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
