import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeams, useCreateTeam } from '@/hooks/use-teams';
import type { TeamWithRelations } from '@/types/database';

export default function TeamsPage() {
  const { data: teams, isLoading, error } = useTeams();
  const createTeam = useCreateTeam();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createTeam.mutate(
      { name: name.trim(), description: description.trim() || undefined, color },
      {
        onSuccess: () => {
          setOpen(false);
          setName('');
          setDescription('');
          setColor('#6366f1');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">
            Organise people into teams for routing tasks and reporting.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create team</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Name</Label>
                  <Input
                    id="team-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Platform squad"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-desc">Description</Label>
                  <Textarea
                    id="team-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this team own?"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-color">Accent colour</Label>
                  <Input
                    id="team-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-24 cursor-pointer"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createTeam.isPending}>
                  {createTeam.isPending ? 'Creating…' : 'Create team'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>Could not load teams</CardTitle>
            <CardDescription>{(error as Error).message}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      ) : teams?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UsersIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No teams yet</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first team to assign tasks by group.
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams!.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({ team }: { team: TeamWithRelations }) {
  const memberCount = team.members?.length ?? 0;
  return (
    <Card
      className="overflow-hidden border-l-4 transition-shadow hover:shadow-md"
      style={{ borderLeftColor: team.color || '#6366f1' }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{team.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {team.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground">
          {memberCount} member{memberCount === 1 ? '' : 's'}
          {team.manager?.full_name ? (
            <>
              {' · '}
              Manager: <span className="text-foreground">{team.manager.full_name}</span>
            </>
          ) : null}
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link to={`/teams/${team.id}`}>Open team</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
