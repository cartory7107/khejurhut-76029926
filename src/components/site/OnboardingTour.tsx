import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const TOUR_KEY = "kh_onboarding_complete_v1";

const steps = [
  { label: "Navigation", text: "Use the clean mobile bar for Home, Shop, Search and Cart. More support links live inside the menu.", icon: Sparkles },
  { label: "Search", text: "Find Ajwa, Medjool, gift boxes or honey quickly from the header or bottom search shortcut.", icon: Search },
  { label: "Product pages", text: "Tap any product card to open harvest details, trust notes, reviews and fast checkout actions.", icon: ShoppingBag },
  { label: "Checkout", text: "Cart and checkout are full pages with secure indicators, shipping details and Pay After Delivery.", icon: Sparkles },
];

export function OnboardingTour() {
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (loading || user || typeof window === "undefined") return;
    if (!localStorage.getItem(TOUR_KEY)) {
      const timer = window.setTimeout(() => setVisible(true), 900);
      return () => window.clearTimeout(timer);
    }
  }, [loading, user]);

  if (!visible) return null;

  const finish = () => {
    localStorage.setItem(TOUR_KEY, "true");
    setVisible(false);
  };
  const ActiveIcon = steps[step]?.icon ?? Sparkles;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-background/45 p-4 backdrop-blur-sm sm:items-center">
      <div className="premium-tour-orb" aria-hidden="true">
        <span />
      </div>
      <section className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-gold/20 bg-card/90 p-5 shadow-elegant backdrop-blur-2xl">
        <button onClick={finish} className="absolute right-4 top-4 rounded-full glass p-2 text-muted-foreground hover:text-gold" aria-label="Close tour">
          <X className="h-4 w-4" />
        </button>
        {!started ? (
          <div className="space-y-5 pt-4 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-gold text-primary-foreground shadow-gold">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-gold">Welcome to Khejur Hat</p>
              <h2 className="mt-2 font-display text-3xl">Would you like a quick tour of Urban Vogue?</h2>
              <p className="mt-2 text-sm text-muted-foreground">A premium guide will show you how to shop organic dates, honey and luxury gift collections faster.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button onClick={() => setStarted(true)} className="rounded-full bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary-foreground shadow-gold">Start Tour</button>
              <button onClick={finish} className="rounded-full glass border border-border px-5 py-3 text-sm text-muted-foreground hover:text-gold">Skip</button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 pt-4">
            <div className="flex items-center gap-4">
              <div className="guide-marker grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-gold text-primary-foreground shadow-gold">
                <ActiveIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-gold">Step {step + 1} of {steps.length}</p>
                <h2 className="font-display text-2xl">{steps[step].label}</h2>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{steps[step].text}</p>
            <div className="flex gap-2">
              {steps.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-gold" : "bg-border"}`} />)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-full glass border border-border px-5 py-3 text-sm disabled:opacity-40">Back</button>
              {step < steps.length - 1 ? (
                <button onClick={() => setStep(step + 1)} className="flex-1 rounded-full bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold">Next</button>
              ) : (
                <Link to="/products" onClick={finish} className="flex-1 rounded-full bg-gradient-gold py-3 text-center text-sm font-semibold text-primary-foreground shadow-gold">Start shopping</Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
