import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types";

export function Protected({ children, role }: { children: ReactNode; role?: Role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-ink/50">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm">Loading session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Pass the attempted URL so Login can redirect back after successful sign-in
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (user && user.phoneVerified === false && location.pathname !== "/verify-phone") {
    return (
      <Navigate
        to="/verify-phone"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (role && user.role !== role) {
    return (
      <Navigate
        to={user.role === "CREATOR" ? "/dashboard/creator" : "/dashboard/brand"}
        replace
      />
    );
  }

  return <>{children}</>;
}
