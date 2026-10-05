import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const usersActive = loc.pathname.startsWith("/usuarios");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexWrap: "wrap",
        background: "#F4F5F6",
        fontFamily: "'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif",
        color: "#1D1D1B",
      }}
    >
      <aside
        style={{
          flex: "1 1 240px",
          boxSizing: "border-box",
          background: "#1D1D1B",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px" }}>
          <span
            aria-hidden
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              borderRadius: 4,
              background: "#FFCC00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1D1D1B" strokeWidth="2.6" strokeLinecap="round">
              <path d="M4 4a16 16 0 0 1 16 16" />
              <path d="M4 10a10 10 0 0 1 10 10" />
              <circle cx="5" cy="19" r="1.8" fill="#1D1D1B" stroke="none" />
            </svg>
          </span>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.015em", color: "#FFFFFF", whiteSpace: "nowrap" }}>
            Licita<span style={{ color: "#FFCC00" }}>Facil</span>
          </span>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: "#FFCC00", background: "#374044", padding: "3px 6px", borderRadius: 2 }}>
            ADMIN
          </span>
        </div>

        <nav aria-label="Principal" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Link
            to="/usuarios"
            aria-current={usersActive ? "page" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minHeight: 44,
              padding: "0 12px",
              borderRadius: 4,
              background: usersActive ? "#FFCC00" : "transparent",
              color: usersActive ? "#1D1D1B" : "#FFFFFF",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.5 2.4 3.5 5.2" />
            </svg>
            Usuários
          </Link>
        </nav>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12, padding: "16px 4px 0", borderTop: "1px solid rgba(255,255,255,0.16)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>{user?.nome || "Admin"}</span>
            <span style={{ fontSize: 12, color: "#DAE0E3" }}>{user?.email}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minHeight: 40,
              fontSize: 13,
              fontWeight: 600,
              color: "#FFFFFF",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: "999 1 560px",
          minWidth: 0,
          boxSizing: "border-box",
          padding: "32px clamp(16px, 4vw, 48px) 48px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {children}
      </main>
    </div>
  );
}
