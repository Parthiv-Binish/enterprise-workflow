import { useEffect } from 'react';
import {
  Calculator,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  Settings,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Command as CommandPrimitive } from 'cmdk';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

export function CommandMenu() {
  const open = useUIStore((s) => s.commandMenuOpen);
  const setOpen = useUIStore((s) => s.setCommandMenuOpen);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, setOpen]);

  const runCommand = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl sm:max-w-lg">
        <DialogTitle className="sr-only">Command menu</DialogTitle>
        <CommandPrimitive className={cn('[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground')}>
          <div className="border-b px-3 py-3">
            <CommandPrimitive.Input
              placeholder="Type a command or search…"
              className="flex h-10 w-full rounded-md border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <CommandPrimitive.List className="max-h-72 overflow-y-auto p-2">
            <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
              No matches.
            </CommandPrimitive.Empty>
            <CommandPrimitive.Group heading="Navigation">
              <CommandPrimitive.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
                value="dashboard"
                onSelect={() => runCommand('/dashboard')}
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden /> Dashboard
              </CommandPrimitive.Item>
              <CommandPrimitive.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
                value="tasks"
                onSelect={() => runCommand('/tasks')}
              >
                <CheckSquare className="h-4 w-4" aria-hidden /> Tasks
              </CommandPrimitive.Item>
              <CommandPrimitive.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
                value="calendar"
                onSelect={() => runCommand('/calendar')}
              >
                <Calendar className="h-4 w-4" aria-hidden /> Calendar
              </CommandPrimitive.Item>
            </CommandPrimitive.Group>
            <CommandPrimitive.Group heading="Account">
              <CommandPrimitive.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
                value="profile"
                onSelect={() => runCommand('/profile')}
              >
                <User className="h-4 w-4" aria-hidden /> Profile
              </CommandPrimitive.Item>
              <CommandPrimitive.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
                value="settings"
                onSelect={() => runCommand('/settings')}
              >
                <Settings className="h-4 w-4" aria-hidden /> Settings
              </CommandPrimitive.Item>
            </CommandPrimitive.Group>
            <CommandPrimitive.Separator className="-mx-1 my-2 h-px bg-border" />
            <CommandPrimitive.Item
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
              value="nothing"
              onSelect={() => setOpen(false)}
            >
              <Calculator className="h-4 w-4 opacity-50" aria-hidden /> Close menu
              <span className="ml-auto text-xs text-muted-foreground">Esc</span>
            </CommandPrimitive.Item>
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
