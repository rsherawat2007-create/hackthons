import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@/types";
import { api, getToken, setToken } from "@/services/api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { name: string; email: string; password: string; role: "CREATOR" | "BRAND"; companyName?: string }) => Promise<User>;
  loginWithGoogle: (role?: "CREATOR" | "BRAND") => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
  updateUser: (updated: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api<{ user: User }>("/api/auth/me");
      setUser(data.user);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const data = await api<{ token: string; user: User }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      async register(payload) {
        const data = await api<{ token: string; user: User }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      async loginWithGoogle(role = "BRAND") {
        const data = await api<{ token: string; user: User }>("/api/auth/google", {
          method: "POST",
          body: JSON.stringify({ role }),
        });
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      logout() {
        setToken(null);
        setUser(null);
      },
      refresh,
      updateUser(updated) {
        setUser(updated);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
