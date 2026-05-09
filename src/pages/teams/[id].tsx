import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function TeamDetailPage() {
  const { id } = useParams();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Team {id}</h1>
      <p className="text-muted-foreground">
        Placeholder team detail page—wire this to `teamsService` queries.
      </p>
      <Button variant="outline" asChild>
        <Link to="/teams">All teams</Link>
      </Button>
    </div>
  );
}
