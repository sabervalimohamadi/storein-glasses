import rtl from 'tailwindcss-rtl'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IRANYekan', 'Tahoma', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#1B4F8A',
          dark:    '#0F3D73',
          light:   '#3B6FBE',
        },
        surface: {
          DEFAULT: '#F4F6F9',
          card:    '#FFFFFF',
          border:  '#DDE3EC',
        },
        text: {
          primary:   '#1A202C',
          secondary: '#6B7280',
          disabled:  '#C4CBD6',
        },
        success: '#059669',
        warning: '#D97706',
        error:   '#DC2626',
        info:    '#2563EB',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        xl:    '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card:     '0 1px 4px rgba(0,0,0,0.08)',
        dropdown: '0 4px 16px rgba(0,0,0,0.12)',
        modal:    '0 8px 32px rgba(0,0,0,0.16)',
      },
      zIndex: {
        header:   '100',
        dropdown: '200',
        modal:    '300',
        toast:    '400',
      },
    },
  },
  plugins: [rtl],
}
