// src/components/layout/sidebar.tsx

import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Building2,
  BarChart3,
  Bell,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Notifications', href: '/notifications', icon: Bell },
];

const adminNavigation = [
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { profile } = useAuthStore();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const NavItem = ({
    item,
  }: {
    item: { name: string; href: string; icon: any };
  }) => {
    const isActive = location.pathname.startsWith(item.href);
    const Icon = item.icon;

    const content = (
      <NavLink
        to={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!sidebarCollapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {item.name}
          </motion.span>
        )}
      </NavLink>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.name}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
      animate={{ width: sidebarCollapsed ? 64 : 256 }}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <CheckSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">WorkFlow</span>
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)] px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        {isAdmin && (
          <>
            <div className="my-4 border-t" />
            {!sidebarCollapsed && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                Admin
              </p>
            )}
            <nav className="space-y-1">
              {adminNavigation.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </nav>
          </>
        )}

        <div className="mt-auto pt-4 border-t">
          <NavItem
            item={{ name: 'Settings', href: '/settings', icon: Settings }}
          />
        </div>
      </ScrollArea>
    </motion.aside>
  );
}
