import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300 outline-none
        dark-mode:text-zinc-400 dark-mode:hover:text-white dark-mode:hover:bg-white/5
        light-mode:text-slate-600 light-mode:hover:text-slate-900 light-mode:hover:bg-slate-900/5"
      title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 transition-transform duration-300 hover:rotate-180" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-300 hover:rotate-180" />
      )}
    </button>
  );
};

export default ThemeToggle;
