import { Link } from 'react-router-dom';
import { Kanban, LineChart, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const feats = [
  {
    icon: Kanban,
    title: 'Boards & tables',
    text: 'Switch between kanban, table, and calendar-friendly views.',
  },
  {
    icon: Shield,
    title: 'Governed approvals',
    text: 'Statuses and review gates align with regulated environments.',
  },
  {
    icon: Users,
    title: 'Team-aware routing',
    text: 'Assign work across teams without losing ownership context.',
  },
  {
    icon: LineChart,
    title: 'Operational insight',
    text: 'Dashboards summarise throughput, SLA risk, and completions.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 space-y-10">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Features</h1>
        <p className="text-muted-foreground">
          Everything you need to orchestrate tasks from intake to closure.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {feats.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <f.icon className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>{f.title}</CardTitle>
              <CardDescription>{f.text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="flex justify-center gap-4">
        <Button asChild>
          <Link to="/auth/register">Create account</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
