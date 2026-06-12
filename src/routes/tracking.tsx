import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, PackageSearch, Truck, Warehouse, Home } from "lucide-react";

export const Route = createFileRoute("/tracking")({ component: TrackingPage });

const stages = [
  { label: "Processing", icon: Warehouse },
  { label: "Shipped", icon: Truck },
  { label: "Out for Delivery", icon: PackageSearch },
  { label: "Delivered", icon: Home },
];

function TrackingPage() {
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState("");
  const activeIndex = useMemo(() => submitted ? Math.min(3, Math.abs([...submitted].reduce((a, c) => a + c.charCodeAt(0), 0)) % 4) : -1, [submitted]);
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-[2rem] border border-gold/15 bg-gradient-surface p-6 text-center hero-particles sm:p-10">
        <p className="text-xs uppercase tracking-[0.32em] text-gold">Order tracking</p>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl">Track your AMANA ENTERPRISE order</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">Enter your tracking number or order code to view a clean status timeline.</p>
        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(code.trim() || "AE-DEMO-1001"); }} className="mx-auto mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Tracking number or order code" className="flex-1 rounded-full bg-input border border-border px-5 py-3 text-sm outline-none focus:border-gold" />
          <button className="rounded-full bg-gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold">Track order</button>
        </form>
      </div>
      {submitted && <div className="mt-8 glass rounded-[2rem] p-5 sm:p-8"><div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-display text-2xl">Status for {submitted}</h2><span className="text-sm text-gold">{stages[activeIndex].label}</span></div><div className="grid gap-3 sm:grid-cols-4">{stages.map(({ label, icon: Icon }, index) => { const done = index <= activeIndex; return <div key={label} className={`rounded-2xl border p-4 ${done ? "border-gold/40 bg-gold/10" : "border-border/60 bg-background/25"}`}><div className={`mb-3 grid h-10 w-10 place-items-center rounded-full ${done ? "bg-gradient-gold text-primary-foreground" : "glass text-muted-foreground"}`}>{done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}</div><h3 className="font-medium">{label}</h3><p className="mt-1 text-xs text-muted-foreground">{done ? "Completed or currently active" : "Pending update"}</p></div>; })}</div></div>}
    </section>
  );
}
