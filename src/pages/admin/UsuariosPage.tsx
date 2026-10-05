import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminShell from "@/components/AdminShell";
import { atualizarUsuario, deletarUsuario, listarUsuarios, type Usuario } from "@/lib/api";

const card: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: 28,
  background: "#FFFFFF",
  border: "1px solid #DAE0E3",
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(29,33,37,0.08), 0 1px 2px rgba(29,33,37,0.06)",
  boxSizing: "border-box",
  width: "100%",
};

const btnYellow: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  minHeight: 48,
  padding: "0 20px",
  borderRadius: 4,
  fontSize: 15,
  fontWeight: 700,
  textDecoration: "none",
  boxSizing: "border-box",
  cursor: "pointer",
  background: "#FFCC00",
  color: "#1D1D1B",
  border: 0,
};

const btnGhost: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 34,
  padding: "0 10px",
  borderRadius: 4,
  border: "1px solid #A7B3B7",
  background: "#FFFFFF",
  color: "#1D1D1B",
  fontSize: 12,
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
};

export default function UsuariosPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [busca, setBusca] = useState("");
  const [confirm, setConfirm] = useState<Usuario | null>(null);
  const [erro, setErro] = useState("");

  const q = useQuery({ queryKey: ["usuarios", page], queryFn: () => listarUsuarios(page, 50) });
  const rows = q.data?.conteudo ?? [];
  const filtered = useMemo(() => {
    const b = busca.trim().toLowerCase();
    if (!b) return rows;
    return rows.filter((u) => u.nome.toLowerCase().includes(b) || u.email.toLowerCase().includes(b));
  }, [rows, busca]);
  const ativos = rows.filter((u) => u.ativo).length;

  const toggle = useMutation({
    mutationFn: (u: Usuario) =>
      atualizarUsuario(u.id, { nome: u.nome, email: u.email, tipo: u.tipo as "ADMIN" | "USER", ativo: !u.ativo }),
    onSuccess: () => { setConfirm(null); qc.invalidateQueries({ queryKey: ["usuarios"] }); },
    onError: () => setErro("Falha ao alterar status"),
  });

  const del = useMutation({
    mutationFn: (id: string) => deletarUsuario(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });

  return (
    <AdminShell>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Usuários</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#374044" }}>
            Você libera o acesso. Cada cliente configura no app o que quer monitorar.
          </p>
        </div>
        <Link to="/usuarios/novo" style={btnYellow}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          Novo usuário
        </Link>
      </div>

      <section style={card}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, fontWeight: 700, minWidth: 260, flex: 1 }}>
            Buscar usuários
            <div style={{ display: "flex", alignItems: "center", gap: 8, height: 48, padding: "0 12px", border: "2px solid #A7B3B7", borderRadius: 4, background: "#FFFFFF", boxSizing: "border-box" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374044" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou e-mail"
                style={{ flex: 1, minWidth: 0, height: "100%", border: 0, outline: "none", background: "transparent", fontSize: 15 }}
              />
            </div>
          </label>
          <p style={{ margin: 0, fontSize: 14, color: "#374044" }}>{rows.length} usuários · {ativos} ativos</p>
        </div>

        {erro && <p style={{ margin: 0, color: "#9E3229", fontSize: 13, fontWeight: 600 }}>{erro}</p>}
        {q.isLoading && <p style={{ margin: 0, color: "#656564", fontSize: 14 }}>Carregando...</p>}
        {!q.isLoading && filtered.length === 0 && (
          <p style={{ margin: 0, padding: "40px 0", textAlign: "center", color: "#656564", fontSize: 14 }}>
            {busca ? "Nenhum usuário com essa busca." : "Nenhum usuário ainda. Crie o primeiro acesso."}
          </p>
        )}

        {filtered.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #DAE0E3", color: "#656564", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <th style={{ padding: "12px 12px 12px 0", fontWeight: 700 }}>Nome</th>
                  <th style={{ padding: 12, fontWeight: 700 }}>E-mail</th>
                  <th style={{ padding: 12, fontWeight: 700 }}>Status</th>
                  <th style={{ padding: 12, fontWeight: 700 }}>Tipo</th>
                  <th style={{ padding: "12px 0", fontWeight: 700 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #DAE0E3" }}>
                    <td style={{ padding: "14px 12px 14px 0", fontWeight: 700 }}>{u.nome}</td>
                    <td style={{ padding: 14, color: "#374044" }}>{u.email}</td>
                    <td style={{ padding: 14 }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5, height: 24, padding: "0 8px", borderRadius: 999,
                        background: u.ativo ? "#E3F4EC" : "#F4EDEA", color: u.ativo ? "#17694A" : "#9E3229",
                        fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: u.ativo ? "#1F8A5B" : "#9E3229" }} />
                        {u.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td style={{ padding: 14, color: "#656564" }}>{u.tipo}</td>
                    <td style={{ padding: "14px 0" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <Link to={`/usuarios/${u.id}`} style={btnGhost}>Editar</Link>
                        <button type="button" style={{ ...btnGhost, borderColor: "#f0d0cc", color: "#9E3229" }} onClick={() => setConfirm(u)}>
                          {u.ativo ? "Desativar" : "Ativar"}
                        </button>
                        <Link to={`/usuarios/${u.id}`} style={btnGhost}>Resetar senha</Link>
                        {u.tipo !== "ADMIN" && (
                          <button type="button" style={btnGhost} onClick={() => window.confirm(`Excluir ${u.email}?`) && del.mutate(u.id)}>Excluir</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button disabled={page <= 0} onClick={() => setPage((p) => p - 1)} style={{ ...btnGhost, opacity: page <= 0 ? 0.4 : 1 }}>Anterior</button>
          <span style={{ fontSize: 14, color: "#656564" }}>Página {page + 1} / {q.data?.paginacao.totalPaginas || 1}</span>
          <button disabled={page + 1 >= (q.data?.paginacao.totalPaginas || 1)} onClick={() => setPage((p) => p + 1)} style={{ ...btnGhost, opacity: page + 1 >= (q.data?.paginacao.totalPaginas || 1) ? 0.4 : 1 }}>Próxima</button>
        </div>
      </section>

      {confirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "grid", placeItems: "center", background: "rgba(29,29,27,0.5)", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 12px 28px rgba(0,0,0,.18)" }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{confirm.ativo ? "Desativar usuário?" : "Ativar usuário?"}</h3>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#374044", lineHeight: 1.5 }}>
              {confirm.ativo
                ? `${confirm.nome} verá “conta inativa, fale com o suporte” ao tentar entrar.`
                : `${confirm.nome} voltará a poder entrar no app.`}
            </p>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" style={{ ...btnGhost, minHeight: 44 }} onClick={() => setConfirm(null)}>Cancelar</button>
              <button type="button" style={{ ...btnYellow, background: "#1D1D1B", color: "#fff" }} onClick={() => toggle.mutate(confirm)}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
