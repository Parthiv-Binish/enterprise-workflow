import { Link } from 'react-router-dom';
import { LayoutList, Moon, PanelLeft, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useUIStore, type TaskViewMode } from '@/store/ui.store';

export default function SettingsPage() {
  const { theme, setTheme, taskView, setTaskView } = useUIStore();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Workspace appearance and defaults stored locally on this device.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sun className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Theme applies immediately across the app shell.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                type="button"
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            You can also toggle quickly from the header. Preference persists under{' '}
            <code className="rounded bg-muted px-1">workflow-ui</code> in local storage.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayoutList className="h-5 w-5" />
            Tasks
          </CardTitle>
          <CardDescription>
            Default view for task boards (used where the tasks page reads this store).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="task-view">Default task view</Label>
          <Select
            value={taskView}
            onValueChange={(v) => setTaskView(v as TaskViewMode)}
          >
            <SelectTrigger id="task-view" className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">Table</SelectItem>
              <SelectItem value="kanban">Kanban</SelectItem>
              <SelectItem value="calendar">Calendar</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PanelLeft className="h-5 w-5" />
            Sidebar
          </CardTitle>
          <CardDescription>
            Collapse state is remembered automatically when you use the chevron on the rail.
          </CardDescription>
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground">
          Open the main sidebar and use the collapse control at the top.
        </CardFooter>
      </Card>

      <Separator />

      <p className="text-sm text-muted-foreground">
        Profile details (name, phone, timezone) live on{' '}
        <Button variant="link" className="h-auto p-0" asChild>
          <Link to="/profile">your profile page</Link>
        </Button>
        .
      </p>
    </div>
  );
}
