import axios from "axios";

const USER_KEY = "lf_admin_user";

export type AuthUser = {
  usuarioId: string;
  nome: string;
  email: string;
  tipo: string;
};

export type SessaoWebResponse = {
  usuarioId: string;
  nome: string;
  email: string;
  tipo: string;
};

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  ativo: boolean;
  createdAt: string;
};

export type PageUsuarios = {
  paginacao: { totalPaginas: number; totalElementos: number; tamanhoPagina: number; paginaAtual: number };
  conteudo: Usuario[];
};

/** Hint local (não é credencial). Sessão real = cookie HttpOnly. */
export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

function saveUserHint(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = String(err.config?.url || "");
    if (err.response?.status === 401 && !url.includes("/auth")) {
      clearSession();
      if (!location.pathname.startsWith("/login")) location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export async function loginAdmin(email: string, senha: string) {
  const { data } = await api.post<SessaoWebResponse>("/api/admin-console/auth", { email, senha });
  if (data.tipo !== "ADMIN") throw new Error("Acesso só para admin");
  saveUserHint({
    usuarioId: data.usuarioId,
    nome: data.nome,
    email: data.email,
    tipo: data.tipo,
  });
  return data;
}

export async function meAdmin() {
  const { data } = await api.get<SessaoWebResponse>("/api/admin-console/auth/me");
  if (data.tipo !== "ADMIN") throw new Error("Sem sessão admin");
  saveUserHint({
    usuarioId: data.usuarioId,
    nome: data.nome,
    email: data.email,
    tipo: data.tipo,
  });
  return data;
}

export async function logoutAdmin() {
  try {
    await api.post("/api/admin-console/auth/logout");
  } finally {
    clearSession();
  }
}

export async function listarUsuarios(page = 0, size = 10) {
  const { data } = await api.get<PageUsuarios>("/api/admin/usuarios", { params: { page, size } });
  return data;
}

export async function criarUsuario(body: { nome: string; email: string; senha: string; tipo: "ADMIN" | "USER" }) {
  const { data } = await api.post<string>("/api/admin/usuarios", body);
  return data;
}

export async function atualizarUsuario(id: string, body: { nome: string; email: string; tipo: "ADMIN" | "USER"; ativo: boolean }) {
  await api.put(`/api/admin/usuarios/${id}`, body);
}

export async function deletarUsuario(id: string) {
  await api.delete(`/api/admin/usuario/${id}`);
}

export async function resetarSenha(id: string, senhaNova: string) {
  await api.post(`/api/admin/usuario/${id}/resetar-senha`, { senhaNova });
}

export default api;
