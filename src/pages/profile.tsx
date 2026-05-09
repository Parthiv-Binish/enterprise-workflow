import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Please enter your name'),
  job_title: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().min(1),
  avatar_url: z
    .string()
    .optional()
    .refine(
      (s) => !s?.trim() || /^https?:\/\/.+/i.test(s.trim()),
      'Enter a valid http(s) URL or leave blank'
    ),
});

type ProfileForm = z.infer<typeof profileSchema>;

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
];

export default function ProfilePage() {
  const { profile, isLoading, updateProfile } = useAuth();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      job_title: '',
      phone: '',
      timezone: 'UTC',
      avatar_url: '',
    },
  });

  // Reset form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name,
        job_title: profile.job_title ?? '',
        phone: profile.phone ?? '',
        timezone: profile.timezone || 'UTC',
        avatar_url: profile.avatar_url ?? '',
      });
    }
  }, [profile, form]);

  const onSubmit = (data: ProfileForm) => {
    updateProfile.mutate({
      full_name: data.full_name,
      job_title: data.job_title?.trim() || null,
      phone: data.phone?.trim() || null,
      timezone: data.timezone,
      avatar_url: data.avatar_url?.trim() || null,
    });
  };

  if (isLoading && !profile) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <p className="text-muted-foreground">
        Sign in to manage your profile.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Updates sync to <code className="text-xs">profiles</code> via Supabase RLS.
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {profile.role.replace('_', ' ')}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
          <CardDescription>
            Email <span className="font-medium text-foreground">{profile.email}</span> is managed
            through authentication — change it in Supabase Auth if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...form.register('full_name')} />
              {form.formState.errors.full_name ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.full_name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job title</Label>
              <Input id="job_title" {...form.register('job_title')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register('phone')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={form.watch('timezone')}
                onValueChange={(v) => form.setValue('timezone', v)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input id="avatar_url" {...form.register('avatar_url')} placeholder="https://…" />
              {form.formState.errors.avatar_url ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.avatar_url.message}
                </p>
              ) : null}
            </div>

            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
