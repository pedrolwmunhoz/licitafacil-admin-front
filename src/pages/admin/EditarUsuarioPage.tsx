import type { CSSProperties } from "react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminShell from "@/components/AdminShell";
import { atualizarUsuario, listarUsuarios, resetarSenha } from "@/lib/api";

function genSenha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!";
  let s = "Lf-";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const fieldWrap: CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, height: 48, padding: "0 4px 0 12px",
  border: "2px solid #A7B3B7", borderRadius: 4, background: "#FFFFFF", boxSizing: "border-box",
};
const inputStyle: CSSProperties = {
  flex: 1, minWidth: 0, height: "100%", border: 0, outline: "none", background: "transparent", fontSize: 15, color: "#1D1D1B", padding: 0,
};
const card: CSSProperties = {
  display: "flex", flexDirection: "column", gap: 20, padding: 28, background: "#FFFFFF",
  border: "1px solid #DAE0E3", borderRadius: 12,
  boxShadow: "0 1px 3px rgba(29,33,37,0.08), 0 1px 2px rgba(29,33,37,0.06)",
  maxWidth: 640, boxSizing: "border-box", width: "100%",
};

export default function EditarUsuarioPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["usuarios", 0], queryFn: () => listarUsuarios(0, 100) });
  const user = q.data?.conteudo.find((u) => u.id === id);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [novaSenha, setNovaSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (user) { setNome(user.nome); setEmail(user.email); setAtivo(user.ativo); }
  }, [user]);

  const salvar = useMutation({
    mutationFn: () => atualizarUsuario(id!, { nome: nome.trim(), email: email.trim(), tipo: (user?.tipo as "ADMIN" | "USER") || "USER", ativo }),
    onSuccess: () => { setMsg("Alterações salvas"); qc.invalidateQueries({ queryKey: ["usuarios"] }); },
    onError: () => setErro("Falha ao salvar"),
  });

  const reset = useMutation({
    mutationFn: () => resetarSenha(id!, novaSenha),
    onSuccess: () => { setMsg("Senha redefinida"); setNovaSenha(""); },
    onError: () => setErro("Falha ao resetar senha"),
  });

  if (q.isLoading) return <AdminShell><p style={{ color: "#656564" }}>Carregando...</p></AdminShell>;
  if (!user) return <AdminShell><p style={{ color: "#9E3229" }}>Usuário não encontrado</p><Link to="/usuarios">Voltar</Link></AdminShell>;

  return (
    <AdminShell>
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#656564" }}>
        <Link to="/usuarios" style={{ color: "#374044", fontWeight: 600, textDecoration: "none" }}>Usuários</Link>
        <span>›</span>
        <span style={{ fontWeight: 600, color: "#1D1D1B" }}>{user.nome}</span>
      </nav>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>{user.nome}</h1>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5, height: 24, padding: "0 8px", borderRadius: 999,
            background: ativo ? "#E3F4EC" : "#F4EDEA", color: ativo ? "#17694A" : "#9E3229", fontSize: 12, fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: ativo ? "#1F8A5B" : "#9E3229" }} />
            {ativo ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      <form onSubmit={(e: FormEvent) => { e.preventDefault(); setErro(""); setMsg(""); salvar.mutate(); }} style={card}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Dados da conta</h2>
        <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, fontWeight: 700 }}>
          Nome completo
          <div style={fieldWrap}><input required value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} /></div>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, fontWeight: 700 }}>
          E-mail de acesso
          <div style={fieldWrap}><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} /></div>
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button type="button" role="switch" aria-checked={ativo} onClick={() => setAtivo((a) => !a)}
            style={{ flexShrink: 0, width: 52, height: 30, borderRadius: 999, border: 0, padding: 3, background: ativo ? "#1D1D1B" : "#A7B3B7", display: "flex", justifyContent: ativo ? "flex-end" : "flex-start", alignItems: "center", cursor: "pointer" }}>
            <span style={{ width: 24, height: 24, borderRadius: 999, background: "#FFCC00" }} />
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{ativo ? "Ativo" : "Inativo"}</span>
            <span style={{ fontSize: 13, color: "#656564" }}>Desativado, o cliente vê “conta inativa, fale com o suporte” ao tentar entrar.</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 20, borderTop: "1px solid #DAE0E3" }}>
          <Link to="/usuarios" style={{ display: "flex", alignItems: "center", minHeight: 48, padding: "0 20px", borderRadius: 4, fontWeight: 700, textDecoration: "none", border: "1px solid #A7B3B7", color: "#1D1D1B", background: "#fff" }}>Cancelar</Link>
          <button type="submit" style={{ minHeight: 48, padding: "0 20px", borderRadius: 4, fontWeight: 700, background: "#FFCC00", border: 0, cursor: "pointer" }}>Salvar alterações</button>
        </div>
      </form>

      <section style={card}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Redefinir senha</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.5, color: "#374044" }}>Defina uma nova senha e envie ao cliente. A senha anterior deixa de valer na hora.</p>
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, fontWeight: 700 }}>
          Nova senha
          <div style={fieldWrap}>
            <input value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Mínimo de 8 caracteres" style={inputStyle} />
            <button type="button" onClick={() => setNovaSenha(genSenha())}
              style={{ flexShrink: 0, height: 38, padding: "0 12px", border: 0, borderRadius: 2, background: "#F4F5F6", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Gerar</button>
          </div>
        </label>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" disabled={!novaSenha || novaSenha.length < 8 || reset.isPending}
            onClick={() => { setErro(""); setMsg(""); reset.mutate(); }}
            style={{ minHeight: 48, padding: "0 20px", borderRadius: 4, fontWeight: 700, background: "#1D1D1B", color: "#fff", border: 0, cursor: "pointer", opacity: !novaSenha || novaSenha.length < 8 ? 0.5 : 1 }}>
            Definir nova senha
          </button>
        </div>
      </section>

      {(msg || erro) && <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: erro ? "#9E3229" : "#17694A" }}>{erro || msg}</p>}
      <p style={{ margin: 0, maxWidth: 640, fontSize: 13, lineHeight: 1.5, color: "#656564" }}>
        Os filtros de monitoramento são do próprio usuário e não aparecem aqui.
      </p>
    </AdminShell>
  );
}
