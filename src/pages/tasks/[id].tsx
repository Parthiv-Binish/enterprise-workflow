import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function TaskDetailPage() {
  const { id } = useParams();

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Task detail</CardTitle>
        <CardDescription>
          Viewing task <code className="text-foreground">{id}</code>. Replace
          this page with a loader that fetches from `tasksService`.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" asChild>
          <Link to="/tasks">Back</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
