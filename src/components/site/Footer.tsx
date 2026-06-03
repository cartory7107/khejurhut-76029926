import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-gold/10 bg-gradient-surface">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,oklch(0.78_0.14_75/.16),transparent_70%)]" />
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4">
        <div className="space-y-3"><Logo /><p className="max-w-xs text-sm text-muted-foreground">Curated premium dates, natural honey and Ramadan luxuries, delivered across Bangladesh.</p></div>
        <div><h4 className="mb-3 text-sm font-medium text-gold">Shop</h4><ul className="space-y-2 text-sm text-muted-foreground"><li><Link to="/products" className="hover:text-gold">Premium Dates</Link></li><li><Link to="/categories" className="hover:text-gold">Categories</Link></li><li><Link to="/products" search={{ cat: "gift-boxes" }} className="hover:text-gold">Gift Boxes</Link></li><li><Link to="/cart" className="hover:text-gold">Cart</Link></li></ul></div>
        <div><h4 className="mb-3 text-sm font-medium text-gold">Support</h4><ul className="space-y-2 text-sm text-muted-foreground"><li><Link to="/tracking" className="hover:text-gold">Order Tracking</Link></li><li><Link to="/returns" className="hover:text-gold">Returns</Link></li><li><Link to="/privacy" className="hover:text-gold">Privacy Policy</Link></li><li><Link to="/terms" className="hover:text-gold">Terms & Conditions</Link></li></ul></div>
        <div><h4 className="mb-3 text-sm font-medium text-gold">Khejur Hat</h4><p className="text-sm text-muted-foreground">Dhaka, Bangladesh<br/>support@khejurhat.com</p><Link to="/about" className="mt-3 inline-block text-sm text-gold hover:underline">About us</Link></div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Khejur Hat — Crafted with care.</div>
    </footer>
  );
}
