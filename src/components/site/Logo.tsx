import logo from "@/assets/logo.png";
import { Link } from "@tanstack/react-router";

export function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="h-9 w-9 rounded-xl overflow-hidden drop-shadow-[0_0_12px_oklch(0.78_0.14_75/0.4)] transition-transform group-hover:scale-105">
        <img
          src={logo}
          alt="AMANA ENTERPRISE"
          width={36}
          height={36}
          className="h-full w-full object-cover"
        />
      </div>
      {withText && (
        <div className="leading-none">
          <div className="font-display text-xl tracking-wide text-gradient-gold">AMANA ENTERPRISE</div>
        </div>
      )}
    </Link>
  );
}
