import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/kh-secret-access")({ component: SecretAccess });

const SECRET_PASSWORD = "134680";
const STORAGE_KEY = "kh_secret_granted";

export function hasSecretAccess(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function clearSecretAccess(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function SecretAccess() {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const nav = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password === SECRET_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "true");
      setSuccess(true);
      setTimeout(() => {
        nav({ to: "/admin" });
      }, 1200);
    } else {
      setError("Wrong password. Access denied.");
    }
  };

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Decorative top */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl text-gold">Restricted Area</h1>
          <p className="text-xs text-muted-foreground">
            Enter the access code to continue
          </p>
        </div>

        {/* Success state */}
        {success ? (
          <div className="glass rounded-2xl p-6 text-center space-y-3 border border-gold/30">
            <ShieldCheck className="h-12 w-12 text-gold mx-auto" />
            <p className="text-gold font-semibold">Access Granted!</p>
            <p className="text-xs text-muted-foreground">Redirecting to admin panel...</p>
          </div>
        ) : (
          /* Password form */
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4 border border-gold/20">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Access Code</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter secret code"
                  autoFocus
                  className="w-full rounded-xl bg-input border border-border px-3 py-3 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground shadow-gold"
            >
              Unlock Access
            </button>
          </form>
        )}

        {/* Footer hint */}
        <p className="text-[10px] text-center text-muted-foreground/50">
          Only authorized personnel can access this area
        </p>
      </div>
    </div>
  );
}
