import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        kitchen: {
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-surface-elevated)',
          active: 'var(--bg-surface-active)',
          border: 'var(--border-subtle)',
          'border-strong': 'var(--border-strong)',
          amber: 'var(--color-amber)',
          'amber-glow': 'var(--color-amber-glow)',
          terracotta: 'var(--color-terracotta)',
          crimson: 'var(--color-crimson)',
          emerald: 'var(--color-emerald)',
          cyan: 'var(--color-cyan)',
          'text-primary': 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-muted': 'var(--text-muted)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        kitchen: '0 8px 32px rgba(2, 6, 23, 0.45)',
        'kitchen-sm': '0 4px 16px rgba(2, 6, 23, 0.35)',
        'kitchen-glow': '0 0 35px var(--color-amber-glow)',
        'kitchen-blue-glow': '0 0 30px rgba(56, 189, 248, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
