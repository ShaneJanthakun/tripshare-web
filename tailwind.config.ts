import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm-biased darks — the coral accent sits in them instead of on top of them
        bg:      '#0F0D0C',
        surface: '#181513',
        s2:      '#211D1A',
        border:  '#2B2622',
        accent:  '#FF5C38',
        accent2: '#E8452A',
        ink:     '#F5F1EE',
        muted:   '#A39B94',
        faint:   '#6E675F',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee: 'marquee 55s linear infinite',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      boxShadow: {
        glow: '0 0 80px -12px rgba(255, 92, 56, 0.35)',
        card: '0 24px 48px -24px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};

export default config;
