/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: 'var(--tg-theme-bg-color, #1a1a2e)',
          secondary: 'var(--tg-theme-secondary-bg-color, #16213e)',
          text: 'var(--tg-theme-text-color, #ffffff)',
          hint: 'var(--tg-theme-hint-color, #8b8b99)',
          link: 'var(--tg-theme-link-color, #6366f1)',
          button: 'var(--tg-theme-button-color, #6366f1)',
          'button-text': 'var(--tg-theme-button-text-color, #ffffff)',
        },
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 1.5s infinite',
        'ripple': 'ripple 1.5s ease-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.9)', opacity: '1' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
