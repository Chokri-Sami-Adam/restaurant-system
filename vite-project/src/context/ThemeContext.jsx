import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check localStorage for saved theme preference
    try {
      const saved = localStorage.getItem('theme_preference');
      return saved || 'dark'; // Default to dark mode
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    if (theme === 'light') {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    } else {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
    }

    // Save preference to localStorage
    try {
      localStorage.setItem('theme_preference', theme);
    } catch (err) {
      console.log('Failed to save theme preference:', err);
    }

    // Dispatch event so other components can react to theme change
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
