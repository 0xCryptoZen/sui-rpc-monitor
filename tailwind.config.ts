import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sui: {
          blue: '#4DA2FF',
          teal: '#6FBCF0',
          dark: '#0F1419',
          light: '#F7F9FB',
        },
        status: {
          healthy: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          unknown: '#6B7280',
        }
      },
      animation: {
        'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
} satisfies Config