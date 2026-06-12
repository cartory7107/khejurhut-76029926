import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Shield, ShieldCheck, User as UserIcon, Check, X } from "lucide-react";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

const ALL_PERMISSIONS = [
  { key: "products.manage", label: "Products" },
  { key: "orders.manage", label: "Orders" },
  { key: "categories.manage", label: "Categories" },
  { key: "coupons.manage", label: "Coupons" },
  { key: "analytics.view", label: "Analytics" },
  { key: "users.manage", label: "Users & Roles" },
];

const ROLES = ["customer", "staff", "admin", "super_admin"] as const;

function AdminUsers() {
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();

  const { data: profiles } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: ps }, { data: rs }, { data: ups }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, phone"),
        supabase.from("user_roles").select("user_id, role, id"),
        supabase.from("user_permissions").select("user_id, permission, granted, id"),
      ]);
      return (ps || []).map((p: any) => ({
        ...p,
        roles: (rs || []).filter((r: any) => r.user_id === p.id),
        overrides: (ups || []).filter((u: any) => u.user_id === p.id),
      }));
    },
  });

  if (!isSuperAdmin) {
    return (
      <div className="glass rounded-2xl p-8 text-center space-y-2">
        <Shield className="h-8 w-8 mx-auto text-gold" />
        <h2 className="font-display text-xl">Super admin only</h2>
        <p className="text-sm text-muted-foreground">Only super admins can manage users and permissions.</p>
        <Link to="/admin" className="text-sm text-gold">← Back</Link>
      </div>
    );
  }

  const setRole = async (userId: string, role: string) => {
    // remove existing roles, set the chosen one
    await supabase.from("user_roles").delete().eq("user_id", userId);
    if (role) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
      if (error) return toast.error(error.message);
    }
    toast.success("Role updated");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const togglePerm = async (userId: string, permission: string, current: boolean | null) => {
    // current: null = default (use role), true = explicitly granted, false = explicitly revoked
    // cycle: null -> true -> false -> null
    await supabase.from("user_permissions").delete().eq("user_id", userId).eq("permission", permission);
    let next: boolean | null = null;
    if (current === null) next = true;
    else if (current === true) next = false;
    else next = null;
    if (next !== null) {
      const { error } = await supabase.from("user_permissions").insert({ user_id: userId, permission, granted: next });
      if (error) return toast.error(error.message);
    }
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const grantAll = async (userId: string) => {
    await supabase.from("user_permissions").delete().eq("user_id", userId);
    const rows = ALL_PERMISSIONS.map(p => ({ user_id: userId, permission: p.key, granted: true }));
    const { error } = await supabase.from("user_permissions").insert(rows);
    if (error) return toast.error(error.message);
    toast.success("All permissions granted");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-3xl">Users & Roles</h1>
          <p className="text-sm text-muted-foreground">Assign roles and fine-tune permissions. Click a permission cell to cycle: <span className="text-muted-foreground">default</span> → <span className="text-gold">granted</span> → <span className="text-destructive">revoked</span>.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 text-xs text-muted-foreground">
        💡 To add a new admin or staff member: ask them to sign up at <Link to="/auth" className="text-gold">/auth</Link>, then change their role here.
      </div>

      <div className="glass rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="text-left text-xs text-muted-foreground border-b border-border/60">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Role</th>
              {ALL_PERMISSIONS.map(p => <th key={p.key} className="p-3 text-center">{p.label}</th>)}
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map((u: any) => {
              const role = u.roles[0]?.role || "customer";
              return (
                <tr key={u.id} className="border-b border-border/30 align-top">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {role === "super_admin" ? <ShieldCheck className="h-4 w-4 text-gold" /> : <UserIcon className="h-4 w-4 text-muted-foreground" />}
                      <div>
                        <div>{u.full_name || u.username || "—"}</div>
                        <div className="text-xs text-muted-foreground">{u.username ? "@" + u.username : u.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <select value={role} onChange={e => setRole(u.id, e.target.value)} className="rounded-lg bg-input border border-border px-2 py-1 text-xs">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  {ALL_PERMISSIONS.map(p => {
                    const ov = u.overrides.find((o: any) => o.permission === p.key);
                    const state: boolean | null = ov ? ov.granted : null;
                    return (
                      <td key={p.key} className="p-3 text-center">
                        <button
                          onClick={() => togglePerm(u.id, p.key, state)}
                          className={`h-6 w-6 rounded-md inline-grid place-items-center border ${
                            state === true ? "bg-gold/20 border-gold text-gold" :
                            state === false ? "bg-destructive/20 border-destructive text-destructive" :
                            "border-border/60 text-muted-foreground hover:border-gold"
                          }`}
                          title={state === true ? "Granted (override)" : state === false ? "Revoked" : "Default (from role)"}
                        >
                          {state === true ? <Check className="h-3 w-3" /> : state === false ? <X className="h-3 w-3" /> : "·"}
                        </button>
                      </td>
                    );
                  })}
                  <td className="p-3">
                    <button onClick={() => grantAll(u.id)} className="text-xs rounded-full bg-gradient-gold px-3 py-1 text-primary-foreground whitespace-nowrap">Grant all</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
