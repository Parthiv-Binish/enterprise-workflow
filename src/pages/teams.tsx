import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function TeamsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Teams</h1>
      <p className="text-muted-foreground max-w-prose">
        Team directory and membership management will render here using
        `teamsService` and `useTeams`.
      </p>
      <Button asChild>
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
