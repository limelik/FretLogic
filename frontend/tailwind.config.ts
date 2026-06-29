import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#050816',
        ink: '#0e1328',
        glow: '#5eead4',
        ember: '#fb7185',
        gold: '#facc15',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(94,234,212,.08), 0 10px 28px rgba(8,12,30,.34)',
      },
      backgroundImage: {
        grain:
          'radial-gradient(circle at top, rgba(94,234,212,.08), transparent 28%), radial-gradient(circle at bottom right, rgba(251,113,133,.08), transparent 26%)',
      },
      animation: {
        drift: 'drift 16s linear infinite',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
        floatUp: 'floatUp .8s ease both',
      },
      keyframes: {
        drift: {
          '0%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(-12px, 12px, 0)' },
          '100%': { transform: 'translate3d(0,0,0)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(94,234,212,.35)' },
          '50%': { boxShadow: '0 0 0 12px rgba(94,234,212,0)' },
        },
        floatUp: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
