import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ConfigProvider, App as AntdApp, theme as antdTheme } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import type { ThemeConfig } from 'antd';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const savedTheme = window.localStorage.getItem('theme');
    return (savedTheme as Theme) || 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', newTheme);
    }
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    // Aplicar tema ao body
    document.body.setAttribute('data-theme', currentTheme);

    // Aplicar classes CSS
    if (currentTheme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [currentTheme]);

  const themeConfig = useMemo<ThemeConfig>(() => {
    const { defaultAlgorithm, darkAlgorithm } = antdTheme;

    return {
      algorithm: currentTheme === 'dark' ? darkAlgorithm : defaultAlgorithm,
      token: {
        colorPrimary: '#722ED1',
        colorInfo: '#722ED1',
        borderRadius: 8,
        colorBgContainer: currentTheme === 'dark' ? '#141414' : '#ffffff',
        colorBgElevated: currentTheme === 'dark' ? '#1f1f1f' : '#ffffff',
      },
    };
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, toggleTheme, setTheme }}>
      <ConfigProvider
        locale={ptBR}
        theme={themeConfig}
        componentSize="middle"
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
