/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff5f5',
          100: '#ffe3e3',
          200: '#ffb3b3',
          300: '#ff8080',
          400: '#ff4d4d',
          500: '#e53935',
          600: '#d32f2f',
          700: '#b71c1c',
          800: '#8b0000',
          900: '#5c0000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      container: {
        center: true,
        padding: { DEFAULT: '1rem', lg: '1.5rem' },
        screens: { xl: '1280px', '2xl': '1440px' },
      },
    },
  },
  plugins: [],
}
