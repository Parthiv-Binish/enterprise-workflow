import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CheckSquare className="h-5 w-5" />
          </div>
          WorkFlow
        </Link>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link to="/auth/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth/register">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl space-y-6"
        >
          <p className="text-sm font-medium text-primary uppercase tracking-wide">
            Enterprise Workflow
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Plan work, collaborate, and ship with confidence
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">
            A streamlined task workspace with dashboards, queues, teams, and
            reporting—all wired to Supabase-ready services.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <Link to="/auth/register">
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/features">Explore features</Link>
            </Button>
          </div>
        </motion.div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <Link to="/pricing" className="hover:underline">
          Pricing
        </Link>
        <span className="mx-3">·</span>
        <Link to="/auth/login" className="hover:underline">
          Already have an account?
        </Link>
      </footer>
    </div>
  );
}
