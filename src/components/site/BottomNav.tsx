import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ShoppingBag, Store } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

const items = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/products", icon: Store, label: "Shop" },
  { to: "/products", search: { q: "" }, icon: Search, label: "Search" },
  { to: "/cart", icon: ShoppingBag, label: "Cart" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();
  return (
    <nav className="md:hidden fixed bottom-3 inset-x-3 z-40 rounded-[1.75rem] border border-gold/20 bg-card/88 shadow-elegant backdrop-blur-2xl">
      <ul className="grid grid-cols-4 p-1.5">
        {items.map(({ to, icon: Icon, label, ...rest }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <li key={label}>
              <Link to={to} {...rest} className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] transition ${active ? "bg-gold/10 text-gold" : "text-muted-foreground"}`}>
                <Icon className="h-5 w-5" />
                <span>{label}</span>
                {to === "/cart" && count > 0 && <span className="absolute top-1 right-[28%] min-w-4 h-4 px-1 grid place-items-center rounded-full bg-gradient-gold text-[9px] font-bold text-primary-foreground">{count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
