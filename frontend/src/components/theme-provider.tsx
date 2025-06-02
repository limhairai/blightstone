"use client"

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import type { ThemeProviderProps as NextThemesProviderProps } from "next-themes" // Renamed to avoid conflict
import { useEffect, type ReactNode } from "react"
import designTokens from "@/lib/design-tokens" // Import the default export

// Interface for our combined ThemeProvider props
interface ThemeProviderProps extends NextThemesProviderProps {
  children?: ReactNode; // Explicitly add children here
}

function applyCssVariables(theme?: string) {
  if (typeof window === "undefined" || !theme) return;

  const variables = designTokens.utils.generateCSSVariables(theme as "light" | "dark");
  Object.entries(variables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  // console.log(`Applied CSS variables for ${theme} theme`);
}

function ThemeEffect() {
  const { theme, resolvedTheme } = useTheme();
  
  useEffect(() => {
    // Use resolvedTheme to handle "system" preference correctly on initial load
    const currentTheme = resolvedTheme || theme;
    if (currentTheme) {
      applyCssVariables(currentTheme as "light" | "dark");
    }
  }, [theme, resolvedTheme]);

  return null; // This component doesn't render anything itself
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeEffect />
      {children}
    </NextThemesProvider>
  )
}
