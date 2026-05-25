import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Package, ShoppingBag, Tag, ArrowLeft, Ticket, Users } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { user, isAdmin, isSuperAdmin, hasPermission, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) nav({ to: "/auth", search: { redirect: "/admin" } });
  }, [user, loading, nav]);

  if (loading || !user) return <div className="p-12 text-center text-muted-foreground">Loading...</div>;
  if (!isAdmin) return (
    <div className="mx-auto max-w-md p-12 text-center space-y-3">
      <h1 className="font-display text-3xl text-gold">Admin access required</h1>
      <p className="text-sm text-muted-foreground">Your account does not have admin privileges. Ask a project admin to grant you the admin role.</p>
      <Link to="/" className="inline-block text-sm text-gold">← Back to store</Link>
    </div>
  );

  const allLinks: { to: string; label: string; icon: any; perm: string | null; superOnly?: boolean }[] = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, perm: null },
    { to: "/admin/products", label: "Products", icon: Package, perm: "products.manage" },
    { to: "/admin/orders", label: "Orders", icon: ShoppingBag, perm: "orders.manage" },
    { to: "/admin/categories", label: "Categories", icon: Tag, perm: "categories.manage" },
    { to: "/admin/coupons", label: "Coupons", icon: Ticket, perm: "coupons.manage" },
    { to: "/admin/users", label: "Users & Roles", icon: Users, perm: "users.manage", superOnly: true },
  ];
  const links = allLinks.filter(l => {
    if (l.superOnly) return isSuperAdmin;
    if (!l.perm) return true;
    return hasPermission(l.perm);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="glass rounded-2xl p-3 h-fit space-y-1">
        <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-gold"><ArrowLeft className="h-3 w-3" /> Store</Link>
        {links.map(({ to, label, icon: I }) => (
          <Link key={to} to={to as any} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm"><I className="h-4 w-4" /> {label}</Link>
        ))}
      </aside>
      <div><Outlet /></div>
    </div>
  );
}
