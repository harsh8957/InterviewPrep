import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('ip-theme') as Theme | null;
    return saved || 'system';
  });

  const getSystemTheme = (): 'light' | 'dark' =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ip-theme');
    if (saved === 'dark') return 'dark';
    if (saved === 'light') return 'light';
    return getSystemTheme();
  });

  const applyTheme = (resolved: 'light' | 'dark') => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    setResolvedTheme(resolved);
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('ip-theme', t);
    const resolved = t === 'system' ? getSystemTheme() : t;
    applyTheme(resolved);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    applyTheme(resolved);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
