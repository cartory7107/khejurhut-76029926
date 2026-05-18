import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, Bell, User2, Menu, X, Heart } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [lang, setLang] = useState<"EN" | "BN">("EN");
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const nav = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    nav({ to: "/products", search: { q } });
  };

  return (
    <header className="sticky top-0 z-40 glass-strong">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <button className="md:hidden text-foreground" onClick={() => setOpen(v => !v)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Logo />
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground ml-6">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link>
          <Link to="/products" className="hover:text-gold transition-colors">Shop</Link>
          <Link to="/categories" className="hover:text-gold transition-colors">Categories</Link>
          <Link to="/account/orders" className="hover:text-gold transition-colors">Orders</Link>
          {isAdmin && <Link to="/admin" className="text-gold">Admin</Link>}
        </nav>
        <form onSubmit={submit} className="ml-auto hidden md:flex relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search premium dates..."
            className="w-full rounded-full bg-input/60 border border-border pl-9 pr-4 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition"
          />
        </form>
        <button
          onClick={() => setLang(l => l === "EN" ? "BN" : "EN")}
          className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-gold hover:border-gold/50 transition"
          aria-label="Language"
        >
          {lang === "EN" ? "EN / বাং" : "বাং / EN"}
        </button>
        <button className="text-muted-foreground hover:text-gold transition" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <Link to="/account/wishlist" className="hidden sm:block text-muted-foreground hover:text-gold transition" aria-label="Wishlist">
          <Heart className="h-5 w-5" />
        </Link>
        <Link to={user ? "/account" : "/auth"} className="text-muted-foreground hover:text-gold transition" aria-label="Account">
          <User2 className="h-5 w-5" />
        </Link>
        <Link to="/cart" className="relative text-foreground hover:text-gold transition" aria-label="Cart">
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-2 -right-2 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-gradient-gold text-[10px] font-bold text-primary-foreground shadow-gold">
              {count}
            </span>
          )}
        </Link>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/40 px-4 py-3 space-y-2 bg-background/95">
          <form onSubmit={submit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..."
              className="w-full rounded-full bg-input border border-border pl-9 pr-4 py-2 text-sm" />
          </form>
          <Link to="/products" className="block py-2" onClick={() => setOpen(false)}>Shop</Link>
          <Link to="/categories" className="block py-2" onClick={() => setOpen(false)}>Categories</Link>
          <Link to="/account/orders" className="block py-2" onClick={() => setOpen(false)}>Orders</Link>
          {isAdmin && <Link to="/admin" className="block py-2 text-gold" onClick={() => setOpen(false)}>Admin</Link>}
        </div>
      )}
    </header>
  );
}
