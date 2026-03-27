import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom color scheme for KMUTNB2Market marketplace
        'kd-bg': '#F9F6F0', // Background: cream light
        'kd-card': '#E6D5C3', // Card/Section: light brown
        'kd-primary': '#D9734E', // Primary accent: orange brick
        'kd-text': '#4A3B32', // Text: dark brown
        
        // Extended palette
        'kd-primary-hover': '#C8623D', // Darker orange for hover
        'kd-text-light': '#6B5A4F', // Lighter text
        'kd-border': '#D4C4B0', // Border color
        'kd-hover': '#DFCEBC', // Hover state for cards
      },
      backgroundColor: {
        'kd-bg': '#F9F6F0',
        'kd-card': '#E6D5C3',
      },
      textColor: {
        'kd-text': '#4A3B32',
        'kd-text-light': '#6B5A4F',
      },
      borderColor: {
        'kd-border': '#D4C4B0',
      }
    },
  },
  plugins: [],
}

export default config
