import type { Config } from 'tailwindcss';
import themes from 'daisyui/src/theming/themes';

// Tailwind loads this file as CommonJS, where `import daisyui from 'daisyui'`
// gives an empty object and the plugin is dropped without a warning. Load it
// with require, as the former tailwind.config.js did.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- an import loads an empty object here
const daisyui = require('daisyui') as NonNullable<Config['plugins']>[number];

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        yes: '#3fb68b',
        no: '#ff5353',
        info: '#00b2ff',
        main: 'var(--text-main)',
        secondary: 'var(--text-secondary)',
        active: 'var(--bg-active)',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          ...themes['[data-theme=light]'],
          primary: '#666cff',
        },
      },
      {
        dark: {
          ...themes['[data-theme=dark]'],
          primary: '#666cff',
          'base-100': '#2a334c',
          'base-200': '#252d37',
        },
      },
    ],
  },
} satisfies Config;
