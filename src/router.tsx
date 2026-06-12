import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { PageLoader } from "@/components/site/PageLoader";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPreload: "intent",
    defaultPreloadDelay: 30,
    defaultPendingComponent: PageLoader,
    defaultPendingMs: 100,
    defaultPendingMinMs: 200,
  });

  return router;
};
