/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Unbounded', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ── Brand ────────────────────────────────────────────
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a5f',
        },
        // ── Accent (bright blue CTA) ─────────────────────────
        accent: {
          DEFAULT: '#2563eb',
          hover:   '#1d4ed8',
          light:   '#eff6ff',
          subtle:  '#dbeafe',
          text:    '#1e40af',
        },
        // ── Surface / backgrounds ────────────────────────────
        surface: {
          bg:     '#e8edf2',
          card:   '#ffffff',
          hover:  '#f1f5f9',
          active: '#e2e8f0',
          inner:  '#f8fafc',
        },
        // ── Ink / text ───────────────────────────────────────
        ink: {
          DEFAULT:   '#0f172a',
          secondary: '#475569',
          muted:     '#94a3b8',
          faint:     '#cbd5e1',
        },
        // ── Borders / dividers ───────────────────────────────
        edge: {
          DEFAULT: '#e2e8f0',
          soft:    '#f1f5f9',
          focus:   '#93c5fd',
        },
        // ── Sidebar (light theme matching reference) ─────────
        sidebar: {
          bg:            '#ffffff',
          border:        '#e2e8f0',
          hover:         '#f1f5f9',
          active:        '#eff6ff',
          accent:        '#2563eb',
          text:          '#64748b',
          'text-active': '#0f172a',
        },
        // ── Semantic ─────────────────────────────────────────
        risk: {
          low:      '#16a34a',
          medium:   '#d97706',
          high:     '#dc2626',
          critical: '#991b1b',
        },
        sentiment: {
          positive: '#16a34a',
          neutral:  '#64748b',
          negative: '#dc2626',
          mixed:    '#d97706',
        },
      },
      borderRadius: {
        'xl':  '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        card:         '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
        panel:        '0 24px 48px -12px rgba(0, 0, 0, 0.18)',
        focus:        '0 0 0 3px rgba(37, 99, 235, 0.2)',
        'inner-card': '0 0 0 1px rgba(0, 0, 0, 0.04)',
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
