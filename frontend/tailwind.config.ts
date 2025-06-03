import type { Config } from "tailwindcss"
import { typographyTokens, spacingTokens, shadowTokens, animationTokens } from "./src/lib/design-tokens"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    spacing: spacingTokens,
    boxShadow: shadowTokens,
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        status: {
          'active-dot': 'hsl(var(--status-active-dot))',
          'active-badge-bg-light': 'hsl(var(--status-active-badge-background-light))',
          'active-badge-fg-light': 'hsl(var(--status-active-badge-foreground-light))',
          'active-badge-border-light': 'hsl(var(--status-active-badge-border-light))',
          'active-badge-bg-dark': 'rgba(var(--status-active-badge-background-dark-rgba))',
          'active-badge-fg-dark': 'hsl(var(--status-active-badge-foreground-dark))',
          'active-badge-border-dark': 'rgba(var(--status-active-badge-border-dark-rgba))',
          'pending-dot': 'hsl(var(--status-pending-dot))',
          'pending-badge-bg-light': 'hsl(var(--status-pending-badge-background-light))',
          'pending-badge-fg-light': 'hsl(var(--status-pending-badge-foreground-light))',
          'pending-badge-border-light': 'hsl(var(--status-pending-badge-border-light))',
          'pending-badge-bg-dark': 'rgba(var(--status-pending-badge-background-dark-rgba))',
          'pending-badge-fg-dark': 'hsl(var(--status-pending-badge-foreground-dark))',
          'pending-badge-border-dark': 'rgba(var(--status-pending-badge-border-dark-rgba))',
          'failed-dot': 'hsl(var(--status-failed-dot))',
          'failed-badge-bg-light': 'hsl(var(--status-failed-badge-background-light))',
          'failed-badge-fg-light': 'hsl(var(--status-failed-badge-foreground-light))',
          'failed-badge-border-light': 'hsl(var(--status-failed-badge-border-light))',
          'failed-badge-bg-dark': 'rgba(var(--status-failed-badge-background-dark-rgba))',
          'failed-badge-fg-dark': 'hsl(var(--status-failed-badge-foreground-dark))',
          'failed-badge-border-dark': 'rgba(var(--status-failed-badge-border-dark-rgba))',
          'inactive-dot': 'hsl(var(--status-inactive-dot))',
          'inactive-badge-bg-light': 'hsl(var(--status-inactive-badge-background-light))',
          'inactive-badge-fg-light': 'hsl(var(--status-inactive-badge-foreground-light))',
          'inactive-badge-border-light': 'hsl(var(--status-inactive-badge-border-light))',
          'inactive-badge-bg-dark': 'rgba(var(--status-inactive-badge-background-dark-rgba))',
          'inactive-badge-fg-dark': 'hsl(var(--status-inactive-badge-foreground-dark))',
          'inactive-badge-border-dark': 'rgba(var(--status-inactive-badge-border-dark-rgba))',
          'progress-low-fg': 'hsl(var(--status-progress-low-foreground))',
          'progress-low-bg': 'rgba(var(--status-progress-low-background-rgba))',
          'progress-medium-fg': 'hsl(var(--status-progress-medium-foreground))',
          'progress-medium-bg': 'rgba(var(--status-progress-medium-background-rgba))',
          'progress-high-fg': 'hsl(var(--status-progress-high-foreground))',
          'progress-high-bg': 'rgba(var(--status-progress-high-background-rgba))',
          'progress-empty-fg': 'hsl(var(--status-progress-empty-foreground))',
          'progress-empty-bg': 'rgba(var(--status-progress-empty-background-rgba))',
          'transaction-positive-fg-light': 'hsl(var(--transaction-positive-foreground-light))',
          'transaction-positive-fg-dark': 'hsl(var(--transaction-positive-foreground-dark))',
          'transaction-negative-fg-light': 'hsl(var(--transaction-negative-foreground-light))',
          'transaction-negative-fg-dark': 'hsl(var(--transaction-negative-foreground-dark))',
        },
        'header-bg': 'rgba(10,10,10,0.7)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',      // 0.25rem
        DEFAULT: 'var(--radius)',    // 0.5rem (for the `rounded` class)
        md: 'var(--radius)',         // 0.5rem (explicitly `rounded-md`)
        lg: 'var(--radius-lg)',      // 0.75rem
        full: 'var(--radius-full)',  // 9999px
      },
      fontFamily: typographyTokens.fontFamily,
      fontSize: typographyTokens.fontSize,
      fontWeight: typographyTokens.fontWeight,
      lineHeight: typographyTokens.lineHeight,
      letterSpacing: typographyTokens.letterSpacing,
      transitionDuration: animationTokens.duration,
      transitionTimingFunction: animationTokens.easing,
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
