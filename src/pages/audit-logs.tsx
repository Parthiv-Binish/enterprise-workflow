import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth.store';
import { useAuditLogs } from '@/hooks/use-audit-logs';

export default function AuditLogsPage() {
  const profile = useAuthStore((s) => s.profile);
  const isAdmin =
    profile?.role === 'admin' || profile?.role === 'super_admin';

  const { data, isLoading, error } = useAuditLogs(150);

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit logs</CardTitle>
          <CardDescription>
            Restricted to administrators. Your account does not have access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit logs</h1>
        <p className="text-muted-foreground">
          Recent rows from <code className="text-xs">audit_logs</code>. Ensure RLS allows admin
          selects and that your backend writes audit rows on sensitive changes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent events</CardTitle>
          <CardDescription>Newest first (latest 150).</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">
              {(error as Error).message}. Create the table and policies in Supabase if this table
              does not exist yet.
            </p>
          ) : !data?.length ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No audit rows returned.
            </p>
          ) : (
            <div className="max-h-[calc(100vh-16rem)] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(row.created_at), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.action}</TableCell>
                      <TableCell>{row.entity_type}</TableCell>
                      <TableCell className="max-w-[140px] truncate font-mono text-xs">
                        {row.entity_id ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate font-mono text-xs">
                        {row.user_id ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
