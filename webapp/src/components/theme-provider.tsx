import { createContext, useContext, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({ children, storageKey = 'ui-theme', ...props }: ThemeProviderProps) {
  // Применяем только тёмную тему
  useEffect(() => {
    const root = window.document.documentElement;

    // Удаляем все классы тем
    root.classList.remove('light', 'dark');
    // Всегда добавляем только тёмную тему
    root.classList.add('dark');
  }, []);

  // Сохраняем в localStorage только тёмную тему
  useEffect(() => {
    localStorage.setItem(storageKey, 'dark');
  }, [storageKey]);

  const value = {
    theme: 'dark' as Theme, // Всегда возвращаем dark
    setTheme: () => {
      // Игнорируем попытки изменить тему - всегда остаёмся на тёмной
      console.log('Theme switching is disabled. Only dark theme is available.');
    },
  };

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
