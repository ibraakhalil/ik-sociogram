"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

export const themes = [
  { id: "light", name: "Light", icon: SunIcon },
  { id: "sepia", name: "Sepia", icon: SunIcon },
  { id: "dark", name: "Dark", icon: MoonIcon },
  { id: "system", name: "System", icon: SunIcon },
];

export const defaultTheme = "system";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      themes={themes.map((theme) => theme.id)}
      defaultTheme={defaultTheme}
      disableTransitionOnChange
      enableColorScheme
      attribute="class"
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
