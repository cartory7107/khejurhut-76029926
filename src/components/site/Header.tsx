import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, User2, Menu, X, Heart, Home, Store, PackageSearch, ShieldCheck, Facebook } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { NotificationsBell } from "./NotificationsBell";

const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/amanabazar/",
  whatsapp: "https://api.whatsapp.com/send?phone=%2B8801930107419",
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.6 6.32A7.85 7.85 0 0 0 12 4a7.94 7.94 0 0 0-6.88 12.7L4 20l3.42-1.08A7.93 7.93 0 0 0 20 12a7.85 7.85 0 0 0-2.4-5.68ZM12 18.5A6.46 6.46 0 0 1 6.5 13c0-3.03 2.47-5.5 5.5-5.5s5.5 2.47 5.5 5.5-2.47 5.5-5.5 5.5Zm3.1-4.35c-.15-.08-.9-.45-1.04-.5-.14-.05-.24-.08-.34.08-.1.16-.4.5-.5.6-.1.1-.2.12-.35.04a4.8 4.8 0 0 1-1.43-.88 5.3 5.3 0 0 1-.99-1.23c-.1-.17 0-.26.08-.35.08-.08.17-.2.26-.3.08-.1.1-.16.15-.27.05-.1.02-.2-.01-.28-.04-.08-.34-.82-.47-1.12-.12-.29-.24-.25-.34-.26l-.28-.01c-.1 0-.26.04-.4.19-.13.16-.5.48-.5 1.18 0 .7.5 1.37.57 1.46.07.1 1 1.52 2.42 2.13.34.14.6.23.81.29.34.1.65.09.9.05.27-.04.9-.37 1.03-.72.12-.36.12-.66.08-.72-.04-.07-.13-.1-.27-.17Z" />
    </svg>
  );
}

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
        <Link to="/account/wishlist" className="hidden sm:block text-muted-foreground hover:text-gold transition" aria-label="Wishlist"><Heart className="h-5 w-5" /></Link>
        <Link to={user ? "/account" : "/auth"} className="hidden sm:inline-flex text-muted-foreground hover:text-gold transition" aria-label="Account"><User2 className="h-5 w-5" /></Link>
        <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full text-foreground hover:text-gold transition" aria-label="Cart">
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && <span className="absolute -top-1 -right-1 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-gradient-gold text-[10px] font-bold text-primary-foreground shadow-gold">{count}</span>}
        </Link>
      </div>
      <div className="relative z-50 -mt-1 border-t border-gold/5 bg-gradient-to-r from-cocoa via-[#1a1209] to-cocoa">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-1.5 sm:px-4">
          <span className="text-[10px] uppercase tracking-[0.18em] text-gold/60 sm:text-xs">সরাসরি যোগাযোগ</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook page"
              className="group flex items-center gap-1.5 rounded-full border border-[#1877F2]/30 bg-background/30 px-2.5 py-1 text-xs text-[#1877F2] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-[#1877F2]/60 hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:shadow-[0_0_12px_rgba(24,119,242,0.25)] sm:px-3 sm:gap-2"
            >
              <Facebook className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
              <span className="hidden sm:inline">Facebook</span>
            </a>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp chat"
              className="group flex items-center gap-1.5 rounded-full border border-[#25D366]/30 bg-background/30 px-2.5 py-1 text-xs text-[#25D366] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-[#25D366]/60 hover:bg-[#25D366]/10 hover:text-[#25D366] hover:shadow-[0_0_12px_rgba(37,211,102,0.25)] sm:px-3 sm:gap-2"
            >
              <WhatsAppIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </div>
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
          <div className="mt-4 flex items-center justify-center gap-3 border-t border-border/30 pt-4">
            <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gold/80 hover:text-gold">
              <Facebook className="h-4 w-4" /> Facebook
            </a>
            <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gold/80 hover:text-gold">
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

