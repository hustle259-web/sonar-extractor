import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fixora: {
          purple: {
            dark: '#2e0c5a',
            DEFAULT: '#5e2c8f',
            light: '#7c3aaf',
          },
          green: {
            bg: '#d4f2e6',
            accent: '#78e08f',
          },
        },
      },
      backgroundImage: {
        'fixora-hero': 'linear-gradient(180deg, #2e0c5a 0%, #5e2c8f 50%, #7c3aaf 100%)',
        'fixora-btn': 'linear-gradient(135deg, #5e2c8f 0%, #7c3aaf 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
