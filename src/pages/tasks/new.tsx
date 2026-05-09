import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NewTaskPage() {
  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>New task</CardTitle>
        <CardDescription>
          Task creation form is not wired yet — connect it to your Supabase
          mutations when you are ready.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button variant="outline" asChild>
          <Link to="/tasks">Back to tasks</Link>
        </Button>
        <Button asChild>
          <Link to="/dashboard">Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
