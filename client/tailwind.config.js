/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        wa: {
          dark: '#0b141a',
          panel: '#111b21',
          input: '#1f2c34',
          bubble: '#005c4b',
          bubbleOut: '#005c4b',
          bubbleIn: '#1f2c34',
          accent: '#00a884',
          accentHover: '#06cf9c',
          text: '#e9edef',
          muted: '#8696a0',
          border: '#2a3942',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Helvetica Neue', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'pulse-soft': 'pulseSoft 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};
