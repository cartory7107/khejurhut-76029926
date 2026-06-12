import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Package, Heart, User } from "lucide-react";

export const Route = createFileRoute("/account")({ component: AccountLayout });

function AccountLayout() {
  const { user, loading, signOut, isAdmin } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav({ to: "/auth", search: { redirect: "/account" } }); }, [user, loading, nav]);
  if (!user) return null;
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 grid gap-8 md:grid-cols-[240px_1fr]">
      <aside className="glass rounded-2xl p-4 h-fit space-y-1">
        <div className="px-3 py-2 mb-2">
          <div className="text-xs text-muted-foreground">Signed in as</div>
          <div className="text-sm truncate">{user.email}</div>
        </div>
        <Link to="/account" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm"><User className="h-4 w-4" /> Profile</Link>
        <Link to="/account/orders" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm"><Package className="h-4 w-4" /> Orders</Link>
        <Link to="/account/wishlist" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm"><Heart className="h-4 w-4" /> Wishlist</Link>
        {isAdmin && <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm text-gold">Admin Panel</Link>}
        <button onClick={() => { signOut(); nav({ to: "/" }); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm text-destructive"><LogOut className="h-4 w-4" /> Sign out</button>
      </aside>
      <div><Outlet /></div>
    </section>
  );
}
