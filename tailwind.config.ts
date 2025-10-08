import type { Config } from 'tailwindcss'

export default {
  content: [
    './apps/dashboard/src/**/*.{html,ts}',
    './libs/ui/src/**/*.{html,ts}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
