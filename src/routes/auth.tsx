import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Logo } from "@/components/site/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Account created!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      nav({ to: redirect || "/" });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error("Google sign-in failed");
    else if (!res.redirected) nav({ to: redirect || "/" });
  };

  return (
    <section className="min-h-[80vh] grid place-items-center px-6 py-12">
      <div className="glass-strong w-full max-w-md rounded-3xl p-8 space-y-5 shadow-elegant">
        <div className="text-center"><Logo /></div>
        <h1 className="font-display text-3xl text-center">{mode === "login" ? "Welcome back" : "Create account"}</h1>
        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input required placeholder="Full name" value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-xl bg-input border border-border px-4 py-3 outline-none focus:border-gold" />
          )}
          <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full rounded-xl bg-input border border-border px-4 py-3 outline-none focus:border-gold" />
          <input required type="password" placeholder="Password" minLength={6} value={password} onChange={e => setPassword(e.target.value)}
            className="w-full rounded-xl bg-input border border-border px-4 py-3 outline-none focus:border-gold" />
          <button disabled={busy} className="w-full rounded-full bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:opacity-50">
            {busy ? "..." : mode === "login" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <div className="relative text-center text-xs text-muted-foreground"><span className="px-2 bg-card relative z-10">or</span><div className="absolute inset-x-0 top-1/2 border-t border-border/60" /></div>
        <button onClick={google} className="w-full rounded-full glass border border-border/60 py-3 text-sm hover:border-gold/50 transition">Continue with Google</button>
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="w-full text-xs text-muted-foreground hover:text-gold">
          {mode === "login" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </section>
  );
}
