import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Full viewport overlay */
  fullScreen?: boolean;
};

export function LoadingSpinner({ className, fullScreen }: Props) {
  const spinner = (
    <div
      role="status"
      className={cn('flex justify-center py-24', fullScreen && 'min-h-[50vh]', className)}
      aria-live="polite"
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
      <span className="sr-only">Loading</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return spinner;
}
