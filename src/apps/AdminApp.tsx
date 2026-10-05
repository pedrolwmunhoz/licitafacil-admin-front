import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AdminLoginPage from "@/pages/auth/AdminLoginPage";
import UsuariosPage from "@/pages/admin/UsuariosPage";
import NovoUsuarioPage from "@/pages/admin/NovoUsuarioPage";
import EditarUsuarioPage from "@/pages/admin/EditarUsuarioPage";
import type { ReactNode } from "react";

const qc = new QueryClient();

function Private({ children }: { children: ReactNode }) {
  const { isAuthenticated, isCheckingSession } = useAuth();
  if (isCheckingSession) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function AdminApp() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AdminLoginPage />} />
            <Route path="/usuarios" element={<Private><UsuariosPage /></Private>} />
            <Route path="/usuarios/novo" element={<Private><NovoUsuarioPage /></Private>} />
            <Route path="/usuarios/:id" element={<Private><EditarUsuarioPage /></Private>} />
            <Route path="/" element={<Navigate to="/usuarios" replace />} />
            <Route path="*" element={<Navigate to="/usuarios" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
