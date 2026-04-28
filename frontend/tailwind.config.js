/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        slate: {
          950: '#07111a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(16,185,129,0.18), 0 18px 50px rgba(6,95,70,0.18)',
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at top left, rgba(16,185,129,0.18), transparent 32%), radial-gradient(circle at top right, rgba(20,184,166,0.12), transparent 28%), linear-gradient(180deg, rgba(7,17,26,0.96), rgba(15,23,42,0.98))',
      },
    },
  },
  plugins: [],
}
