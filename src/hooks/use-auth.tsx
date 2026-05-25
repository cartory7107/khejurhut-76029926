import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
  hasPermission: (p: string) => boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null, session: null, loading: true, isAdmin: false, isSuperAdmin: false,
  roles: [], permissions: [], hasPermission: () => false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
      if (s?.user) {
        setTimeout(async () => {
          await loadPerms(s.user.id);
        }, 0);
      } else {
        setRoles([]);
        setPermissions([]);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) loadPerms(data.session.user.id);
    });
    return () => subscription.unsubscribe();

    async function loadPerms(uid: string) {
      const [{ data: rolesData }, { data: rolePerms }, { data: userPerms }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("role_permissions").select("role, permission"),
        supabase.from("user_permissions").select("permission, granted").eq("user_id", uid),
      ]);
      const myRoles = (rolesData || []).map((r) => r.role as string);
      setRoles(myRoles);
      const perms = new Set<string>();
      (rolePerms || []).forEach((rp: any) => {
        if (myRoles.includes(rp.role)) perms.add(rp.permission);
      });
      (userPerms || []).forEach((up: any) => {
        if (up.granted) perms.add(up.permission);
        else perms.delete(up.permission);
      });
      setPermissions(Array.from(perms));
    }
  }, []);

  const isSuperAdmin = roles.includes("super_admin");
  const isAdmin = isSuperAdmin || roles.includes("admin") || roles.includes("staff");

  return (
    <Ctx.Provider value={{
      user: session?.user ?? null,
      session, loading, isAdmin, isSuperAdmin, roles, permissions,
      hasPermission: (p) => isSuperAdmin || permissions.includes(p),
      signOut: async () => { await supabase.auth.signOut(); },
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
