/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'dark': {
          'bg': '#121212', // Deep charcoal
          'surface': '#1E1E28', // Midnight blue
          'accent': '#4DB6AC', // Aqua teal
          'muted': '#455A64', // Cool gray
          'hover': '#82E9DE', // Bright aqua
          'border': '#82E9DE' // Bright aqua
        },
        'text': {
          'primary': '#F5F5F5', // Bright white
          'secondary': '#CFD8DC', // Cool gray-blue
          'accent': '#4DB6AC' // Aqua teal
        }
      },
      typography: (theme) => ({
        invert: {
          css: {
            '--tw-prose-body': theme('colors.text.primary'),
            '--tw-prose-headings': theme('colors.text.primary'),
            '--tw-prose-lead': theme('colors.text.secondary'),
            '--tw-prose-links': theme('colors.text.accent'),
            '--tw-prose-bold': theme('colors.text.primary'),
            '--tw-prose-counters': theme('colors.text.secondary'),
            '--tw-prose-bullets': theme('colors.text.secondary'),
            '--tw-prose-hr': theme('colors.dark.border'),
            '--tw-prose-quotes': theme('colors.text.primary'),
            '--tw-prose-quote-borders': theme('colors.dark.accent'),
            '--tw-prose-captions': theme('colors.text.secondary'),
            '--tw-prose-code': theme('colors.text.primary'),
            '--tw-prose-pre-code': theme('colors.text.primary'),
            '--tw-prose-pre-bg': theme('colors.dark.muted'),
            '--tw-prose-th-borders': theme('colors.dark.border'),
            '--tw-prose-td-borders': theme('colors.dark.border'),
          },
        },
      }),
      boxShadow: {
        'panel': '0 4px 8px rgba(0, 0, 0, 0.2)', // Adds soft shadow for panel separation
      },
      fontWeight: {
        'heading': '700', // Stronger emphasis for headings
      },
      borderRadius: {
        'button': '0.375rem', // Slight rounding for button edges
      },
      spacing: {
        'input-padding': '0.75rem', // Consistent padding for input fields
      },
      transitionProperty: {
        'colors': 'background-color, border-color, color, fill, stroke', // Smooth transitions for hover and active states
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
