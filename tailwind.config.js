/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2BB990",
        "primary-hover": "#2BB990",
      },
      fontFamily: {
        sans: ['"Montserrat"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
