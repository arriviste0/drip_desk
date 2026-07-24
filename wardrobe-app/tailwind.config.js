/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'brand-yellow': '#FFE000',
        'brand-pink': '#FF2D78',
        'brand-lime': '#B8FF00',
        'brand-blue': '#0047FF',
        'brand-red': '#FF0000',
        'brand-black': '#000000',
        'brand-white': '#FFFFFF',
        'brand-paper': '#F5F0E8',
        'brand-offwhite': '#F5F0E8',
      },
    },
  },
  plugins: [],
};
