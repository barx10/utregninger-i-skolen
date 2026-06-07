/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdcff',
          300: '#8ec6ff',
          400: '#59a6ff',
          500: '#3385fb',
          600: '#1f66f0',
          700: '#1850dd',
          800: '#1a43b3',
          900: '#1b3c8d',
        },
        accent: {
          400: '#34d8a8',
          500: '#16bf8e',
          600: '#0ea372',
        },
      },
      boxShadow: {
        card: '0 10px 40px -12px rgba(27, 60, 141, 0.18)',
        soft: '0 2px 12px -2px rgba(27, 60, 141, 0.12)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}
