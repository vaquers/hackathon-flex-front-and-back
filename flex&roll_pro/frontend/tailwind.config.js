/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Unbounded', 'system-ui', 'sans-serif'],
        display: ['Unbounded', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        display: '-0.06em',
        tight: '-0.04em',
        body: '-0.03em',
        metric: '-0.08em',
      },
      colors: {
        // ── Surface / backgrounds ────────────────────────────
        surface: {
          bg:     'var(--bg)',
          bg2:    'var(--bg-2)',
          card:   'var(--surface)',
          soft:   'var(--surface-soft)',
          muted:  'var(--surface-muted)',
          hover:  'rgba(226, 233, 246, 0.48)',
          inner:  'rgba(226, 233, 246, 0.48)',
        },
        // ── Brand / accent ──────────────────────────────────
        accent: {
          DEFAULT: 'var(--blue)',
          hover: '#1d4ed8',
          light: 'rgba(0, 86, 245, 0.08)',
          glow: 'rgba(0, 86, 245, 0.25)',
        },
        // ── Ink / text ──────────────────────────────────────
        ink: {
          DEFAULT: 'var(--text)',
          soft: 'var(--text-soft)',
          muted: 'var(--text-muted)',
          faint: '#cbd5e1',
          secondary: 'var(--text-muted)',
        },
        // ── Borders / strokes ───────────────────────────────
        edge: {
          DEFAULT: 'var(--stroke)',
          strong: 'var(--stroke-strong)',
        },
        // ── Semantic ────────────────────────────────────────
        risk: {
          low:      'var(--green)',
          medium:   'var(--orange)',
          high:     'var(--red)',
          critical: '#991b1b',
        },
        sentiment: {
          positive: 'var(--green)',
          neutral:  '#64748b',
          negative: 'var(--red)',
          mixed:    'var(--orange)',
        },
        blue: {
          50: 'rgba(0, 86, 245, 0.08)',
        },
        // keep sidebar refs working
        sidebar: {
          bg:            'transparent',
          border:        'transparent',
          hover:         'rgba(226, 233, 246, 0.48)',
          active:        'rgba(0, 86, 245, 0.08)',
          text:          'var(--text-muted)',
          'text-active': 'var(--text)',
        },
      },
      borderRadius: {
        'xs':  '10px',
        'sm':  '14px',
        'md':  '16px',
        'lg':  '20px',
        'xl':  '24px',
        '2xl': '32px',
        '3xl': '42px',
        '4xl': '47px',
        'full': '999px',
      },
      boxShadow: {
        card:         'inset 0 1px 0 rgba(255,255,255,0.96), 0 12px 32px rgba(129,149,193,0.13)',
        'card-hover': 'inset 0 1px 0 rgba(255,255,255,0.96), 0 18px 40px rgba(129,149,193,0.18)',
        panel:        '0 16px 38px rgba(118,141,188,0.10)',
        'panel-soft': '0 8px 22px rgba(118,141,188,0.06)',
        section:      'inset 0 1px 0 rgba(247,250,255,0.45), 0 14px 30px rgba(124,145,187,0.10)',
        btn:          '0 10px 24px rgba(0,86,245,0.22)',
        'btn-hover':  '0 14px 28px rgba(0,86,245,0.28)',
        focus:        '0 0 0 3px rgba(0,86,245,0.15)',
        sidebar:      'inset 0 1px 0 rgba(255,255,255,0.96), 0 12px 32px rgba(129,149,193,0.13)',
        input:        '0 2px 8px rgba(124,145,187,0.06)',
      },
      animation: {
        'fade-in':        'fadeIn 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'skeleton-pulse': 'skeletonPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
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
