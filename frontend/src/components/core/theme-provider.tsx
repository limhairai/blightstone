"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
// Removed incorrect import: import type { ThemeProviderProps as NextThemesProviderProps } from "next-themes"
import { useEffect, type ReactNode } from "react"
import designTokens from "../../lib/design-tokens" // Import the default export

// Define ThemeProviderProps locally using React.ComponentProps
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)
  const { theme, resolvedTheme, systemTheme } = useTheme() // Use the hook from next-themes

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement
    
    let themeToApply: string | undefined = theme; // Use theme from useTheme()
    if (theme === "system") {
      themeToApply = resolvedTheme;
    }
    if (!themeToApply) {
      // Fallback if themeToApply is somehow undefined (e.g. initial system theme resolving)
      // props.defaultTheme is a valid prop for NextThemesProvider
      themeToApply = props.defaultTheme === 'system' 
        ? (systemTheme || 'light') // Use systemTheme if default is system, else light
        : (props.defaultTheme || 'light'); // Use defaultTheme if set, else light
    }

    // Clear existing theme styles (safer to just remove specific variables)
    // This part might need to be more targeted if other styles are on root
    if (root.style.length > 0) { // Basic check before clearing all
        const stylesToRemove = [];
        for (let i = 0; i < root.style.length; i++) {
            const name = root.style[i];
            if (name.startsWith('--')) { // Only remove CSS variables we set
                stylesToRemove.push(name);
            }
        }
        stylesToRemove.forEach(name => root.style.removeProperty(name));
    }

    const currentTokens = designTokens[themeToApply as keyof typeof designTokens]
    if (currentTokens) {
      Object.keys(currentTokens).forEach(tokenCategory => {
        const category = currentTokens[tokenCategory as keyof typeof currentTokens];
        Object.keys(category).forEach(tokenName => {
          root.style.setProperty(`--${tokenName}`, category[tokenName as keyof typeof category]);
        })
      })
    }
  // props.defaultTheme and props.enableSystem influence how next-themes works
  // theme and resolvedTheme are the actual theme values
  }, [mounted, theme, resolvedTheme, systemTheme, props.defaultTheme, props.enableSystem])

  if (!mounted) {
    // To prevent hydration mismatch, children can be rendered, 
    // but theme-dependent UI should wait for mounted.
    // The NextThemesProvider itself handles the initial flash prevention via its script.
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
