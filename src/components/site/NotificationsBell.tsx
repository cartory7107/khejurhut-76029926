import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Package, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { bdt } from "@/lib/format";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const { data: orders } = useQuery({
    queryKey: ["notif-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,order_number,total,status,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const activeCount = (orders || []).filter((o: any) => ["pending", "confirmed", "shipped"].includes(o.status)).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative text-muted-foreground hover:text-gold transition"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 grid place-items-center h-4 min-w-4 px-1 rounded-full bg-gradient-gold text-[9px] font-bold text-primary-foreground shadow-gold">
            {activeCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-3 w-80 glass-strong rounded-2xl border border-border/60 p-3 shadow-elegant animate-scale-in z-50">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-border/40">
            <h4 className="font-display text-lg text-gradient-gold">Notifications</h4>
            <Sparkles className="h-4 w-4 text-gold" />
          </div>
          {!user && (
            <Link to="/auth" onClick={() => setOpen(false)} className="block text-center text-sm py-4 text-gold hover:underline">
              Sign in to see updates
            </Link>
          )}
          {user && (orders?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No orders yet — start shopping to see updates here.</p>
          )}
          {user && (orders?.length ?? 0) > 0 && (
            <ul className="py-1 max-h-80 overflow-auto">
              {orders!.map((o: any) => (
                <li key={o.id}>
                  <Link
                    to="/account/orders"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-foreground/5 transition"
                  >
                    <div className="grid place-items-center h-9 w-9 rounded-full bg-gold/10 border border-gold/30 text-gold">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{o.order_number || `#${o.id.slice(0, 8)}`}</div>
                      <div className="text-xs text-muted-foreground">Status: <span className="text-gold capitalize">{o.status}</span></div>
                    </div>
                    <div className="text-xs text-gold">{bdt(Number(o.total))}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}