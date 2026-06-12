import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { bdt } from "@/lib/format";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [orders, products] = await Promise.all([
        supabase.from("orders").select("total, status"),
        supabase.from("products").select("id, stock"),
      ]);
      const ords = orders.data || [];
      return {
        revenue: ords.reduce((s, o: any) => s + Number(o.total), 0),
        orderCount: ords.length,
        productCount: products.data?.length || 0,
        lowStock: products.data?.filter((p: any) => p.stock < 10).length || 0,
      };
    },
  });
  const stats = [
    { label: "Revenue", value: data ? bdt(data.revenue) : "—" },
    { label: "Orders", value: data?.orderCount ?? "—" },
    { label: "Products", value: data?.productCount ?? "—" },
    { label: "Low stock", value: data?.lowStock ?? "—" },
  ];
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
            <div className="text-3xl font-display text-gradient-gold mt-2">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
