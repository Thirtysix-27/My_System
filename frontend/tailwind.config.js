/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#161410',
        pine: '#1c4638',
        moss: '#3f6f58',
        fog: '#e6ebe4',
        sand: '#d9cbb6',
        ochre: '#b8893d',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Sora', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 18px 40px -24px rgba(22, 20, 16, 0.45)',
      },
    },
  },
  plugins: [],
}
