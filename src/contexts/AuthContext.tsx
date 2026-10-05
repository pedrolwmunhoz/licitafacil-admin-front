import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearSession, getStoredUser, loginAdmin, logoutAdmin, meAdmin, type AuthUser } from "@/lib/api";
import { isAxiosError } from "axios";

type AuthCtx = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isCheckingSession: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelado = false;
    meAdmin()
      .then((data) => {
        if (cancelado) return;
        setUser({
          usuarioId: data.usuarioId,
          nome: data.nome,
          email: data.email,
          tipo: data.tipo,
        });
      })
      .catch((err) => {
        if (cancelado) return;
        if (isAxiosError(err) && err.response?.status === 401) {
          clearSession();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelado) setChecking(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    user,
    isAuthenticated: !!user && user.tipo === "ADMIN",
    isCheckingSession: checking,
    async login(email, senha) {
      const data = await loginAdmin(email, senha);
      setUser({
        usuarioId: data.usuarioId,
        nome: data.nome,
        email: data.email,
        tipo: data.tipo,
      });
    },
    async logout() {
      await logoutAdmin();
      setUser(null);
    },
  }), [user, checking]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}
