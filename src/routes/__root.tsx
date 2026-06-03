import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter, useRouterState, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { WishlistProvider } from "@/hooks/use-wishlist";
import { I18nProvider } from "@/hooks/use-i18n";
import { Header } from "@/components/site/Header";
import { Marquee } from "@/components/site/Marquee";
import { BottomNav } from "@/components/site/BottomNav";
import { Footer } from "@/components/site/Footer";
import { NavProgress } from "@/components/site/NavProgress";
import { ScrollToTop } from "@/components/site/ScrollToTop";
import { PageLoader } from "@/components/site/PageLoader";
import { OnboardingTour } from "@/components/site/OnboardingTour";
import { supabase } from "@/integrations/supabase/client";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Khejur Hat — Premium Dates & Ramadan Luxuries" },
      { name: "description", content: "Ultra premium dates from Madinah, California, and beyond. Curated luxury gift boxes delivered across Bangladesh." },
      { property: "og:title", content: "Khejur Hat — Premium Dates & Ramadan Luxuries" },
      { property: "og:description", content: "Ultra premium dates from Madinah, California, and beyond. Curated luxury gift boxes delivered across Bangladesh." },
      { name: "twitter:title", content: "Khejur Hat — Premium Dates & Ramadan Luxuries" },
      { name: "twitter:description", content: "Ultra premium dates from Madinah, California, and beyond. Curated luxury gift boxes delivered across Bangladesh." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9fc29770-c9e0-4666-a506-7038d9b26fa1/id-preview-6063bce2--4890d7d3-8a51-4244-b6c7-79cc5183f256.lovable.app-1779125456892.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9fc29770-c9e0-4666-a506-7038d9b26fa1/id-preview-6063bce2--4890d7d3-8a51-4244-b6c7-79cc5183f256.lovable.app-1779125456892.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Amiri:wght@400;700&family=Noto+Sans+Bengali:wght@400;500;700&display=swap" },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en"><head><HeadContent /></head><body>{children}<Scripts /></body></html>
  ),
  component: RootComponent,
  pendingComponent: PageLoader,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-7xl font-display text-gradient-gold">404</h1>
        <p className="text-muted-foreground">This page was lost in the desert.</p>
        <Link to="/" className="inline-block rounded-full bg-gradient-gold px-6 py-2 text-sm font-semibold text-primary-foreground shadow-gold">Go home</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-display text-gold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full bg-gradient-gold px-6 py-2 text-sm font-semibold text-primary-foreground">Try again</button>
        </div>
      </div>
    );
  },
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
          <I18nProvider>
            <AuthRefresher />
            <RealtimeStoreSync />
            <NavProgress />
            <ScrollToTop />
            <Shell />
            <Toaster position="top-center" theme="dark" toastOptions={{ className: "glass-strong" }} />
          </I18nProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RealtimeStoreSync() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    const invalidateProducts = () => {
      for (const queryKey of [["products"], ["featured"], ["related"], ["product"], ["wishlist-products"], ["admin-products"], ["admin-stats"]]) {
        queryClient.invalidateQueries({ queryKey, refetchType: "all" });
      }
    };
    const invalidateCategories = () => {
      for (const queryKey of [["cats"], ["cats-page"], ["admin-cats"], ["admin-cats-list"], ["products"]]) {
        queryClient.invalidateQueries({ queryKey, refetchType: "all" });
      }
    };
    const invalidateCoupons = () => {
      for (const queryKey of [["active-coupons"], ["admin-coupons"]]) {
        queryClient.invalidateQueries({ queryKey, refetchType: "all" });
      }
    };

    const channel = supabase
      .channel("storefront-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, invalidateProducts)
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, invalidateCategories)
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, invalidateCoupons)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}

function Shell() {
  const pathname = useRouterStatePath();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Marquee />
      <Header />
      <main key={pathname} className="flex-1 pb-20 md:pb-0 page-transition">
        <Outlet />
      </main>
      <Footer />
      <OnboardingTour />
      <BottomNav />
    </div>
  );
}

function useRouterStatePath() {
  return useRouterState({ select: (s) => s.location.pathname });
}

function AuthRefresher() {
  const router = useRouter();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => router.invalidate());
    return () => subscription.unsubscribe();
  }, [router]);
  return null;
}

// Auto-recover from stale dynamic chunk references after a redeploy.
// When the browser holds an old HTML pointing to a chunk hash that no
// longer exists, the dynamic import fails — reload once to fetch fresh HTML.
if (typeof window !== "undefined") {
  const RELOAD_FLAG = "__chunk_reloaded_at";
  const shouldReload = (msg: string) =>
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg);
  const tryReload = () => {
    const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
    if (Date.now() - last < 10_000) return; // avoid reload loops
    sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
    window.location.reload();
  };
  window.addEventListener("error", (e) => {
    if (e?.message && shouldReload(e.message)) tryReload();
  });
  window.addEventListener("unhandledrejection", (e) => {
    const msg = (e?.reason && (e.reason.message || String(e.reason))) || "";
    if (shouldReload(msg)) tryReload();
  });
}
