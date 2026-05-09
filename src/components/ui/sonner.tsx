import type { ComponentProps } from 'react';
import { Toaster as Sonner } from 'sonner';
import { useUIStore } from '@/store/ui.store';

function Toaster({ ...props }: ComponentProps<typeof Sonner>) {
  const theme = useUIStore((s) => s.theme);
  return (
    <Sonner
      theme={theme === 'dark' ? 'dark' : 'light'}
      className="toaster group"
      {...props}
    />
  );
}

export { Toaster };
