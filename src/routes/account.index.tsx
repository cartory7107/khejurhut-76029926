import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/account/")({ component: Profile });

function Profile() {
  const { user } = useAuth();
  return (
    <div className="glass rounded-2xl p-6 space-y-3">
      <h1 className="font-display text-3xl">Profile</h1>
      <div className="text-sm text-muted-foreground">Email: {user?.email}</div>
      <div className="text-sm text-muted-foreground">User ID: {user?.id}</div>
    </div>
  );
}
