import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { RouteFallback } from "@/components/RouteFallback";
import { AppProviders } from "@/apps/AppProviders";
import AdminLayout from "@/components/layouts/AdminLayout";

const NotFound = lazy(() => import("@/pages/NotFound"));
const LoginPage = lazy(() => import("@/pages/auth/AdminLoginPage"));

const DashboardAdminPage = lazy(() => import("@/pages/admin/DashboardAdminPage"));
const AdminUsuariosPage = lazy(() => import("@/pages/admin/AdminUsuariosPage"));
const AdminFeriadosGlobaisPage = lazy(() => import("@/pages/admin/AdminFeriadosGlobaisPage"));
const AdminFeriadosEmpresaPage = lazy(() => import("@/pages/admin/AdminFeriadosEmpresaPage"));
const AdminBlogComentariosPage = lazy(() => import("@/pages/admin/AdminBlogComentariosPage"));
const AdminBlogMetricasPage = lazy(() => import("@/pages/admin/AdminBlogMetricasPage"));
const AdminEmpresasPage = lazy(() => import("@/pages/admin/AdminEmpresasPage"));
const AdminEmpresaFuncionariosPage = lazy(() => import("@/pages/admin/AdminEmpresaFuncionariosPage"));
const AdminEditarEmpresaPage = lazy(() => import("@/pages/admin/AdminEditarEmpresaPage"));
const AdminPlanosPage = lazy(() => import("@/pages/admin/AdminPlanosPage"));
const AdminEditarPlanoPage = lazy(() => import("@/pages/admin/AdminEditarPlanoPage"));

export default function AdminApp() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/admin" replace />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedTypes={["ADMIN"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardAdminPage />} />
                <Route path="usuarios" element={<AdminUsuariosPage />} />
                <Route path="empresas/:empresaId/funcionarios" element={<AdminEmpresaFuncionariosPage />} />
                <Route path="empresas/:empresaId/editar" element={<AdminEditarEmpresaPage />} />
                <Route path="empresas" element={<AdminEmpresasPage />} />
                <Route path="planos/:empresaId/editar" element={<AdminEditarPlanoPage />} />
                <Route path="planos" element={<AdminPlanosPage />} />
                <Route path="feriados" element={<AdminFeriadosGlobaisPage />} />
                <Route path="feriados-empresa" element={<AdminFeriadosEmpresaPage />} />
                <Route path="blog-metricas" element={<AdminBlogMetricasPage />} />
                <Route path="blog-comentarios" element={<AdminBlogComentariosPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </AppProviders>
  );
}
