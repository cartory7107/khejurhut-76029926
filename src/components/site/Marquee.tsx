const items = [
  "Premium Ajwa", "Medjool", "Safawi", "Organic Dates",
  "Ramadan Collection", "Luxury Gift Boxes", "Free Delivery over ৳2000",
];

export function Marquee() {
  return (
    <div className="border-y border-border/40 bg-gradient-to-r from-cocoa via-background to-cocoa">
      <div className="marquee py-2 text-xs uppercase tracking-[0.25em] text-gold/90">
        {[0, 1].map(k => (
          <div className="marquee-track" key={k} aria-hidden={k === 1}>
            {items.map((t, i) => (
              <span key={`${k}-${i}`} className="flex items-center gap-3">
                <span className="text-gold">✦</span>
                <span>{t}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
