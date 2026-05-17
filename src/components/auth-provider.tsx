"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { isAppwriteConfigured } from "@/lib/appwrite";
import { Loader2, AlertTriangle } from "lucide-react";

const publicRoutes = ["/login", "/register", "/"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAppwriteUser, setLoading, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  // isMounted prevents SSR from rendering auth-dependent UI, eliminating
  // the server/client mismatch that browser extensions exploit (bis_skin_checked).
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    async function checkAuth() {
      // If Appwrite isn't configured, skip auth check
      if (!isAppwriteConfigured) {
        setLoading(false);
        return;
      }
      try {
        const user = await authService.getCurrentUser();
        setAppwriteUser(user);

        // Protect routes
        if (!user && !publicRoutes.includes(pathname)) {
          router.push("/login");
        }

        // Redirect authenticated users away from auth pages
        if (user && ["/login", "/register"].includes(pathname)) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Auth check failed", error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [isMounted, pathname, router, setAppwriteUser, setLoading]);

  // On the server (and first client paint), render children directly —
  // avoids ANY server/client mismatch on the loading state.
  if (!isMounted) {
    return <>{children}</>;
  }

  // Show spinner only after mount (client-only) to avoid hydration issues
  if (isLoading) {
    return (
      <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <>
      {/* Dev warning banner when Appwrite isn't configured */}
      {!isAppwriteConfigured && (
        <div suppressHydrationWarning className="fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-950/80 backdrop-blur-sm px-4 py-3 shadow-xl max-w-sm text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">Appwrite not configured</p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              Create <code className="bg-amber-900/50 px-1 rounded">.env.local</code> with your Appwrite credentials to enable backend features.
            </p>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
