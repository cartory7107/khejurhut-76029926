import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, User2, Menu, X, Heart, MessageCircle, Home, Store, PackageSearch, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { NotificationsBell } from "./NotificationsBell";

export function Header() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { lang, setLang, t } = useI18n();
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const nav = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    nav({ to: "/products", search: { q } });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gold/10 bg-background/80 backdrop-blur-2xl">
      <div className="premium-nav-bg" aria-hidden="true" />
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-4">
        <button className="grid h-10 w-10 place-items-center rounded-full glass md:hidden" onClick={() => setOpen(v => !v)} aria-label="Menu" aria-expanded={open}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Logo />
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground ml-6">
          <Link to="/" className="hover:text-gold transition-colors">{t("home")}</Link>
          <Link to="/products" className="hover:text-gold transition-colors">{t("shop")}</Link>
          <Link to="/categories" className="hover:text-gold transition-colors">{t("categories")}</Link>
          <Link to="/tracking" className="hover:text-gold transition-colors">Track order</Link>
          <Link to="/returns" className="hover:text-gold transition-colors">Returns</Link>
          {isAdmin && <Link to="/admin" className="text-gold">{t("admin")}</Link>}
        </nav>
        <form onSubmit={submit} className="ml-auto hidden md:flex relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")}
            className="w-full rounded-full bg-input/60 border border-border pl-9 pr-4 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition" />
        </form>
        <button onClick={() => setLang(lang === "EN" ? "BN" : "EN")}
          className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-gold hover:border-gold/50 transition" aria-label="Language">
          {lang === "EN" ? "EN / বাং" : "বাং / EN"}
        </button>
        <NotificationsBell />
        <a href="https://wa.me/8801700000000?text=Hello%20AMANA%20ENTERPRISE%2C%20I%20need%20help" target="_blank" rel="noreferrer"
          className="hidden sm:inline-flex text-muted-foreground hover:text-gold transition" aria-label="Contact support" title="Chat with support">
          <MessageCircle className="h-5 w-5" />
        </a>
        <Link to="/account/wishlist" className="hidden sm:block text-muted-foreground hover:text-gold transition" aria-label="Wishlist"><Heart className="h-5 w-5" /></Link>
        <Link to={user ? "/account" : "/auth"} className="hidden sm:inline-flex text-muted-foreground hover:text-gold transition" aria-label="Account"><User2 className="h-5 w-5" /></Link>
        <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full text-foreground hover:text-gold transition" aria-label="Cart">
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && <span className="absolute -top-1 -right-1 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-gradient-gold text-[10px] font-bold text-primary-foreground shadow-gold">{count}</span>}
        </Link>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/40 bg-background/95 px-4 py-4 shadow-elegant">
          <form onSubmit={submit} className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dates, honey, gifts..." className="w-full rounded-full bg-input border border-border pl-9 pr-4 py-3 text-sm outline-none focus:border-gold" />
          </form>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { to: "/", label: "Home", icon: Home },
              { to: "/products", label: "Shop", icon: Store },
              { to: "/tracking", label: "Track", icon: PackageSearch },
              { to: "/returns", label: "Returns", icon: ShieldCheck },
              { to: "/account/orders", label: "Orders", icon: ShoppingBag },
              { to: user ? "/account" : "/auth", label: user ? "Account" : "Sign in", icon: User2 },
            ].map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to as any} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl glass p-3 text-muted-foreground hover:text-gold">
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
            {isAdmin && <Link to="/admin" className="col-span-2 rounded-2xl glass p-3 text-gold" onClick={() => setOpen(false)}>Admin</Link>}
          </div>
        </div>
      )}
    </header>
  );
}
