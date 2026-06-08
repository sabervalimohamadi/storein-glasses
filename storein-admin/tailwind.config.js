/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:  ['IRANSans',     'Tahoma', 'system-ui', 'sans-serif'],
        fanum: ['IRANSansFaNum','Tahoma', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#1B4F8A',
          dark:    '#0F3D73',
          light:   '#3B6FBE',
          50:      '#EFF6FF',
        },
        sidebar: {
          bg:     '#0F172A',
          hover:  '#1E293B',
          active: '#1B4F8A',
          text:   '#94A3B8',
          border: '#1E293B',
        },
        surface: '#F1F5F9',
        card:    '#FFFFFF',
        border:  '#E2E8F0',
        text: {
          primary:   '#0F172A',
          secondary: '#64748B',
          disabled:  '#CBD5E1',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error:   '#EF4444',
        info:    '#3B82F6',
      },
      boxShadow: {
        card:     '0 1px 3px rgba(0,0,0,0.08)',
        sidebar:  '2px 0 8px rgba(0,0,0,0.15)',
        dropdown: '0 4px 16px rgba(0,0,0,0.12)',
        modal:    '0 8px 32px rgba(0,0,0,0.16)',
      },
      zIndex: {
        sidebar:  '50',
        header:   '40',
        dropdown: '60',
        modal:    '70',
        toast:    '80',
      },
    },
  },
  plugins: [],
}
