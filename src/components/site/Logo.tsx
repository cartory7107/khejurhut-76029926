import logo from "@/assets/logo.png";
import { Link } from "@tanstack/react-router";

export function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <img
        src={logo}
        alt="Khejur Hat"
        width={40}
        height={40}
        className="h-9 w-9 drop-shadow-[0_0_12px_oklch(0.78_0.14_75/0.4)] transition-transform group-hover:scale-105"
      />
      {withText && (
        <div className="leading-none">
          <div className="font-display text-xl tracking-wide text-gradient-gold">Khejur Hat</div>
          <div className="font-arabic text-[10px] text-muted-foreground -mt-0.5">خجور حات</div>
        </div>
      )}
    </Link>
  );
}
