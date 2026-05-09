import { useEffect, type ReactNode } from 'react';
import { useUIStore } from '@/store/ui.store';

type Props = {
  children: ReactNode;
  /** Kept for compatibility with `App` — theme is controlled by `workflow-ui` storage. */
  defaultTheme?: string;
  storageKey?: string;
};

export function ThemeProvider({ children }: Props) {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return children;
}
