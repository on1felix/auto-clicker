import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#06061a',
          deep: '#0a0a1f',
          mid: '#1a0f2e'
        },
        glass: {
          surface: 'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.10)',
          hi: 'rgba(255,255,255,0.14)'
        },
        accent: {
          cyan: '#22d3ee',
          violet: '#a78bfa',
          rose: '#f472b6'
        }
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      backdropBlur: {
        xs: '4px'
      },
      keyframes: {
        spin360: {
          to: { transform: 'rotate(360deg)' }
        },
        floatA: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(40px,-30px) scale(1.1)' }
        },
        floatB: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-30px,40px) scale(1.15)' }
        },
        floatC: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-20px,-25px) scale(0.95)' }
        }
      },
      animation: {
        'spin-slow': 'spin360 4s linear infinite',
        'float-a': 'floatA 18s ease-in-out infinite',
        'float-b': 'floatB 22s ease-in-out infinite',
        'float-c': 'floatC 26s ease-in-out infinite'
      }
    }
  },
  plugins: []
} satisfies Config
