import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingBag, Package, User2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

const items = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/categories", icon: LayoutGrid, label: "Categories" },
  { to: "/cart", icon: ShoppingBag, label: "Cart" },
  { to: "/account/orders", icon: Package, label: "Orders" },
  { to: "/account", icon: User2, label: "Account" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-border/60">
      <ul className="grid grid-cols-5">
        {items.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <li key={to}>
              <Link to={to} className="flex flex-col items-center gap-1 py-2.5 text-[10px] relative">
                <Icon className={`h-5 w-5 transition ${active ? "text-gold" : "text-muted-foreground"}`} />
                <span className={active ? "text-gold" : "text-muted-foreground"}>{label}</span>
                {to === "/cart" && count > 0 && (
                  <span className="absolute top-1 right-[28%] min-w-4 h-4 px-1 grid place-items-center rounded-full bg-gradient-gold text-[9px] font-bold text-primary-foreground">{count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
