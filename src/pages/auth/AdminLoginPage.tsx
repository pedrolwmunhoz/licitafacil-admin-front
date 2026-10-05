import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const DOTS = [
  0, 0, 0, 0, 1, 2, 1, 2, 0, 0, 0, 1, 0, 1, 2, 2, 0, 0, 1, 0, 1, 1, 2, 2, 0, 1, 0, 0, 1, 0, 1, 2, 0, 0, 0, 1, 0, 0, 1, 2, 0, 0, 1, 0, 0, 0, 1, 1,
];

function Logo({ size = 36 }: { size?: number }) {
  const icon = size >= 36 ? 23 : 17;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: 4,
          background: "#FFCC00",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="#1D1D1B" strokeWidth="2.6" strokeLinecap="round">
          <path d="M4 4a16 16 0 0 1 16 16" />
          <path d="M4 10a10 10 0 0 1 10 10" />
          <circle cx="5" cy="19" r="1.8" fill="#1D1D1B" stroke="none" />
        </svg>
      </span>
      <span style={{ fontSize: size >= 36 ? 20 : 16, fontWeight: 800, letterSpacing: "-0.015em", color: "#FFFFFF", whiteSpace: "nowrap" }}>
        Licita<span style={{ color: "#FFCC00" }}>Facil</span>
      </span>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: "#FFCC00", background: "#374044", padding: "3px 6px", borderRadius: 2 }}>
        ADMIN
      </span>
    </div>
  );
}

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("admin@licitafacil.local");
  const [senha, setSenha] = useState("");
  const [show, setShow] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/usuarios" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await login(email.trim(), senha);
    } catch (err: unknown) {
      setErro(
        (err as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data?.mensagem ||
          (err as Error)?.message ||
          "E-mail ou senha inválidos",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexWrap: "wrap",
        fontFamily: "'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif",
        color: "#1D1D1B",
        background: "#FFFFFF",
      }}
    >
      <section
        style={{
          flex: "1 1 420px",
          boxSizing: "border-box",
          background: "#1D1D1B",
          padding: "48px clamp(24px, 5vw, 72px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 48,
        }}
      >
        <Logo />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 460 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#FFCC00" }}>
            Painel de acesso
          </p>
          <p style={{ margin: 0, fontSize: 40, lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.025em", color: "#FFFFFF" }}>
            Libere o acesso. O cliente escolhe o que monitorar.
          </p>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#DAE0E3" }}>
            Crie, edite e desative as contas que usam o LicitaFacil.
          </p>
        </div>
        <div aria-hidden style={{ display: "grid", gridTemplateColumns: "repeat(8, 18px)", gap: 5 }}>
          {DOTS.map((v, i) => (
            <span key={i} style={{ width: 18, height: 18, background: v === 0 ? "transparent" : v === 1 ? "#374044" : "#FFCC00" }} />
          ))}
        </div>
      </section>

      <section
        style={{
          flex: "1 1 420px",
          boxSizing: "border-box",
          padding: "48px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Entrar no painel</h1>
            <p style={{ margin: 0, fontSize: 14, color: "#374044" }}>Acesso restrito à equipe LicitaFacil.</p>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, fontWeight: 700, color: "#1D1D1B" }}>
            E-mail
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 48,
                padding: "0 4px 0 12px",
                border: erro ? "2px solid #9E3229" : "2px solid #A7B3B7",
                borderRadius: 4,
                background: "#FFFFFF",
                boxSizing: "border-box",
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com.br"
                style={{ flex: 1, minWidth: 0, height: "100%", border: 0, outline: "none", background: "transparent", fontSize: 15, color: "#1D1D1B", padding: 0 }}
              />
            </div>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, fontWeight: 700, color: "#1D1D1B" }}>
            Senha
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 48,
                padding: "0 4px 0 12px",
                border: erro ? "2px solid #9E3229" : "2px solid #A7B3B7",
                borderRadius: 4,
                background: "#FFFFFF",
                boxSizing: "border-box",
              }}
            >
              <input
                type={show ? "text" : "password"}
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                style={{ flex: 1, minWidth: 0, height: "100%", border: 0, outline: "none", background: "transparent", fontSize: 15, color: "#1D1D1B", padding: 0 }}
              />
              <button
                type="button"
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShow((s) => !s)}
                style={{ width: 40, height: 40, border: 0, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#374044", cursor: "pointer" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </label>

          {erro && (
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#9E3229" }}>{erro}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minHeight: 48,
              padding: "0 20px",
              borderRadius: 4,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              background: "#FFCC00",
              color: "#1D1D1B",
              border: 0,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </div>
  );
}
