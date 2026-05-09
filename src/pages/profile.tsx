export default function ProfilePage() {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold">Profile</h1>
      <p className="text-muted-foreground">
        Edit profile fields through `useAuth().updateProfile` when you add the
        form.
      </p>
    </div>
  );
}
