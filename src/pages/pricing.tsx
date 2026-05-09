import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PricingPage() {
  const tiers = [
    {
      name: 'Starter',
      price: '$0',
      desc: 'For small teams validating workflows.',
    },
    {
      name: 'Business',
      price: '$49',
      desc: 'Full collaboration, SLA views, approvals.',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      desc: 'VPC, SSO, audit export, bespoke SLAs.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-16">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Pricing</h1>
        <p className="text-muted-foreground">
          Simple tiers you can bolt onto your Supabase backend.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <Card key={tier.name}>
            <CardHeader>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>{tier.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{tier.price}</p>
              {tier.price !== 'Custom' ? (
                <p className="text-sm text-muted-foreground">per seat / month</p>
              ) : null}
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link to="/auth/register">Talk to sales</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="text-center">
        <Button variant="ghost" asChild>
          <Link to="/">&larr; Back home</Link>
        </Button>
      </div>
    </div>
  );
}
