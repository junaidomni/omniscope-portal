import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import { registerServiceWorker, checkInstallPrompt, shouldShowInstallPrompt } from "./pwa-register";

import { toast } from "sonner";

/**
 * Centralized API error handler.
 * Classifies tRPC errors and routes them to the appropriate recovery path:
 *  - UNAUTHORIZED → redirect to login
 *  - FORBIDDEN → toast warning
 *  - NOT_FOUND → toast info
 *  - BAD_REQUEST → toast with validation message
 *  - INTERNAL_SERVER_ERROR → toast error + console.error
 *  - Network errors → toast with retry hint
 */
function handleApiError(error: unknown, context: "query" | "mutation") {
  if (!(error instanceof TRPCClientError)) {
    console.error(`[API ${context} Error]`, error);
    return;
  }

  const msg = error.message;

  // Auth redirect
  if (msg === UNAUTHED_ERR_MSG) {
    if (typeof window !== "undefined") {
      window.location.href = getLoginUrl();
    }
    return;
  }

  // Classify by tRPC error code
  const code = error.data?.code as string | undefined;

  switch (code) {
    case "FORBIDDEN":
      toast.warning("Access Denied", { description: msg || "You don't have permission for this action." });
      break;
    case "NOT_FOUND":
      toast.info("Not Found", { description: msg || "The requested resource was not found." });
      break;
    case "BAD_REQUEST":
      toast.error("Invalid Request", { description: msg || "Please check your input and try again." });
      break;
    case "INTERNAL_SERVER_ERROR":
      toast.error("Server Error", { description: "Something went wrong. Our team has been notified." });
      console.error(`[API ${context} Error] INTERNAL:`, error);
      break;
    case "TIMEOUT":
    case "CLIENT_CLOSED_REQUEST":
      toast.warning("Request Timeout", { description: "The server took too long to respond. Please try again." });
      break;
    default:
      // Network errors (fetch failures, etc.)
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
        toast.warning("Connection Issue", { description: "Unable to reach the server. Check your connection." });
      } else if (context === "mutation") {
        // Only show toasts for mutation errors by default (queries handle errors in UI)
        toast.error("Action Failed", { description: msg || "Please try again." });
      }
      console.error(`[API ${context} Error]`, error);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry auth or permission errors
        if (error instanceof TRPCClientError) {
          const code = error.data?.code;
          if (code === "UNAUTHORIZED" || code === "FORBIDDEN" || code === "NOT_FOUND") return false;
        }
        return failureCount < 2;
      },
      staleTime: 30_000, // 30s — reduce unnecessary refetches
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // Never auto-retry mutations
    },
  },
});

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    handleApiError(event.query.state.error, "query");
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    handleApiError(event.mutation.state.error, "mutation");
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        const orgId = localStorage.getItem("omniscope-current-org-id");
        return orgId ? { "x-org-id": orgId } : {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

// Register PWA service worker
if (import.meta.env.PROD) {
  registerServiceWorker();
  
  // Show install prompt if not dismissed
  if (shouldShowInstallPrompt()) {
    checkInstallPrompt();
  }
};
