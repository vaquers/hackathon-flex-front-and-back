/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ── Brand (deep purple) ──────────────────────────────
        brand: {
          25:  '#faf9fd',
          50:  '#f2eefb',
          100: '#e5dcf8',
          200: '#cabef1',
          300: '#a896e4',
          400: '#836dd4',
          500: '#6047c2',
          600: '#4a34a8',
          700: '#37268a',
          800: '#251868',
          900: '#170c26',
        },
        // ── Accent (interactive violet) ──────────────────────
        accent: {
          DEFAULT: '#5d3fe8',
          hover:   '#4f34d6',
          faint:   '#f0ecfd',
          subtle:  '#e5defa',
          text:    '#4232c0',
        },
        // ── Surface / backgrounds ────────────────────────────
        surface: {
          bg:     '#f7f6fa',
          card:   '#ffffff',
          hover:  '#f3f1f8',
          active: '#ece8f5',
        },
        // ── Ink / text ───────────────────────────────────────
        ink: {
          DEFAULT:   '#1a1528',
          secondary: '#4f4a66',
          muted:     '#8c87a6',
          faint:     '#b8b3cc',
        },
        // ── Borders / dividers ───────────────────────────────
        edge: {
          DEFAULT: '#e8e4f0',
          soft:    '#f0eef7',
          focus:   '#8b7adf',
        },
        // ── Sidebar (dark theme) ─────────────────────────────
        sidebar: {
          bg:            '#170c26',
          border:        '#2a1a40',
          hover:         '#21153a',
          active:        '#2d1f4d',
          accent:        '#7c5cbf',
          text:          '#8b7aaa',
          'text-active': '#e5defa',
        },
        // ── Semantic (desaturated) ───────────────────────────
        risk: {
          low:      '#246e52',
          medium:   '#875209',
          high:     '#a82e4c',
          critical: '#7a1230',
        },
        sentiment: {
          positive: '#246e52',
          neutral:  '#6b6780',
          negative: '#a82e4c',
          mixed:    '#875209',
        },
      },
      boxShadow: {
        card:       '0 1px 2px 0 rgba(23, 12, 38, 0.05)',
        'card-hover': '0 2px 8px 0 rgba(23, 12, 38, 0.09)',
        panel:      '0 24px 64px -12px rgba(23, 12, 38, 0.24)',
        focus:      '0 0 0 2px rgba(93, 63, 232, 0.22)',
      },
      animation: {
        'fade-in':        'fadeIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'skeleton-pulse': 'skeletonPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        skeletonPulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
