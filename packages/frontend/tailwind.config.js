/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // unraid-ish dark palette
        base: '#0d1117',
        surface: '#161b22',
        border: '#30363d',
        primary: {
          500: '#f15a2b',
          600: '#e14e22',
          700: '#c0411b',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
