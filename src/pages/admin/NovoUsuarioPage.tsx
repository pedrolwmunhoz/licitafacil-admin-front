import type { CSSProperties } from "react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import AdminShell from "@/components/AdminShell";
import { criarUsuario } from "@/lib/api";

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

export default function NovoUsuarioPage() {
  const nav = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState(genSenha);
  const [erro, setErro] = useState("");
  const [criado, setCriado] = useState<{ nome: string; email: string; senha: string } | null>(null);

  const criar = useMutation({
    mutationFn: () => criarUsuario({ nome: nome.trim(), email: email.trim(), senha, tipo: "USER" }),
    onSuccess: () => setCriado({ nome: nome.trim(), email: email.trim(), senha }),
    onError: (e: unknown) => setErro((e as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem || "Erro ao criar"),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha.length < 8) { setErro("Senha com mínimo de 8 caracteres"); return; }
    criar.mutate();
  }

  return (
    <AdminShell>
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#656564" }}>
        <Link to="/usuarios" style={{ color: "#374044", fontWeight: 600, textDecoration: "none" }}>Usuários</Link>
        <span>›</span>
        <span style={{ fontWeight: 600, color: "#1D1D1B" }}>Novo usuário</span>
      </nav>

      {criado ? (
        <section style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Usuário criado</h1>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 24, padding: "0 8px", borderRadius: 999, background: "#E3F4EC", color: "#17694A", fontSize: 12, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#1F8A5B" }} />Ativo
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#374044" }}>Acesso liberado para {criado.nome}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#656564" }}>E-mail de acesso</span>
            <strong style={{ fontSize: 15 }}>{criado.email}</strong>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#656564" }}>Senha temporária</span>
            <code style={{ fontSize: 15, background: "#F4F5F6", padding: "10px 12px", borderRadius: 4 }}>{criado.senha}</code>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "flex-end", borderTop: "1px solid #DAE0E3", paddingTop: 20 }}>
            <button type="button" onClick={() => { setCriado(null); setNome(""); setEmail(""); setSenha(genSenha()); }}
              style={{ minHeight: 48, padding: "0 20px", borderRadius: 4, border: "1px solid #A7B3B7", background: "#fff", fontWeight: 700, cursor: "pointer" }}>
              Criar outro
            </button>
            <button type="button" onClick={() => nav("/usuarios")}
              style={{ minHeight: 48, padding: "0 20px", borderRadius: 4, border: 0, background: "#FFCC00", fontWeight: 700, cursor: "pointer" }}>
              Voltar para usuários
            </button>
          </div>
        </section>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Novo usuário</h1>
            <p style={{ margin: 0, fontSize: 14, color: "#374044" }}>Crie o acesso. Não existe auto-cadastro no app.</p>
          </div>
          <form onSubmit={onSubmit} style={card}>
            <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, fontWeight: 700 }}>
              Nome completo
              <div style={fieldWrap}><input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Marina Souza" style={inputStyle} /></div>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, fontWeight: 700 }}>
              E-mail de acesso
              <div style={fieldWrap}><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@empresa.com.br" style={inputStyle} /></div>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, fontWeight: 700 }}>
              Senha temporária
              <div style={fieldWrap}>
                <input required value={senha} onChange={(e) => setSenha(e.target.value)} style={inputStyle} />
                <button type="button" onClick={() => setSenha(genSenha())}
                  style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 12px", marginRight: 1, border: 0, borderRadius: 2, background: "#F4F5F6", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Gerar
                </button>
              </div>
              <span style={{ fontSize: 13, fontWeight: 400, color: "#656564", lineHeight: 1.45 }}>
                Copie e envie ao cliente junto com o e-mail (WhatsApp ou e-mail, fora do app).
              </span>
            </label>

            <div style={{ display: "flex", gap: 14, padding: "14px 16px", background: "#F4FAFF", borderTop: "3px solid #4A65A3", borderRadius: 4 }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#2A3B54" }}>O cliente escolhe o que monitorar</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: 1.45, color: "#374044" }}>
                  Palavras-chave, estados, valor e modalidades são definidos por ele dentro do app. Aqui você só libera o acesso.
                </p>
              </div>
            </div>

            {erro && <p style={{ margin: 0, color: "#9E3229", fontSize: 13, fontWeight: 600 }}>{erro}</p>}

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 12, paddingTop: 20, borderTop: "1px solid #DAE0E3" }}>
              <Link to="/usuarios" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 48, padding: "0 20px", borderRadius: 4, fontSize: 15, fontWeight: 700, textDecoration: "none", background: "#FFFFFF", color: "#1D1D1B", border: "1px solid #A7B3B7" }}>Cancelar</Link>
              <button type="submit" disabled={criar.isPending} style={{ minHeight: 48, padding: "0 20px", borderRadius: 4, fontSize: 15, fontWeight: 700, background: "#FFCC00", color: "#1D1D1B", border: 0, cursor: "pointer", opacity: criar.isPending ? 0.6 : 1 }}>
                {criar.isPending ? "Criando..." : "Criar usuário"}
              </button>
            </div>
          </form>
        </>
      )}
    </AdminShell>
  );
}
