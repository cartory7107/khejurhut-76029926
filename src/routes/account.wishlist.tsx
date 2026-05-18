import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/account/wishlist")({ component: () => (
  <div className="glass rounded-2xl p-8 text-center text-muted-foreground">Wishlist coming soon</div>
)});
