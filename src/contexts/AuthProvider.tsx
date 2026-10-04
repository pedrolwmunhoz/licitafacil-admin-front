import React, { useState, useCallback, useEffect } from "react";
import { isAxiosError } from "axios";
import api from "@/lib/api";
import { navigateApp } from "@/lib/app-navigation";
import { sessaoHint } from "@/lib/sessao-hint";
import { AuthContext } from "@/contexts/AuthContext";
import type { LoginRequest, SessaoWebResponse, TipoUsuario } from "@/types/auth";

type StatusSessao = "verificando" | "autenticado" | "anonimo" | "indisponivel";

function destinoDoTipo(tipo: TipoUsuario | null): string {
  return tipo === "ADMIN" ? "/admin" : "/login";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<StatusSessao>("verificando");
  const [sessao, setSessao] = useState<SessaoWebResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const abrirSessao = useCallback((dados: SessaoWebResponse) => {
    sessaoHint.definir(dados.tipoUsuario);
    setSessao(dados);
    setStatus("autenticado");
  }, []);

  const encerrarSessao = useCallback(() => {
    sessaoHint.limpar();
    setSessao(null);
    setStatus("anonimo");
  }, []);

  useEffect(() => {
    let cancelado = false;
    api
      .get<SessaoWebResponse>("/api/admin-console/auth/me")
      .then(({ data }) => {
        if (cancelado) return;
        if (data.tipoUsuario !== "ADMIN") {
          encerrarSessao();
          return;
        }
        abrirSessao(data);
      })
      .catch((erro) => {
        if (cancelado) return;
        if (isAxiosError(erro) && erro.response?.status === 401) {
          encerrarSessao();
        } else {
          setSessao(null);
          setStatus("indisponivel");
        }
      });
    return () => {
      cancelado = true;
    };
  }, [abrirSessao, encerrarSessao]);

  const applyLoginResponse = useCallback(
    (response: SessaoWebResponse, options?: { redirect?: boolean }) => {
      abrirSessao(response);
      if (options?.redirect === false) return;
      navigateApp(destinoDoTipo(response.tipoUsuario));
    },
    [abrirSessao],
  );

  const login = useCallback(
    async (data: LoginRequest) => {
      setIsLoading(true);
      try {
        const response = await api.post<SessaoWebResponse>("/api/admin-console/auth", data);
        applyLoginResponse(response.data);
      } finally {
        setIsLoading(false);
      }
    },
    [applyLoginResponse],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/api/admin-console/auth/logout");
    } catch {
      // gateway limpa cookie mesmo sem sessão
    } finally {
      encerrarSessao();
      navigateApp("/login");
    }
  }, [encerrarSessao]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: status === "autenticado",
        isCheckingSession: status === "verificando",
        isSessionUnavailable: status === "indisponivel",
        userType: sessao?.tipoUsuario ?? null,
        usuarioId: sessao?.usuarioId ?? null,
        isLoading,
        login,
        applyLoginResponse,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
