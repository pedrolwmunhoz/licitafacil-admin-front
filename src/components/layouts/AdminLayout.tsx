import { Suspense, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { RouteFallback } from "@/components/RouteFallback";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building2,
  Briefcase,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageSquare,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from "./ProfileDropdown";
import { AppFooter } from "@/components/AppFooter";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/usuarios", icon: Users, label: "Usuários" },
  { to: "/admin/empresas", icon: Briefcase, label: "Empresas" },
  { to: "/admin/planos", icon: CreditCard, label: "Planos" },
  { to: "/admin/feriados", icon: Calendar, label: "Feriados globais" },
  { to: "/admin/feriados-empresa", icon: Building2, label: "Feriados por empresa" },
  { to: "/admin/blog-metricas", icon: BarChart3, label: "Métricas do blog" },
  { to: "/admin/blog-comentarios", icon: MessageSquare, label: "Comentários do blog" },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, userType } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:relative",
          collapsed ? "w-16" : "w-56",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <ShieldCheck className="h-7 w-7 shrink-0 text-sidebar-primary" />
          {!collapsed && (
            <span className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">
              Admin
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden border-t border-sidebar-border p-2 lg:block">
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          {userType && <ProfileDropdown userType={userType} logout={logout} />}
        </header>

        <main id="conteudo-principal" tabIndex={-1} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 p-4 lg:p-6">
            <Suspense fallback={<RouteFallback />}>
              <Outlet />
            </Suspense>
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}

