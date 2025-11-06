/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#00C2FF',
        slatebg: '#0b1120',
      },
      fontFamily: {
        grotesk: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

