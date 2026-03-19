import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          green: '#25d366',
          dark: '#128c7e',
          bg: '#07070e',
          card: '#0f0f1a',
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) forwards',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGreen: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(37,211,102,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(37,211,102,0)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
        'gradient-dark': 'linear-gradient(135deg, #07070e 0%, #0f0f1a 100%)',
      },
    },
  },
  plugins: [],
}
export default config
