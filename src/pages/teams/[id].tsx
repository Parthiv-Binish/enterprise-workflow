import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useTeam,
  useUpdateTeam,
  useDeleteTeam,
  useRemoveTeamMember,
  useAddTeamMember,
} from '@/hooks/use-teams';
import { useProfilesList } from '@/hooks/use-profiles';

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const teamId = id ?? '';
  const { data: team, isLoading, error } = useTeam(teamId);
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const removeMember = useRemoveTeamMember();
  const addMember = useAddTeamMember();
  const profiles = useProfilesList();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('#6366f1');

  const [addOpen, setAddOpen] = useState(false);
  const [newUserId, setNewUserId] = useState(''); // fallback/manual
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newRole, setNewRole] = useState('member');

  const openEdit = () => {
    if (!team) return;
    setEditName(team.name);
    setEditDesc(team.description ?? '');
    setEditColor(team.color || '#6366f1');
    setEditOpen(true);
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeam.mutate(
      {
        teamId,
        input: {
          name: editName.trim(),
          description: editDesc.trim() || undefined,
          color: editColor,
        },
      },
      { onSuccess: () => setEditOpen(false) }
    );
  };

  const handleDelete = () => {
    if (
      !confirm(
        'Deactivate this team? Members remain in auth but team becomes inactive.'
      )
    )
      return;
    deleteTeam.mutate(teamId, {
      onSuccess: () => navigate('/teams'),
    });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = selectedUserId || newUserId.trim();
    if (!userId) return;
    addMember.mutate(
      { teamId, userId, role: newRole },
      {
        onSuccess: () => {
          setAddOpen(false);
          setNewUserId('');
          setSelectedUserId('');
          setNewRole('member');
        },
      }
    );
  };

  if (!teamId) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground">Missing team id.</p>
          <Button variant="link" asChild className="px-0">
            <Link to="/teams">Back to teams</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Team not found</CardTitle>
          <CardDescription>
            {(error as Error)?.message ?? 'This team may have been removed.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/teams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All teams
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/teams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Teams
          </Link>
        </Button>
        <div
          className="h-10 w-2 rounded-full"
          style={{ backgroundColor: team.color || '#6366f1' }}
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-muted-foreground">
            {team.description || 'No description'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Deactivate
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Use a user UUID from Profiles (Supabase dashboard → Authentication /
              Table Editor).
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            Add member
          </Button>
        </CardHeader>
        <CardContent>
          {!team.members?.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No members yet — invite colleagues by user id.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={m.user?.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {(m.user?.full_name ?? '?')
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {m.user?.full_name ?? 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.user?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{m.role}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove member"
                        onClick={() =>
                          removeMember.mutate({
                            teamId,
                            userId: m.user_id,
                          })
                        }
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleSaveTeam}>
            <DialogHeader>
              <DialogTitle>Edit team</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea
                  id="edit-desc"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Accent colour</Label>
                <Input
                  id="edit-color"
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="h-10 w-24 cursor-pointer"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateTeam.isPending}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <form onSubmit={handleAddMember}>
            <DialogHeader>
              <DialogTitle>Add member</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>User</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={(v) => {
                    setSelectedUserId(v);
                    setNewUserId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        profiles.isLoading
                          ? 'Loading users…'
                          : profiles.error
                            ? 'Unable to load users (use UUID below)'
                            : 'Select a user'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(profiles.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name} — {p.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {profiles.error ? (
                  <p className="text-xs text-muted-foreground">
                    {(profiles.error as Error).message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="uid">
                  Or paste User UUID <span className="text-muted-foreground">(fallback)</span>
                </Label>
                <Input
                  id="uid"
                  value={newUserId}
                  onChange={(e) => {
                    setNewUserId(e.target.value);
                    if (e.target.value.trim()) setSelectedUserId('');
                  }}
                  placeholder="auth.users id / profiles.id"
                  disabled={!!selectedUserId}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  addMember.isPending ||
                  (!selectedUserId && !newUserId.trim())
                }
              >
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
