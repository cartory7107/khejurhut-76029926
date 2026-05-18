import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/40 bg-gradient-surface">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">
            Curated premium dates and Ramadan luxuries, delivered across Bangladesh.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gold mb-3">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Premium Dates</li><li>Organic</li><li>Gift Boxes</li><li>Ramadan</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gold mb-3">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Contact</li><li>Shipping</li><li>Returns</li><li>FAQ</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gold mb-3">Khejur Hat</h4>
          <p className="text-sm text-muted-foreground">Dhaka, Bangladesh<br/>support@khejurhat.com</p>
        </div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Khejur Hat — Crafted with care.
      </div>
    </footer>
  );
}
